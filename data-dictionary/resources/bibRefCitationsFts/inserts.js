export const inserts = {
    insertBibRefCitationsFts: (db) => db.prepare(`
INSERT INTO bibRefCitationsFts (rowid, fulltext) 
SELECT id, fulltext FROM bibRefCitations`)
}