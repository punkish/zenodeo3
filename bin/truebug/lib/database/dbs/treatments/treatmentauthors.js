const db = {
    name: 'treatmentAuthors',
    alias: 'ta'
}

db.tables = [
    {
        name: 'treatmentAuthors',
        create: `CREATE TABLE IF NOT EXISTS ${db.alias}.treatmentAuthors ( 
            id INTEGER PRIMARY KEY,
            treatmentAuthorId TEXT NOT NULL,
            treatmentId TEXT NOT NULL,
            treatmentAuthor TEXT,
            deleted INTEGER DEFAULT 0,
            created INTEGER DEFAULT (strftime('%s','now')),
            updated INTEGER,
            UNIQUE (treatmentAuthorId, treatmentId)
        )`,
        insert: `INSERT INTO ${db.alias}.treatmentAuthors (
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
            updated=strftime('%s','now')`,
        preparedinsert: '',
        data: []
    }
]

db.indexes = [
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_treatmentAuthors_treatmentAuthorId ON treatmentAuthors (deleted, treatmentAuthorId)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_treatmentAuthors_treatmentId       ON treatmentAuthors (deleted, treatmentId)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_treatmentAuthors_treatmentAuthor   ON treatmentAuthors (deleted, treatmentAuthor COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_treatmentAuthors_deleted           ON treatmentAuthors (deleted)`

]

module.exports = db