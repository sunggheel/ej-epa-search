const dotenv = require("dotenv")
dotenv.config();

const fs = require("fs")
const pdf = require('pdf-parse')
const { Client } = require('@elastic/elasticsearch')

const CryptoJS = require('crypto-js');


'use strict'

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

async function add(pdfFileName) {
    let pdfFile = fs.readFileSync(`pdfs/${pdfFileName}`);

    pdf(pdfFile).then((data) => {
        client.index({
            index: "search-db",
            id: CryptoJS.SHA256(pdfFileName),
            body: {
                name: pdfFileName,
                text: data.text
            }
        });
    });
    await client.indices.refresh({
        index: 'search-db'
    })

    console.log(`successfully added document: ${pdfFileName}`)
}

async function search(searchQuery) {
    const result = await client.search({
        index: 'search-db',
        body: {
            query: {
                match_phrase: {
                    text: searchQuery
                }
            },
            highlight: {
                fields: {
                    text: {}
                }
            },
        }
    });

    return result.hits.hits;
}

function countOccurrences(mainString, searchString) {
    return mainString.toLowerCase().split(searchString.toLowerCase()).length - 1;
}

async function deleteAllDocuments() {
    await client.deleteByQuery({
        index: "search-db",            
        body: {
            query: {
                match_all: {}
            }
        }
    });
}

async function x() {
    let result = await add("MeetingSummaryDCMay94.pdf");
}

async function y() {
    let searchString = "national";

    let result = await search(searchString)
    
    console.log(countOccurrences(result[0]._source.text, searchString))
}

y()