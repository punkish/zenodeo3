export const inserts = {
    insertArchives: (db) => db.prepare(
        `INSERT INTO archives (
            typeOfArchive, 
            timeOfArchive,
            sizeOfArchive
        ) 
        VALUES (
            @typeOfArchive, 
            @timeOfArchive,
            @sizeOfArchive
        ) RETURNING id`
    )
}