const tables = [
    {
        name: 'bibRefCitations',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS bibRefCitations ( 
            id INTEGER PRIMARY KEY,
            bibRefCitationId TEXT NOT NULL,
            treatmentId TEXT NOT NULL,
            refString TEXT,
            type TEXT,
            year TEXT,
            deleted INTEGER DEFAULT 0,
            created INTEGER DEFAULT (strftime('%s','now')),
            updated INTEGER,
            UNIQUE (bibRefCitationId)
        )`,
        insert: `INSERT INTO bibRefCitations (
                bibRefCitationId,
                treatmentId,
                refString,
                type,
                year,
                deleted
            )
            VALUES ( 
                @bibRefCitationId,
                @treatmentId,
                @refString,
                @type,
                @year,
                @deleted
            )
            ON CONFLICT (bibRefCitationId)
            DO UPDATE SET
                treatmentId=excluded.treatmentId,
                refString=excluded.refString,
                type=excluded.type,
                year=excluded.year,
                deleted=excluded.deleted,
                updated=strftime('%s','now')`,
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

module.exports = { tables, indexes }