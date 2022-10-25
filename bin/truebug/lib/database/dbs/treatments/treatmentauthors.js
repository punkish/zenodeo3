const tables = [
    {
        name: 'treatmentAuthors',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS treatmentAuthors ( 
    id INTEGER PRIMARY KEY,
    treatmentAuthorId TEXT NOT NULL COLLATE NOCASE,
    treatmentId TEXT NOT NULL COLLATE NOCASE,
    treatmentAuthor TEXT COLLATE NOCASE,
    deleted INTEGER DEFAULT 0,
    
    -- ms since epoch record created in zenodeo
    created INTEGER DEFAULT (
        strftime('%s','now') * 1000
    ),  

    -- ms since epoch record updated in zenodeo
    updated INTEGER,
    UNIQUE (treatmentAuthorId, treatmentId)
)`,
        insert: `INSERT INTO treatmentAuthors (
    treatmentAuthorId,
    treatmentId,
    treatmentAuthor,
    deleted
)
VALUES ( 
    @treatmentAuthorId,
    @treatmentId,
    @treatmentAuthor,
    @deleted
)
ON CONFLICT (treatmentAuthorId, treatmentId)
DO UPDATE SET
    treatmentId=excluded.treatmentId,
    treatmentAuthor=excluded.treatmentAuthor,
    deleted=excluded.deleted,
    updated=strftime('%s','now') * 1000`,
        preparedinsert: '',
        data: []
    },
]

const indexes = [
    `CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_treatmentAuthorId ON treatmentAuthors (treatmentAuthorId)`,
    `CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_treatmentId       ON treatmentAuthors (treatmentId)`,
    `CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_treatmentAuthor   ON treatmentAuthors (treatmentAuthor)`,
    //`CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_deleted           ON treatmentAuthors (deleted)`,
]

export { tables, indexes }