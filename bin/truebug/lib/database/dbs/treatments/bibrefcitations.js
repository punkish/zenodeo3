const tables = [
    {
        name: 'bibRefCitations',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS bibRefCitations ( 
    id INTEGER PRIMARY KEY,
    bibRefCitationId TEXT NOT NULL UNIQUE,
    treatmentId TEXT NOT NULL,
    author TEXT,
    journalOrPublisher TEXT,
    title TEXT, 
    refString TEXT,
    type TEXT,
    year TEXT,
    innerText TEXT,
    deleted INTEGER DEFAULT 0,
    created INTEGER DEFAULT (strftime('%s','now') * 1000),
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
WHERE rowid > @maxrowid AND deleted = 0`,
        preparedinsert: '',
        maxrowid: 0
    },
]

const indexes = [
    `CREATE INDEX IF NOT EXISTS ix_bibRefCitations_bibRefCitationId ON bibRefCitations (deleted, bibRefCitationId)`,
    `CREATE INDEX IF NOT EXISTS ix_bibRefCitations_treatmentId      ON bibRefCitations (deleted, treatmentId)`,
    `CREATE INDEX IF NOT EXISTS ix_bibRefCitations_year             ON bibRefCitations (deleted, year)`,
    `CREATE INDEX IF NOT EXISTS ix_bibRefCitations_deleted          ON bibRefCitations (deleted)`,
]

export { tables, indexes }