//
// Test searchDocuments script 
//

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

async function searchDocuments(query) {
    const result = await client.search({
        index: process.env.ELASTIC_INDEX_NAME,
        body: {
            query: {
                match_phrase: {
                    content: query
                }
            },
            highlight: {
                fields: {
                    content: {}
                }
            }
        }
    });

    console.log(result.hits.hits);
}

searchDocuments("epa")