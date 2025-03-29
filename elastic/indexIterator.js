const indexIterator = async (f) => {
    let indexNames = [
        process.env.NEJAC_MINUTES_INDEX_NAME,
        process.env.EPA_BUDGET_JUSTIFICATIONS_INDEX_NAME,
        process.env.NEJAC_REPTS_1996_INDEX_NAME,
        process.env.NEJAC_REPTS_2014_INDEX_NAME
    ];

    for (let indexName of indexNames) await f(indexName)
}

module.exports = indexIterator