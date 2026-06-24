const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { createServer } = require("http");
const { Server } = require("socket.io");
const { app, registerSocketHandlers } = require("./app");

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

registerSocketHandlers(io);

httpServer.listen(8080, () => console.log("Server running on port 8080 with Websockets!"));
