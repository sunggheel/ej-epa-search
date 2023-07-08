const dotenv = require("dotenv");
dotenv.config();

const CryptoJS = require('crypto-js');

const PDFJS = require('pdfjs-dist');

const { Client } = require('@elastic/elasticsearch');

const {google} = require('googleapis');

const client = new Client({
    node: process.env.ELASTIC_URL,
    auth: {
        username: process.env.ELASTIC_USERNAME,
        password: process.env.ELASTIC_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});


const drive = google.drive({
    version: "v3",
    auth: process.env.GOOGLE_API_KEY
});

async function indexFromDrive() {
    // get already indexed files
    let result = await client.search({
        index: process.env.ELASTIC_INDEX_NAME,
        body: {
            size: 100,
            query: {
                match_all: {}
            }
        }
    });
    let existingFiles = new Set(result.hits.hits.map((a) => {return a._source.name}));

    // read dates from spreadsheet
    let datesObj = await readDatesFromSheet();

    // get files list from folder
    let response = await fetch(`https://www.googleapis.com/drive/v2/files?q='${process.env.NEJAC_MINUTES_FOLDER_ID}'+in+parents&key=${process.env.GOOGLE_API_KEY}`);
    let data = await response.json();

    for (let file of data.items) {
        // make sure its a pdf file
        if (file.kind !== "drive#file") continue;
        if (file.mimeType !== "application/pdf") continue;

        // make sure its in the spreadsheet
        if (!datesObj.hasOwnProperty(file.title)) {
            console.log(`Document not in spreadsheet: ${file.title}`);
            continue;
        }

        // make sure its not already indexed
        if (existingFiles.has(file.title)) {
            console.log(`Document already indexed: ${file.title}`);
            continue;
        } else {
            console.log(`Document not indexed: ${file.title}`);
        }

        let buffer = await downloadPDF(file.id);
        let arr = buffer.buffer;

        indexDocument(file.title, file.id, arr, datesObj[file.title]);
    }
}

async function readDatesFromSheet() {
    let response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${process.env.NEJAC_MINUTES_DATES_SHEET_ID}/values/A1:B100?key=${process.env.GOOGLE_API_KEY}`);
    let data = await response.json();

    let sheetValues = data.values;

    let datesObj = {};
    
    for (let [name, date] of sheetValues) datesObj[name] = date;
    
    return datesObj;
}

async function downloadPDF(fileID) {
    let res = await drive.files.get(
        {fileId: fileID, alt: "media"},
        {responseType: "stream"}
    );

    let chunks = [];
    for await (let chunk of res.data) {
        chunks.push(chunk)
    }
    return Buffer.concat(chunks);
}

async function indexDocument(pdfFileName, driveFileID, arr, documentDate) {
    try {
        console.log(`indexing doc: ${pdfFileName}`);

        let data = await PDFJS.getDocument(arr).promise;
        let documentContent = [];
        for (let i = 1; i <= data.numPages; i++) {
            let page = await data.getPage(i);
            let content = await page.getTextContent();

            if (content.items.length === 0) {
                documentContent.push("");
                continue;
            }

            let pageText = content.items[0].str.toLowerCase();

            for (let j = 1; j < content.items.length; j++) {
                let currentY = content.items[j].transform[5];
                let previousY = content.items[j-1].transform[5];
                if (currentY != previousY) pageText += '\n';

                pageText += content.items[j].str.toLowerCase();
            }

            documentContent.push(pageText);
        }
        
        await client.index({
            index: process.env.ELASTIC_INDEX_NAME,
            id: CryptoJS.SHA256(pdfFileName).toString(),
            body: {
                name: pdfFileName,
                content: documentContent,
                date: documentDate,
                driveFileID: driveFileID
            }
        });

        await client.indices.refresh({
            index: process.env.ELASTIC_INDEX_NAME
        });
        
        console.log(`successfully added document: ${pdfFileName}`);
    } catch (error) {
        console.log(error);
        console.log(`error indexing document: ${pdfFileName}`)
    }
}

module.exports = {
    indexFromDrive,
    downloadPDF
}