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

async function deleteAllDocuments() {
    try {
        await client.deleteByQuery({
            index: "search-db",            
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

deleteAllDocuments();