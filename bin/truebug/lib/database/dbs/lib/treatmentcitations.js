const db = {
    name: 'treatmentCitations',
    alias: 'tc'
}

db.tables = [
    {
        name: 'treatmentCitations',
        create: `CREATE TABLE IF NOT EXISTS ${db.alias}.treatmentCitations ( 
            id INTEGER PRIMARY KEY,
            treatmentCitationId TEXT NOT NULL,
            treatmentId TEXT NOT NULL,
            treatmentCitation TEXT,
            refString TEXT,
            deleted INTEGER DEFAULT 0,
            created INTEGER DEFAULT (strftime('%s','now')),
            updated INTEGER,
            UNIQUE (treatmentCitationId, treatmentId)
        )`,
        insert: `INSERT INTO ${db.alias}.treatmentCitations (
            treatmentCitationId,
            treatmentId,
            treatmentCitation,
            refString,
            deleted
        )
        VALUES ( 
            @treatmentCitationId,
            @treatmentId,
            @treatmentCitation,
            @refString,
            @deleted
        )
        ON CONFLICT (treatmentCitationId, treatmentId)
        DO UPDATE SET
            treatmentId=excluded.treatmentId,
            treatmentCitation=excluded.treatmentCitation,
            refString=excluded.refString,
            deleted=excluded.deleted,
            updated=strftime('%s','now')`
    }
]

db.indexes = [
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_treatmentCitations_treatmentCitation ON treatmentCitations (deleted, Lower(treatmentCitation)) WHERE deleted = 0`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_treatmentCitations_refString         ON treatmentCitations (deleted, Lower(refString)) WHERE deleted = 0`
]

module.exports = db