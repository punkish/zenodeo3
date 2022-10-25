const tables = [
    {
        name: 'bibRefCitations',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS bibRefCitations ( 
    id INTEGER PRIMARY KEY,
    bibRefCitationId TEXT NOT NULL UNIQUE COLLATE NOCASE,
    treatmentId TEXT NOT NULL COLLATE NOCASE,
    author TEXT COLLATE NOCASE,
    journalOrPublisher TEXT COLLATE NOCASE,
    title TEXT COLLATE NOCASE, 
    refString TEXT COLLATE NOCASE,
    type TEXT COLLATE NOCASE,
    year TEXT COLLATE NOCASE,
    innerText TEXT COLLATE NOCASE,
    deleted INTEGER DEFAULT 0, 

    -- ms since epoch record created in zenodeo
    created INTEGER DEFAULT (
        strftime('%s','now') * 1000
    ),  

    -- ms since epoch record updated in zenodeo
    updated INTEGER 
)`,
        insert: `INSERT INTO bibRefCitations (
    bibRefCitationId,
    treatmentId,
    author,
    journalOrPublisher,
    title,
    refString,
    type,
    year,
    innerText,
    deleted
)
VALUES ( 
    @bibRefCitationId,
    @treatmentId,
    @author,
    @journalOrPublisher,
    @title,
    @refString,
    @type,
    @year,
    @innerText,
    @deleted
)
ON CONFLICT (bibRefCitationId)
DO UPDATE SET
    treatmentId=excluded.treatmentId,
    author=excluded.author,
    journalOrPublisher=excluded.journalOrPublisher,
    title=excluded.title,
    refString=excluded.refString,
    type=excluded.type,
    year=excluded.year,
    innerText=excluded.innerText,
    deleted=excluded.deleted,
    updated=strftime('%s','now') * 1000`,
        preparedinsert: '',
        data: []
    },
    {
        name: 'vbibrefcitations',
        type: 'virtual',
        create: `CREATE VIRTUAL TABLE IF NOT EXISTS vbibrefcitations USING FTS5(
    bibRefCitationId, 
    refString
)`,
        insert: `INSERT INTO vbibrefcitations 
SELECT bibRefCitationId, refString 
FROM bibRefCitations 
WHERE rowid > @maxrowid`,
        preparedinsert: '',
        maxrowid: 0
    },
]

const indexes = [
    `CREATE INDEX IF NOT EXISTS ix_bibRefCitations_bibRefCitationId ON bibRefCitations (bibRefCitationId)`,
    `CREATE INDEX IF NOT EXISTS ix_bibRefCitations_treatmentId      ON bibRefCitations (treatmentId)`,
    `CREATE INDEX IF NOT EXISTS ix_bibRefCitations_year             ON bibRefCitations (year)`,
    //`CREATE INDEX IF NOT EXISTS ix_bibRefCitations_deleted          ON bibRefCitations (deleted)`,
]

export { tables, indexes }