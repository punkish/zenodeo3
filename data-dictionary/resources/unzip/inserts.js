export const inserts = {
    insertUnzip: (db) => db.prepare(
        `INSERT INTO unzip (
            archives_id, 
            started, 
            ended,
            numOfFiles
        ) 
        VALUES (
            @archives_id, 
            @started, 
            @ended,
            @numOfFiles
        )`
    )
}