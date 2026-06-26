const path = require("path");
require("dotenv").config();

const { createServer } = require("http");
const { Server } = require("socket.io");
const { app, registerSocketHandlers } = require("./app");

const httpServer = createServer(app);

const allowedOrigins = [
    "http://localhost:5173",
    "https://noise-war-v84o.vercel.app",
    process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

registerSocketHandlers(io);

const PORT = process.env.PORT || 8080;

httpServer.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT} with Websockets!`));
