import { resources } from '../../../../../../data-dictionary/resources.js';
const alias = resources.filter(r => r.name === 'treatmentAuthors')[0].alias;

const tables = {
    treatmentAuthors: `CREATE TABLE IF NOT EXISTS treatmentAuthors ( 
        id INTEGER PRIMARY KEY,
        treatmentAuthorId TEXT NOT NULL,
        treatmentId TEXT NOT NULL,
        treatmentAuthor TEXT,
        deleted INTEGER DEFAULT 0,
        
        -- ms since epoch record created in zenodeo
        created INTEGER DEFAULT (strftime('%s','now') * 1000),  

        -- ms since epoch record updated in zenodeo
        updated INTEGER,
        UNIQUE (treatmentAuthorId, treatmentId)
    )`
};

const indexes = {
    ix_treatmentAuthors_treatmentAuthorId: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatmentAuthors_treatmentAuthorId ON treatmentAuthors (treatmentAuthorId)`,
    
    ix_treatmentAuthors_treatmentId: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatmentAuthors_treatmentId ON treatmentAuthors (treatmentId)`,
    
    ix_treatmentAuthors_treatmentAuthor: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatmentAuthors_treatmentAuthor ON treatmentAuthors (treatmentAuthor)`,
    
    ix_treatmentAuthors_deleted: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatmentAuthors_deleted ON treatmentAuthors (deleted)`
};

const triggers = {};

const inserts = {
    insertIntoTreatmentAuthors: `INSERT INTO ${alias}.treatmentAuthors (
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
        updated=strftime('%s','now') * 1000`
};

export { tables, indexes, triggers, inserts }