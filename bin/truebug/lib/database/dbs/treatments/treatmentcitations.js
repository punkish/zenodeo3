const tables = [
    {
        name: 'treatmentCitations',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS treatmentCitations ( 
    id INTEGER PRIMARY KEY,
    treatmentCitationId TEXT NOT NULL,
    treatmentId TEXT NOT NULL,
    treatmentCitation TEXT,
    refString TEXT,
    deleted INTEGER DEFAULT 0,
    created INTEGER DEFAULT (strftime('%s','now') * 1000),
    updated INTEGER,
    UNIQUE (treatmentCitationId, treatmentId)
)`,
        insert: `INSERT INTO treatmentCitations (
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
    updated=strftime('%s','now') * 1000`,
        preparedinsert: '',
        data: []
    },
]

const indexes = [
    `CREATE INDEX IF NOT EXISTS ix_treatmentCitations_treatmentCitation ON treatmentCitations (deleted, Lower(treatmentCitation)) WHERE deleted = 0`,
    `CREATE INDEX IF NOT EXISTS ix_treatmentCitations_refString         ON treatmentCitations (deleted, Lower(refString)) WHERE deleted = 0`,
]

export { tables, indexes }