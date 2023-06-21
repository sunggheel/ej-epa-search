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

const deleteIndex = async () => {
    try {
        await client.indices.delete({
            index: process.env.ELASTIC_INDEX_NAME
        });
    
        console.log("successfully deleted index")
    } catch(error) {
        console.log("couldnt delete index")
    }
}

deleteIndex();