const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));

// Choose the port and start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Started express app on port ${PORT}`);
});

// init db
const db = require("./db");
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Serve static frontend app
app.use(express.static(path.join(__dirname, "frontend/build")));

// if it doesnt match send index.html
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname + "/frontend/index.html"));
});

