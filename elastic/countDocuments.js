//
// To count the number documents per index
//

const dotenv = require("dotenv")
dotenv.config();

const { Client } = require('@elastic/elasticsearch');
const indexIterator = require("./indexIterator");

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

async function countDocuments(indexName) {
    try {
        let result = await client.count({
            index: indexName
        });

        console.log(`Number of documents in ${indexName}: ${result.count}`);
    } catch (error) {
        console.log("Couldnt count documents");
    }
}

async function countDocuments2(indexName) {
    try {
        let result = await client.search({
            index: indexName,
            body: {
                size: 100,
                query: {
                    match_all: {}
                }
            }
        });

        console.log(`Number of documents in ${indexName}: ${result.hits.hits.length}`);
    } catch (error) {
        console.log("Couldnt count documents");
    }
}

indexIterator(countDocuments);
// indexIterator(countDocuments2);