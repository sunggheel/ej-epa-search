const dotenv = require("dotenv")
dotenv.config();

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

async function countDocuments() {
    try {
        let result = await client.count({
            index: "search-db"
        });

        console.log(`Number of documents in search-db: ${result.count}`);
    } catch (error) {
        console.log("Couldnt count documents")
    }
}

async function countDocuments2() {
    try {
        let result = await client.search({
            index: 'search-db',
            body: {
                query: {
                    match_all: {}
                }
            }
        });

        console.log(`Number of documents in search-db: ${result.hits.hits.length}`);
    } catch (error) {
        console.log("Couldnt count documents")
    }
}

countDocuments();
countDocuments2();