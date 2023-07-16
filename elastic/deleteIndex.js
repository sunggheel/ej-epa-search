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

const deleteIndex = async (indexName) => {
    try {
        await client.indices.delete({
            index: indexName
        });
    
        console.log(`successfully deleted index: ${indexName}`)
    } catch(error) {
        console.log("couldnt delete index")
    }
}

indexIterator(deleteIndex);