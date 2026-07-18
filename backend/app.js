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

const getStatsKey = (username) => {
    return `user:${encodeURIComponent(username)}:stats`;
};

const getUserStats = async (username) => {
    const stats = await client.hGetAll(getStatsKey(username));

    return {
        matchesPlayed: Number(stats.matchesPlayed || 0),
        wins: Number(stats.wins || 0),
        losses: Number(stats.losses || 0)
    };
};

const recordMatchResult = async (username, result) => {
    const statsKey = getStatsKey(username);

    await client.hIncrBy(statsKey, "matchesPlayed", 1);
    await client.hIncrBy(statsKey, result, 1);

    return getUserStats(username);
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
        const stats = await getUserStats(username);

        res.json({
            username,
            sabotageWords: savedWords ? JSON.parse(savedWords) : [],
            stats
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
                    phase: "lobby"
                });

                await client.expire(redisRoomKey, 7200);

                const player = {
                    socketId: socket.id,
                    username
                };
                const redisPlayersKey = `${redisRoomKey}:players`;
                await client.rPush(redisPlayersKey, JSON.stringify(player));
                await client.expire(redisPlayersKey, 7200);

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
                const existingPlayers = await client.lRange(redisPlayersKey, 0, -1);
                const isAlreadyInRoom = existingPlayers.some((playerJson) => {
                    try {
                        const player = JSON.parse(playerJson);
                        return player.socketId === socket.id || player.username === username;
                    } catch {
                        return false;
                    }
                });

                if (playerCount >= 2 && !isAlreadyInRoom) {
                    return respond({ success: false, error: "Room is already full." });
                }

                if (!isAlreadyInRoom) {
                    const player = {
                        socketId: socket.id,
                        username
                    };

                    await client.rPush(redisPlayersKey, JSON.stringify(player));
                    await client.expire(redisPlayersKey, 7200);
                }

                socket.join(roomCode);
                socket.data.activeRoom = roomCode;
                socket.data.username = username
                io.to(roomCode).emit("player-joined", {
                    playerCount: isAlreadyInRoom ? playerCount : playerCount + 1,
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
                const room = await client.hGetAll(redisRoomKey);

                if (room?.phase === "playing") {
                    return respond({
                        success: false,
                        error: "Game is already in progress."
                    });
                }

                if (playerCount < 2) {
                    return respond({
                        success: false,
                        error: "Room is not yet full!"
                    });
                }

                //for testing
                //const maze = generateMaze(9, 9)
                const maze = generateMaze(17, 17)
                
                //for testing
                //const duration = 0.25 * 60 * 1000;
                const duration = 2 * 60 * 1000;
                const startedAt = Date.now();
                const endsAt = startedAt + duration;

                await client.hSet(redisRoomKey, {
                    phase: "playing",
                    startedAt: startedAt,
                    endsAt: endsAt,
                });

                io.to(roomCode).emit("game-started", {
                    roomCode,
                    startedAt,
                    endsAt,
                    maze
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
                const roomCode = data.roomCode?.toString().toUpperCase();
                const username = data.username;

                if (!roomCode || !username) {
                    return;
                }

                const redisRoomKey = `game:room:${roomCode}`;
                const redisPlayersKey = `${redisRoomKey}:players`;
                const room = await client.hGetAll(redisRoomKey);

                if (!room || room.phase !== "playing") {
                    return;
                }

                const playerJsonList = await client.lRange(redisPlayersKey, 0, -1);
                const players = playerJsonList
                    .map((playerJson) => {
                        try {
                            return JSON.parse(playerJson);
                        } catch {
                            return null;
                        }
                    })
                    .filter(Boolean);
                const winner = players.find((player) => player.username === username);

                if (!winner) {
                    return;
                }

                await client.hSet(redisRoomKey, {
                    phase: "lobby"
                });

                const updatedStatsByUsername = {};

                for (const player of players) {
                    const result = player.username === username ? "wins" : "losses";
                    updatedStatsByUsername[player.username] = await recordMatchResult(player.username, result);
                }

                io.to(roomCode).emit("game-clear", {
                    winner: username,
                    stats: updatedStatsByUsername
                });
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
                        await client.del(redisPlayersKey);
                        await client.del(redisRoomKey);
                        isRoomOpen = false;
                    }

                    await client.hSet(redisRoomKey, {
                        phase: "lobby"
                    });
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

function generateMaze(width, height) {
    const FLOOR_TILE = 226;
    const WALL_TILE = 367;
    const START_TILE = 529;
    const END_TILE = 532;

    if (width % 2 === 0) {
        width--;
    }

    if (height % 2 === 0) {
        height--;
    }

    const maze = {
        mazeArray: Array.from({ length: height }, () => Array(width).fill(WALL_TILE)),
        start: [1, 1],
        end: [1, 1]
    }

    const mazeArray = maze.mazeArray;

    const shuffle = (items) => {
        for (let i = items.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));

            [items[i], items[randomIndex]] = [
                items[randomIndex],
                items[i]
            ];
        }
        return items;
    };

    const carve = (x, y) => {
        mazeArray[y][x] = FLOOR_TILE;

        const directions = shuffle([
            { x: 0, y: -2 },
            { x: 0, y: 2 },
            { x: -2, y: 0 },
            { x: 2, y: 0 }
        ]);

        for (const direction of directions) {
            const nextX = x + direction.x;
            const nextY = y + direction.y;

            const insideMap =
                nextX > 0 &&
                nextX < width - 1 &&
                nextY > 0 &&
                nextY < height - 1;

            if (!insideMap || mazeArray[nextY][nextX] !== WALL_TILE) {
                continue;
            }

            const wallX = x + direction.x / 2;
            const wallY = y + direction.y / 2;

            mazeArray[wallY][wallX] = FLOOR_TILE;

            carve(nextX, nextY);
        }
    };

    carve(1, 1);

    const start = { x: 1, y: 1 };
    const queue = [
        {
            x: start.x,
            y: start.y,
            distance: 0
        }
    ];

    const visited = Array.from(
        { length: height },
        () => Array(width).fill(Infinity)
    );

    visited[start.y][start.x] = 0;

    let farthest = {
        x: start.x,
        y: start.y,
        distance: 0
    };

    const directions = [
        { x: 0, y: -1 }, // Up
        { x: 0, y: 1 },  // Down
        { x: -1, y: 0 }, // Left
        { x: 1, y: 0 }   // Right
    ];

    while (queue.length > 0) {
        const current = queue.shift();

        if (!current) {
            break;
        }

        const { x, y, distance } = current;

        for (const direction of directions) {
            const nextX = x + direction.x;
            const nextY = y + direction.y;

            const insideMap =
                nextX > 0 &&
                nextX < width - 1 &&
                nextY > 0 &&
                nextY < height - 1;

            if (!insideMap || mazeArray[nextY][nextX] === WALL_TILE || visited[nextY][nextX] !== Infinity) {
                continue;
            }

            const nextDistance = distance + 1;
            visited[nextY][nextX] = nextDistance;

            queue.push({
                x: nextX,
                y: nextY,
                distance: nextDistance
            });

            if (nextDistance > farthest.distance) {
                farthest = {
                    x: nextX,
                    y: nextY,
                    distance: nextDistance
                };
            }
        }
    }
    
    mazeArray[farthest.y][farthest.x] = END_TILE
    maze.end = [farthest.y, farthest.x]
    mazeArray[1][1] = START_TILE
    return maze;
}

module.exports = { app, registerSocketHandlers };
