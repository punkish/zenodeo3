import { resources } from '../../../../../../data-dictionary/resources.js';
const alias = resources.filter(r => r.name === 'treatmentCitations')[0].alias;

const tables = {
    treatmentCitations: `CREATE TABLE IF NOT EXISTS treatmentCitations ( 
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
    )`
};

const inserts = {
    insertIntoTreatmentCitations: `INSERT INTO ${alias}.treatmentCitations (
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
        updated=strftime('%s','now') * 1000`
};

const indexes = {
    ix_treatmentCitations_treatmentCitation: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatmentCitations_treatmentCitation ON treatmentCitations (treatmentCitation)`,
    
    ix_treatmentCitations_refString: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatmentCitations_refString ON treatmentCitations (refString)`,
    
    ix_treatmentCitations_deleted: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatmentCitations_deleted ON treatmentCitations (deleted)`
};

const triggers = {};

export { tables, indexes, triggers, inserts }