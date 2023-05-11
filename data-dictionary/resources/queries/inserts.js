export const inserts = {
    insertQueryStats: (db) => db.prepare(
        `INSERT INTO queries (
            queryId,
            search,
            sql
        )
        VALUES (
            @webQueryId,
            @sqlQueryId,
            @timeTaken
        )`
    )
}