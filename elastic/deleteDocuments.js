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

async function deleteAllDocuments(indexName) {
    try {
        await client.deleteByQuery({
            index: indexName,            
            body: {
                query: {
                    match_all: {}
                }
            }
        });
    
        console.log("successfully deleted all documents");
    } catch (error) {
        console.log("couldnt delete all documents");
    }
}

indexIterator(deleteAllDocuments);