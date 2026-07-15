const path = require("path");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const client = require("./redisClient");
const { HASH_PREFIX, hashPassword, normalizeCredentials, verifyPassword } = require("./auth");
const { normalizeSabotageWords } = require("./sabotageWords");
 
const app = express();
app.use(express.json());
const allowedOrigins = [
    "http://localhost:5173",
    "https://noise-war-v84o.vercel.app",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

const getSabotageWordsKey = (username) => {
    return `user:${encodeURIComponent(username)}:sabotageWords`;
};

const getActiveUserKey = (username) => {
    return `active:user:${encodeURIComponent(username)}`;
};

app.post("/api/event/:eventId/login", async (req, res) => {
    const { eventId } = req.params;
    const { username, password } = req.body;
    const roomKey = `room:${eventId}:users`;

    try {
        const credentials = normalizeCredentials(username, password);

        if (!credentials) {
            return res.status(400).json({ error: "Username and password are required." });
        }

        const existingPassword = await client.hGet(roomKey, credentials.username);

        if (existingPassword == null) {
            return res.status(401).json({ error: "Invalid username or password." });
        }

        const isAuthenticated = await verifyPassword(credentials.password, existingPassword);

        if (!isAuthenticated) {
            return res.status(401).json({ error: "Invalid username or password." });
        }

        if (!existingPassword.startsWith(`${HASH_PREFIX}$`)) {
            await client.hSet(roomKey, credentials.username, await hashPassword(credentials.password));
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Failed to authenticate user: ", error);
        res.status(500).json({ error: "Failed to authenticate user." });
    }
});

app.post("/api/event/:eventId/signup", async (req, res) => {
    const { eventId } = req.params;
    const { username, password } = req.body;
    const roomKey = `room:${eventId}:users`;

    try {
        const credentials = normalizeCredentials(username, password);

        if (!credentials) {
            return res.status(400).json({ error: "Username and password are required." });
        }

        const existingPassword = await client.hGet(roomKey, credentials.username);

        if (existingPassword != null) {
            return res.status(409).json({ error: "Username is already taken." });
        }

        await client.hSet(roomKey, credentials.username, await hashPassword(credentials.password));
        res.json({ success: true });
    } catch (error) {
        console.error("Failed to create user: ", error);
        res.status(500).json({ error: "Failed to create user." });
    }
});

app.get("/api/user/:username/profile", async (req, res) => {
    try {
        const { username } = req.params;
        const savedWords = await client.get(getSabotageWordsKey(username));

        res.json({
            username,
            sabotageWords: savedWords ? JSON.parse(savedWords) : []
        });
    } catch (error) {
        console.error("Failed to fetch user profile: ", error);
        res.status(500).json({ error: "Failed to fetch user profile." });
    }
});

app.put("/api/user/:username/sabotage-words", async (req, res) => {
    try {
        const { username } = req.params;
        const sabotageWords = normalizeSabotageWords(req.body.sabotageWords);

        await client.set(
            getSabotageWordsKey(username),
            JSON.stringify(sabotageWords)
        );

        res.json({ success: true, sabotageWords });
    } catch (error) {
        console.error("Failed to save sabotage words: ", error);
        res.status(500).json({ error: "Failed to save sabotage words." });
    }
});

const registerSocketHandlers = (io) => {
    io.on("connection", (socket) => {
        socket.on("register-active-user", async (data = {}, callback) => {
            const respond = createSocketResponse(callback);

            try {
                const username = data.username?.toString().trim();

                if (!username) {
                    return respond({ success: false, error: "Username is required." });
                }

                const activeUserKey = getActiveUserKey(username);
                const previousSocketId = await client.get(activeUserKey);

                if (previousSocketId && previousSocketId !== socket.id) {
                    const previousSocket = io.sockets.sockets.get(previousSocketId);

                    if (previousSocket) {
                        previousSocket.emit("logged-out-elsewhere");
                        setTimeout(() => previousSocket.disconnect(true), 100);
                    }
                }

                await client.set(activeUserKey, socket.id, { EX: 7200 });
                socket.data.username = username;

                respond({ success: true });
            } catch (error) {
                console.error("Failed to register active user: ", error);
                respond({ success: false, error: "Failed to register active user." });
            }
        });

        socket.on("create-room", async (data = {}, callback) => {
            const respond = createSocketResponse(callback);

            try {
                const { username } = data;

                if (!username) {
                    return respond({ success: false, error: "You must be logged in to create a room." });
                }

                const roomCode = await generateRoomCode();
                const redisRoomKey = `game:room:${roomCode}`;

                await client.hSet(redisRoomKey, {
                    phase: "lobby",
                });

                await client.expire(redisRoomKey, 7200);
                socket.join(roomCode);
                socket.data.activeRoom = roomCode;
                respond({ success: true, roomCode: roomCode });
            } catch (error) {
                console.error("Redis database error: ", error);
                respond({ success: false, error: "Database was unable to allocate a match room." });
            }
        });

        socket.on("join-room", async (data = {}, callback) => {
            const respond = createSocketResponse(callback);

            try {
                const { username } = data;
                const roomCode = data.roomCode?.toString().toUpperCase();

                if (!roomCode || !username) {
                    return respond({ success: false, error: "Room code and username are required." });
                }

                const redisRoomKey = `game:room:${roomCode}`;
                const redisPlayersKey = `${redisRoomKey}:players`

                const roomExists = await client.exists(redisRoomKey);
                if (!roomExists) {
                    return respond({ success: false, error: "Room not found or expired." });
                }

                const playerCount = await client.lLen(redisPlayersKey);

                if (playerCount >= 2) {
                    return respond({ success: false, error: "Room is already full." });
                }

                const player = {
                    socketId: socket.id,
                    username
                };

                await client.rPush(redisPlayersKey, JSON.stringify(player));
                await client.expire(redisPlayersKey, 7200);
                socket.join(roomCode);
                socket.data.activeRoom = roomCode;
                socket.data.username = username
                io.to(roomCode).emit("player-joined", {
                    playerCount: playerCount + 1,
                    username: username
                });
                respond({ success: true});
            } catch (error) {
                console.error("Redis join error: ", error);
                respond({ success: false, error: "Failed to join room." });
            }
        });

        socket.on("start-game", async (data = {}, callback) => {
            const respond = createSocketResponse(callback);

            try {
                const roomCode = data.roomCode?.toString().toUpperCase();
                if (!roomCode) {
                    return respond({ success: false, error: "Room code is required." });
                }

                const redisRoomKey = `game:room:${roomCode}`;
                const redisPlayersKey = `${redisRoomKey}:players`
                const playerCount = await client.lLen(redisPlayersKey);

                if (playerCount < 2) {
                    return respond({
                        success: false,
                        error: "Room is not yet full!"
                    });
                }
                //for testing
                //const duration = 0.25 * 60 * 1000;
                const duration = 1 * 60 * 1000;
                const startedAt = Date.now();
                const endsAt = startedAt + duration;

                await client.hSet(redisRoomKey, {
                    phase: "playing",
                    startedAt: startedAt,
                    endsAt: endsAt
                });

                io.to(roomCode).emit("game-started", {
                    roomCode,
                    startedAt,
                    endsAt
                });

                setTimeout(async () => {
                    const currentRoom = await client.hGetAll(redisRoomKey);

                    if (!currentRoom || currentRoom.phase !== "playing") {
                        return;
                    }

                    const currentEndsAt = Number(currentRoom.endsAt);

                    if (Date.now() >= currentEndsAt) {
                        await client.hSet(redisRoomKey, {
                            phase: "game-end"
                        });

                        io.to(roomCode).emit("game-over", {
                            reason: "Time Out"
                        });
                    }
                }, duration);

                respond({ success: true });
            } catch (error) {
                console.error("start-game error:", error);
                respond({
                    success: false,
                    error: "Failed to start game."
                });
            }
        });

        socket.on("send-sabotage", (data = {}) => {
            const { roomCode, type = "pause", word = "" } = data;

            if (!roomCode) {
                return;
            }

            socket.to(roomCode).emit("receive-sabotage", { type, word });
        });

        socket.on("player-finished", async (data = {}) => {
            try {
                const { roomCode, username } = data;

                if (!roomCode || !username) {
                    return;
                }

                const redisRoomKey = `game:room:${roomCode}`;

                await client.hSet(redisRoomKey, {
                    phase: "game-end"
                });

                io.to(roomCode).emit("game-clear", { winner: username });
            } catch (error) {
                console.error("Redis finish error: ", error);
            }
        });

        socket.on("disconnect", async () => {
            try {
                if (socket.data.username) {
                    const activeUserKey = getActiveUserKey(socket.data.username);
                    const activeSocketId = await client.get(activeUserKey);

                    if (activeSocketId === socket.id) {
                        await client.del(activeUserKey);
                    }
                }

                if (socket.data.activeRoom) {
                    const roomCode = socket.data.activeRoom;
                    const redisRoomKey = `game:room:${roomCode}`;
                    const redisPlayersKey = `${redisRoomKey}:players`;
                    
                    const username = socket.data.username; 
                    const player = {
                        socketId: socket.id,
                        username
                    };
                    await client.lRem(redisPlayersKey, 0, JSON.stringify(player));
                    const playerCount = await client.lLen(redisPlayersKey);
                    
                    let isRoomOpen = true; 

                    if (playerCount === 0) {
                        //delete room and players key
                        await client.del(redisPlayersKey);
                        await client.del(redisRoomKey);
                        isRoomOpen = false;
                    }
                    socket.to(roomCode).emit("player-disconnected", {
                        username: username,
                        isRoomOpen: isRoomOpen
                    });
                }
            } catch (error) {
                console.error("Redis disconnect cleanup error: ", error);
            }
        });

        socket.on("leave-room", async () => {
            try {
                if (socket.data.activeRoom) {
                    const roomCode = socket.data.activeRoom;
                    const redisRoomKey = `game:room:${roomCode}`;
                    const redisPlayersKey = `${redisRoomKey}:players`;
                    
                    const username = socket.data.username; 
                    const player = {
                        socketId: socket.id,
                        username
                    };
                    await client.lRem(redisPlayersKey, 0, JSON.stringify(player));
                    const playerCount = await client.lLen(redisPlayersKey);
                    
                    let isRoomOpen = true; 

                    if (playerCount === 0) {
                        //delete room and players key
                        await client.del(redisPlayersKey);
                        await client.del(redisRoomKey);
                        isRoomOpen = false;
                    }
                    socket.to(roomCode).emit("player-left", {
                        username: username,
                        isRoomOpen: isRoomOpen
                    });
                }
            } catch (error) {
                console.error("Redis disconnect cleanup error: ", error);
            }
        });
    });
};

// Generates a random 4 digit room code
const generateRoomCode = async () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let isUnique = false;
    let code = "";

    while (!isUnique) {
        code = "";

        for (let i = 0; i < 4; i++) {
            code += chars.at(Math.floor(Math.random() * chars.length));
        }

        const redisRoomKey = `game:room:${code}`;

        const keyExists = await client.exists(redisRoomKey);

        // If the generated code does not exist, the loop breaks
        if (keyExists == 0) {
            isUnique = true;
        }
    }

    return code;
};

const createSocketResponse = (callback) => {
    if (typeof callback === "function") {
        return callback;
    }

    return () => {};
};

module.exports = { app, registerSocketHandlers };
