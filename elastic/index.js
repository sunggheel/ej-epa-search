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

// async function search(query) {
//     const result = await client.search({
//         index: process.env.ELASTIC_INDEX_NAME,
//         body: {
//             query: {
//                 match_phrase: {
//                     "content": query
//                 }
//             },
//             highlight: {
//                 fields: {
//                     "content": {},
//                 }
//             }
//         }
//     });

//     return result.hits.hits;
// }

async function search(indexNames, query) {
    try {
        let results = [];
        for (let indexName of indexNames) {
            const result = await client.search({
                index: indexName,
                body: {
                    query: {
                        match_phrase: {
                            content: query
                        }
                    },
                    highlight: {
                        fields: {
                            content: {type: "fvh"}
                        }
                    }
                }
            });

            results = results.concat(result.hits.hits);
        }
        
        return results;
    } catch (error) {
        
    }
}

module.exports = {
    search
}