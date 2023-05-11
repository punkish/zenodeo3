export const inserts = {
    selectBibRefCitations_id: (db) => db.prepare(`SELECT id AS bibRefCitations_id 
FROM bibRefCitations 
WHERE bibRefCitationId = ?`),
    
    insertBibRefCitation: (db) => db.prepare(`
INSERT INTO bibRefCitations (
    bibRefCitationId,
    DOI,
    author,
    journalOrPublisher,
    title,
    refString,
    type,
    year,
    innertext,
    treatments_id
)
VALUES ( 
    @bibRefCitationId,
    @DOI,
    @author,
    @journalOrPublisher,
    @title,
    @refString,
    @type,
    @year,
    @innertext,
    @treatments_id
)
ON CONFLICT (bibRefCitationId) 
DO UPDATE SET
    DOI=excluded.DOI,
    author=excluded.author,
    journalOrPublisher=excluded.journalOrPublisher,
    title=excluded.title,
    refString=excluded.refString,
    type=excluded.type,
    year=excluded.year,
    innertext=excluded.innertext,
    treatments_id=excluded.treatments_id`)
}