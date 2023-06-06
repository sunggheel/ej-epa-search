const express = require("express");
const path = require("path");
const fs = require('fs');
const dotenv = require("dotenv");
dotenv.config();

const pdfjs = require("pdfjs-dist")

const elasticUtils = require("./elastic");

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

app.get("/search", async (req, res) => {
    let searchQuery = req.query.query;
    
    let response = await elasticUtils.search(searchQuery);
    
    response.forEach((item) => {
        item._source.text = item._source.text.slice(0,1000);
    });

    
    return res.status(200).json(response);
})

// Serve static frontend app
app.use(express.static(path.join(__dirname, "frontend/")));

// if it doesnt match send index.html
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname + "/frontend/index.html"));
});