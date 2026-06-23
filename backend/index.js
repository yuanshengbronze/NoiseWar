require("dotenv").config();

const express = require("express");
const cors = require("cors");

const client = require("./redisClient");
 
const app = express();
app.use(express.json());
app.use(cors());


app.post('/api/event/:eventId/login', async (req, res) => {
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
            res.status(401).json({ error: "Username is taken / Wrong password! "});
        }
    }
})

const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log(`A user is connected: ${socket.id}`);

    socket.on("create-room", async (data, callback) => {
        try {
            const { username } = data;

            if (!username) {
                return callback({ success: false, error: "You must be logged in to create a room." });
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

            callback({ success: true, roomCode: roomCode });
        } catch (error) {
            console.error("Redis database error: ", error);
            callback({ success: false, error: "Database was unable to allocate a match room."});
        }
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});


// Generates a random 4 digit room code
const generateRoomCode = async () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let isUnique = false;
    let code = "";

    while (!isUnique) {
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
}

httpServer.listen(8080, () => console.log("Server running on port 8080 with Websockets!"));