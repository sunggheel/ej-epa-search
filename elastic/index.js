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

async function add(pdfFileName) {
    let pdfFile = fs.readFileSync(`/pdfs/${pdfFileName}`);

    pdf(pdfFile).then((data) => {
        client.index({
            index: "search-db",
            body: {
                name: pdfFileName,
                text: data.text
            }
        })
    });
    await client.indices.refresh({
        index: 'search-db'
    })
}

async function search(query) {
    const result = await client.search({
        index: 'search-db',
        body: {
            query: {
                match_phrase: {
                    text: query
                }
            },
            highlight: {
                fields: {
                    text: {}
                }
            }
        }
    });

    return result.hits.hits;
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

async function deleteDocument(documentID) {
    await client.delete({
        index: "search-db",
        id: documentID
    })
}

module.exports = {
    add,
    search,
    deleteAllDocuments,
    deleteDocument
}