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

app.listen(8080, () => console.log("Server running on port 8080!"));