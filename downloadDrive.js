const dotenv = require("dotenv");
dotenv.config();

const CryptoJS = require('crypto-js');

const PDFJS = require('pdfjs-dist');

const { Client } = require('@elastic/elasticsearch');

// 'use strict'

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

async function indexFromDrive() {
    let datesObj = await readDatesFromSheet();

    // get files list from folder
    let response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${process.env.NEJAC_MINUTES_FOLDER_ID}'+in+parents&key=${process.env.GOOGLE_API_KEY}`);
    let data = await response.json();

    for (let file of data.files) {
        if (file.kind !== "drive#file") continue;
        if (file.mimeType !== "application/pdf") continue;
        if (!datesObj.hasOwnProperty(file.name)) {
            console.log(`Document not in spreadsheet: ${file.name}`);
            continue;
        }
        
        let arrayBuffer = await downloadPDF(file.id);

        console.log(`indexing doc: ${file.name}`)
        indexDocument(file.name, arrayBuffer, datesObj[file.name]);
        return;
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
    let response = await fetch(`https://drive.google.com/uc?export=download&id=${fileID}`);
    let arrayBuffer = await response.arrayBuffer();
    
    return arrayBuffer;
}

async function indexDocument(pdfFileName, arrayBuffer, documentDate) {
    await PDFJS.getDocument(arrayBuffer).promise.then(async (data) => {
        let documentContent = [];
        for (let i = 1; i <= data.numPages; i++) {
            await data.getPage(i).then(async (page) => {
                await page.getTextContent().then((content) => {
                    if (content.items.length === 0) return;

                    let pageText = content.items[0].str.toLowerCase();

                    for (let j = 1; j < content.items.length; j++) {
                        let currentY = content.items[j].transform[5];
                        let previousY = content.items[j-1].transform[5];
                        if (currentY != previousY) pageText += '\n';

                        pageText += content.items[j].str.toLowerCase();
                    }

                    documentContent.push(pageText);
                }).catch((error) => {
                    console.log(error);
                })
            }).catch((error) => {
                console.log(`error getting page ${i}`)
            })
        }

        try {
            let  = await client.index({
                index: process.env.ELASTIC_INDEX_NAME,
                id: CryptoJS.SHA256(pdfFileName).toString(),
                body: {
                    name: pdfFileName,
                    content: documentContent,
                    date: documentDate
                }
            });
    
            await client.indices.refresh({
                index: process.env.ELASTIC_INDEX_NAME
            });
            
            console.log(`successfully added document: ${pdfFileName}`)
        } catch (error) {
            console.log(error)
        }
        
    }).catch((error) => {
        console.log(`error reading pdf ${pdfFileName}`)
    }); 
}

indexFromDrive();

module.exports = {
    indexFromDrive
}