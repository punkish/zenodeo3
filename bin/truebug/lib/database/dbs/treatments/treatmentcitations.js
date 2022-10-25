const tables = [
    {
        name: 'treatmentCitations',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS treatmentCitations ( 
    id INTEGER PRIMARY KEY,
    treatmentCitationId TEXT NOT NULL COLLATE NOCASE,
    treatmentId TEXT NOT NULL COLLATE NOCASE,
    treatmentCitation TEXT COLLATE NOCASE,
    refString TEXT COLLATE NOCASE,
    deleted INTEGER DEFAULT 0,
    
    -- ms since epoch record created in zenodeo
    created INTEGER DEFAULT (
        strftime('%s','now') * 1000
    ),  

    -- ms since epoch record updated in zenodeo
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
    `CREATE INDEX IF NOT EXISTS ix_treatmentCitations_treatmentCitation ON treatmentCitations (treatmentCitation)`,
    `CREATE INDEX IF NOT EXISTS ix_treatmentCitations_refString         ON treatmentCitations (refString)`,
]

export { tables, indexes }