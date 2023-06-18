const dotenv = require("dotenv")
dotenv.config();

const fs = require("fs")
const pdf = require('pdf-parse')
const CryptoJS = require('crypto-js')
const { Client } = require('@elastic/elasticsearch')


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
    });
}

module.exports = {
    search,
    deleteAllDocuments,
    deleteDocument
}