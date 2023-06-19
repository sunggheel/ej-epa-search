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

app.get("/search", async (req, res) => {
    let searchQuery = req.query.query;

    try {
        let response = await elasticUtils.search(searchQuery);

        function countOccurrences(mainString, searchString) {
            return mainString.toLowerCase().split(searchString.toLowerCase()).length - 1;
        }
    
        // add number of occurences of search query
        response.forEach((item) => {
            let totalOccurrences = 0;
            for (let pageContent of item._source.content) {
                totalOccurrences += countOccurrences(pageContent, searchQuery);
            }

            item.occurrences = totalOccurrences;
        })
        
        // shorten text by 1 thousand
        // response.forEach((item) => {
        //     item._source.text = item._source.text.slice(0,1000);
        // });
    
        // attach pdf file bytes
        // response.forEach((item) => {
        //     item.bytes = fs.readFileSync(`pdfs/${item._source.name}`);
        // });
        
        return res.status(200).json(response);
    } catch (error) {
        console.log(error);
        return res.status(400).json([]);
    }
});

app.get("/pdf", async (req, res) => {
    let pdfFileName = req.query.name;
    let searchQuery = req.query.query;




})

// Serve static frontend app
app.use(express.static(path.join(__dirname, "frontend/")));

// if it doesnt match send index.html
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname + "/frontend/index.html"));
});