require("dotenv").config();

const { createClient } = require("redis");

const client = createClient({
    url: process.env.REDIS_URL
});

client.connect()
    .then(() => console.log("Connected to Redis!"))

module.exports = client;

