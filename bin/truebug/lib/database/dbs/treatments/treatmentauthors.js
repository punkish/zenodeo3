const tables = [
    {
        name: 'treatmentAuthors',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS treatmentAuthors ( 
    id INTEGER PRIMARY KEY,
    treatmentAuthorId TEXT NOT NULL,
    treatmentId TEXT NOT NULL,
    treatmentAuthor TEXT,
    deleted INTEGER DEFAULT 0,
    created INTEGER DEFAULT (strftime('%s','now') * 1000),
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
    `CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_treatmentAuthorId ON treatmentAuthors (deleted, treatmentAuthorId)`,
    `CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_treatmentId       ON treatmentAuthors (deleted, treatmentId)`,
    `CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_treatmentAuthor   ON treatmentAuthors (deleted, treatmentAuthor COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_deleted           ON treatmentAuthors (deleted)`,
]

module.exports = { tables, indexes }