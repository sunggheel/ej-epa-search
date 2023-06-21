const express = require("express");
const path = require("path");
const fs = require('fs');
const dotenv = require("dotenv");
dotenv.config();
const elasticUtils = require("./elastic");
const { PDFDocument } = require('pdf-lib');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));

// Choose the port and start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Started express app on port ${PORT}`);
});

app.get("/search", async (req, res) => {
    try {
        let searchQuery = req.query.query;

        let response = await elasticUtils.search(searchQuery);

        const countOccurrences = (mainString, searchString) => {
            return mainString.toLowerCase().split(searchString.toLowerCase()).length - 1;
        }

        const pageHit = (pageContent, searchQuery) => {
            return pageContent.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1;
        }
    
        // add number of occurences of search query
        response.forEach((item) => {
            item.pageHits = [];
            item.occurrences = 0;

            for (let i = 0; i < item._source.content.length; i++) {
                let pageContent = item._source.content[i];

                // add page hits
                if (pageHit(pageContent, searchQuery)) item.pageHits.push(i);

                // add occurrence count
                item.occurrences += countOccurrences(pageContent, searchQuery);
            }
        });
        
        return res.status(200).json(response);
    } catch (error) {
        console.log(error);
        return res.status(400).json([]);
    }
});

app.get("/pdf", async (req, res) => {
    try {
        let pdfFileName = req.query.pdfFileName;

        let pdfFileBytes = fs.readFileSync(`pdfs/${pdfFileName}`);

        res.set('Content-Disposition', `attachment; filename="pdf/${pdfFileName}"`);
        res.set('Content-Type', 'application/pdf');
        res.send(pdfFileBytes);

        // return res.status(200).json(pdfFileBytes);
    } catch (error) {
        console.log(error);
        return res.status(400).json();
    }
});

app.post("/pdf", async (req, res) => {
    try {
        let pdfFileName = req.body.pdfFileName;
        let pageHits = req.body.pageHits;
    
        const existingPdfBytes = fs.readFileSync(`pdfs/${pdfFileName}`);
    
        const newPdfDoc = await PDFDocument.create();
    
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageHits);
        
        for (let copiedPage of copiedPages) {
            newPdfDoc.addPage(copiedPage);
        }
    
        const newPdfBytes = await newPdfDoc.save();
        
        return res.status(200).json(Buffer.from(newPdfBytes));

    } catch (error) {
        console.log(error);
        return res.status(400).json();
    }


});

// Serve static frontend app
app.use(express.static(path.join(__dirname, "frontend/")));

// if it doesnt match send index.html
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname + "/frontend/index.html"));
});