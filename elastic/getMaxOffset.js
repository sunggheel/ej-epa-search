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

const getMaxOffset = async () => {
    try {
        let result = await client.indices.getSettings({
            index: process.env.ELASTIC_INDEX_NAME
        });
        const maxAnalyzedOffset = result[process.env.ELASTIC_INDEX_NAME].settings.index;

        console.log('highlight.max_analyzed_offset:', maxAnalyzedOffset);
    } catch (error) {
        console.log("couldnt get max offset");
    }
}

getMaxOffset()