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
                        content: {type: "fvh"}
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