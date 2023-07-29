const dotenv = require("dotenv")
dotenv.config();

const { Client } = require('@elastic/elasticsearch');

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

async function search(indexNames, query) {
    let boolQueryObj = {
        must: query.split(" AND ").map(keyword => ({ match: { content: keyword } }))
    }

    try {
        const result = await client.search({
            index: indexNames,
            body: {
                size: 1000,
                query: {
                    bool: boolQueryObj
                },
                highlight: {
                    fields: {
                        content: {type: "fvh"}
                    }
                }
            }
        });
        
        return result.hits.hits;
    } catch (error) {
        
    }
}

async function search2(indexNames, query) {
    try {
        const result = await client.search({
            index: indexNames,
            body: {
                size: 1000,
                query: {
                    match_phrase: {
                        content: query
                    }
                },
                highlight: {
                    fields: {
                        content: { type: "fvh" }
                    }
                }
            }
        });
        
        return result.hits.hits;
    } catch (error) {
        
    }
}

module.exports = {
    search
}