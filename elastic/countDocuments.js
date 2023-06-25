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
            index: process.env.ELASTIC_INDEX_NAME
        });

        console.log(`Number of documents in ${process.env.ELASTIC_INDEX_NAME}: ${result.count}`);
    } catch (error) {
        console.log("Couldnt count documents")
    }
}

async function countDocuments2() {
    try {
        let result = await client.search({
            index: process.env.ELASTIC_INDEX_NAME,
            body: {
                size: 100,
                query: {
                    match_all: {}
                }
            }
        });

        console.log(`Number of documents in ${process.env.ELASTIC_INDEX_NAME}: ${result.hits.hits.length}`);
    } catch (error) {
        console.log("Couldnt count documents")
    }
}

countDocuments();
countDocuments2();