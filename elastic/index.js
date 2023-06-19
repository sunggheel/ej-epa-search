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

async function search(query) {
    const result = await client.search({
        index: 'search-db',
        body: {
            query: {
                terms: {
                    content: [query]
                }
            },
            highlight: {
                fields: {
                    content: {}
                }
            }
        }
    });

    return result.hits.hits;
}

module.exports = {
    search
}