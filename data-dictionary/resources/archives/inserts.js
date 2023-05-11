export const inserts = {
    insertArchivesGet_archives_id: (db) => db.prepare(`
INSERT INTO archives (
    typeOfArchive, 
    timeOfArchive,
    sizeOfArchive
) 
VALUES (
    @typeOfArchive, 
    @timeOfArchive,
    @sizeOfArchive
)`)
}