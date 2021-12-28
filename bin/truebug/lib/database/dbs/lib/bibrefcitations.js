const db = {
    name: 'bibRefCitations',
    alias: 'bc'
}

db.tables = [
    {
        name: 'bibRefCitations',
        create: `CREATE TABLE IF NOT EXISTS ${db.alias}.bibRefCitations ( 
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
        insert: `INSERT INTO ${db.alias}.bibRefCitations (
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
            updated=strftime('%s','now')`
    },
    {
        name: 'vbibrefcitations',
        type: 'virtual',
        create: `CREATE VIRTUAL TABLE IF NOT EXISTS ${db.alias}.vbibrefcitations USING FTS5(
            bibRefCitationId, 
            refString
        )`,
        insert: {
            row: {
                select: `SELECT Count(*) AS c FROM ${db.alias}.vbibrefcitations WHERE bibRefCitationId = @bibRefCitationId`,
                update: `UPDATE ${db.alias}.vbibrefcitations SET refString = @refString WHERE bibRefCitationId = @bibRefCitationId`,
                insert: `INSERT INTO ${db.alias}.vbibrefcitations (
                    bibRefCitationId, 
                    refString
                )
                VALUES (
                    @bibRefCitationId, 
                    @refString
                )`
            },
            bulk: `INSERT INTO ${db.alias}.vbibrefcitations 
                SELECT bibRefCitationId, refString 
                FROM ${db.alias}.bibRefCitations 
                WHERE deleted = 0`
        }
    }
]

db.indexes = [
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_bibRefCitations_bibRefCitationId ON bibRefCitations (deleted, bibRefCitationId)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_bibRefCitations_treatmentId      ON bibRefCitations (deleted, treatmentId)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_bibRefCitations_year             ON bibRefCitations (deleted, year)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_bibRefCitations_deleted          ON bibRefCitations (deleted)`
]

module.exports = db