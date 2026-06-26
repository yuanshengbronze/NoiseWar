const path = require("path");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const client = require("./redisClient");
 
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

const normalizeSabotageWords = (words) => {
    if (!Array.isArray(words)) {
        return [];
    }

    const seenWords = new Set();

    return words
        .filter((word) => typeof word === "string")
        .map((word) => word.trim().toLowerCase())
        .filter((word) => {
            if (!word || seenWords.has(word)) {
                return false;
            }

            seenWords.add(word);
            return true;
        });
};

app.post("/api/event/:eventId/login", async (req, res) => {
    const { eventId } = req.params;
    const { username, password } = req.body;
    const roomKey = `room:${eventId}:users`;

    // Get current password
    const existingPassword = await client.hGet(roomKey, username);

    if (existingPassword == null) {
        // If username doesn't exist, update the new data.
        await client.hSet(roomKey, username, password);
        res.json({ success: true });
    } else {
        if (existingPassword == password) {
            // Correct password!
            res.json({ success: true });
        } else {
            // Wrong password!
            res.status(401).json({ error: "Username is taken / Wrong password! " });
        }
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
        console.log(`A user is connected: ${socket.id}`);

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
                    host: socket.id,
                    hostUsername: username,
                    phase: "lobby",
                    createdAt: Date.now().toString()
                });

                await client.expire(redisRoomKey, 7200);

                console.log(`Redis: Room ${roomCode} created by User: ${username} (${socket.id})`);

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
                const roomExists = await client.exists(redisRoomKey);
                if (!roomExists) {
                    return respond({ success: false, error: "Room not found or expired." });
                }

                const roomData = await client.hGetAll(redisRoomKey);
                if (roomData.guest) {
                    return respond({ success: false, error: "Room is already full." });
                }

                await client.hSet(redisRoomKey, {
                    guest: socket.id,
                    guestUsername: username,
                    phase: "playing"
                });

                socket.join(roomCode);
                socket.data.activeRoom = roomCode;

                io.to(roomCode).emit("game-started", {
                    host: roomData.hostUsername,
                    guest: username
                });

                respond({ success: true, roomCode: roomCode });
            } catch (error) {
                console.error("Redis join error: ", error);
                respond({ success: false, error: "Failed to join room." });
            }
        });

        socket.on("send-sabotage", (data = {}) => {
            const { roomCode, type } = data;

            if (!roomCode || !type) {
                return;
            }

            socket.to(roomCode).emit("receive-sabotage", { type });
        });

        socket.on("player-finished", async (data = {}) => {
            try {
                const { roomCode, username } = data;

                if (!roomCode || !username) {
                    return;
                }

                const redisRoomKey = `game:room:${roomCode}`;

                await client.hSet(redisRoomKey, { phase: "finished" });

                io.to(roomCode).emit("game-over", { winner: username });
            } catch (error) {
                console.error("Redis finish error: ", error);
            }
        });

        socket.on("disconnect", async () => {
            console.log(`User disconnected: ${socket.id}`);

            try {
                if (socket.data.activeRoom) {
                    const roomCode = socket.data.activeRoom;

                    socket.to(roomCode).emit("opponent-disconnected");

                    await client.del(`game:room:${roomCode}`);
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