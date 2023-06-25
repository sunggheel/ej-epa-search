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

const createIndex = async () => {
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
                }
            }
        }

        await client.indices.create({
            index: process.env.ELASTIC_INDEX_NAME,
            body: {
                mappings
            }
        })
    
        console.log("successfully created index")
    } catch(error) {
        console.log("couldnt create index")
    }
}

createIndex();