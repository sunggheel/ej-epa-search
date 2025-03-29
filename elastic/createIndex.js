//
// To create indices after adding a new collection
//

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

const createIndex = async (indexName) => {
    try {
        let mappings = {
            properties: {
                name: {
                    type: "text",
                    fields: {
                        keyword: {
                            type: "keyword",
                        }
                    }
                },
                content: {
                    type: "text",
                    term_vector: "with_positions_offsets",
                    fields: {
                        keyword: {
                            type: "keyword"
                        }
                    }
                },
                date: {
                    type: "text",
                    fields: {
                        keyword: {
                            type: "keyword"
                        }
                    }
                },
                driveFileID: {
                    type: "text",
                    fields: {
                        keyword: {
                            type: "keyword"
                        }
                    }
                }
            }
        }

        await client.indices.create({
            index: indexName,
            body: {
                mappings
            }
        })
    
        console.log(`successfully created index: ${indexName}`)
    } catch(error) {
        console.log("couldnt create index")
    }
}

indexIterator(createIndex);