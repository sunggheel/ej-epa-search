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

const getMapping = async (indexName) => {
    try {
        let result = await client.indices.getMapping({
            index: indexName
        });
        console.log(`${indexName} mapping:`);
        console.log(result[indexName].mappings.properties);
        console.log();
    } catch (error) {
        console.log("couldnt get mapping")
    }
}

indexIterator(getMapping);