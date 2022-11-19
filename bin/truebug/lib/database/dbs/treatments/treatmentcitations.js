import { resources } from '../../../../../../data-dictionary/resources.js';
const alias = resources.filter(r => r.name === 'treatmentCitations')[0].alias;

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
    
    -- ms since epoch record created in zenodeo
    created INTEGER DEFAULT (strftime('%s','now') * 1000),  

    -- ms since epoch record updated in zenodeo
    updated INTEGER,
    UNIQUE (treatmentCitationId, treatmentId)
)`,
        insert: `INSERT INTO ${alias}.treatmentCitations (
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
];

const indexes = [
    {
        name: 'ix_treatmentCitations_treatmentCitation',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatmentCitations_treatmentCitation ON treatmentCitations (treatmentCitation)`,
    },
    {
        name: 'ix_treatmentCitations_refString',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatmentCitations_refString ON treatmentCitations (refString)`,
    },
    {
        name: 'ix_treatmentCitations_deleted',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatmentCitations_deleted ON treatmentCitations (deleted)`
    }
];

const triggers = [];

export { tables, indexes, triggers }