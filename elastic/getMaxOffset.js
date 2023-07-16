const dotenv = require("dotenv");
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

const getMaxOffset = async (indexName) => {
    try {
        let result = await client.indices.getSettings({
            index: indexName
        });
        const maxAnalyzedOffset = result[indexName].settings.index;

        console.log('highlight.max_analyzed_offset:', maxAnalyzedOffset);
    } catch (error) {
        console.log("couldnt get max offset");
    }
}

indexIterator(getMaxOffset)