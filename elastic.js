const dotenv = require("dotenv")
dotenv.config();

const fs = require("fs")
const pdf = require('pdf-parse')
const { Client } = require('@elastic/elasticsearch')

'use strict'


const client = new Client({
    cloud: {
        id: process.env.ELASTIC_CLOUD_ID
    },
    auth: {
        apiKey: process.env.ELASTIC_API_KEY
    }
})

let pdfFile = fs.readFileSync("./report.pdf");

async function add() {
    pdf(pdfFile).then((data) => {
        client.index({
            index: "search-db",
            body: {
                text: data.text,
                buffer: pdfFile
            }
        })
    })

    // here we are forcing an index refresh, otherwise we will not
    // get any result in the consequent search
    await client.indices.refresh({
        index: 'search-db'
    })
}

async function search() {
    // Let's search!
    const result = await client.search({
        index: 'search-db',
        body: {
            query: {
                match: {
                    text: "mangolemon"
                }
            }
        }
    })

    console.log(result.hits.hits)
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

async function deleteDocument() {
    await client.delete({
        index: "search-db",
        id: "nVefhIgBHq9c8gxVTdpt"
    })
}

search()