const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const elasticUtils = require("./elastic");

const driveUtils = require("./drive");

const { PDFDocument } = require('pdf-lib');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));

// Choose the port and start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Started express app on port ${PORT}`);
});

app.get("/api/search", async (req, res) => {
    try {
        let collectionNames = [req.query.collectionName];

        if (req.query.collectionName === "all-collections") {
            collectionNames = [
                process.env.NEJAC_MINUTES_INDEX_NAME,
                process.env.EPA_BUDGET_JUSTIFICATIONS_INDEX_NAME,
                process.env.NEJAC_REPTS_1996_INDEX_NAME,
                process.env.NEJAC_REPTS_2014_INDEX_NAME 
            ];
        }
        
        let searchQuery = req.query.query;

        let response = await elasticUtils.search(collectionNames, searchQuery);

        const searchQueryRegex = (searchQuery) => {
            const escapedDelimiters = searchQuery.split(" AND ")
                .map(delimeter => delimeter.toLowerCase())
                .map(delimiter => delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            );
            return new RegExp(escapedDelimiters.join("|"), 'g');
        }

        const countHits = (mainString, searchQuery) => {
            const regex = searchQueryRegex(searchQuery);
            return mainString.toLowerCase().split(regex).length - 1;
        }

        const pageHit = (pageContent, searchQuery) => {
            const regex = searchQueryRegex(searchQuery);
            return regex.test(pageContent);
        }
    
        // add number of hits of search query
        response.forEach((item) => {
            item.pageHits = [];
            item.hits = 0;

            for (let i = 0; i < item._source.content.length; i++) {
                let pageContent = item._source.content[i];

                // add page hits
                if (pageHit(pageContent, searchQuery)) item.pageHits.push(i);

                // add hit count
                item.hits += countHits(pageContent, searchQuery);
            }

            item._source.content = null;
        });

        response.sort((a, b) => {
            return -(a.hits - b.hits);
        });
        
        return res.status(200).json(response);
    } catch (error) {
        console.log(error);
        return res.status(400).json([]);
    }
});

app.post("/api/pdf", async (req, res) => {
    try {
        let driveFileID = req.body.driveFileID;
        let pageHits = req.body.pageHits;

        const existingPdfBytes = await driveUtils.downloadPDF(driveFileID);
    
        const newPdfDoc = await PDFDocument.create();
    
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageHits);
        
        for (let copiedPage of copiedPages) {
            newPdfDoc.addPage(copiedPage);
        }
    
        const newPdfBytes = await newPdfDoc.save();
        res.set('Content-Disposition', `attachment; filename="${driveFileID}"`);
        res.set('Content-Type', 'application/pdf');
        return res.status(200).send(Buffer.from(newPdfBytes))

    } catch (error) {
        console.log(error);
        return res.status(400).json();
    }
});

if (process.env.LOCAL) {
    // Serve static frontend app
    app.use(express.static(path.join(__dirname, "frontend/")));

    // if it doesnt match send index.html
    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname + "/frontend/index.html"));
    });
}

// Setting up the frequency of the elastic indexing, if needed
// 
// let millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000
// setInterval(driveUtils.indexFromDrive, millisecondsPerWeek);