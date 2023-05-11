export const inserts = {
    insertDownloads: (db) => db.prepare(
        `INSERT INTO downloads (
            archives_id, 
            started, 
            ended
        ) 
        VALUES (
            @archives_id, 
            @started, 
            @ended
        )`
    )
}