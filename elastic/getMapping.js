const dotenv = require("dotenv");
dotenv.config();

const { Client } = require('@elastic/elasticsearch');

// 'use strict'

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

const getMapping = async () => {
    try {
        let result = await client.indices.getMapping({
            index: process.env.ELASTIC_INDEX_NAME
        });
        console.log(result[process.env.ELASTIC_INDEX_NAME].mappings.properties);
    } catch (error) {
        console.log("couldnt get mapping")
    }
}

getMapping()