import { resources } from '../../../../../../data-dictionary/resources.js';
const alias = resources.filter(r => r.name === 'figureCitations')[0].alias;

const tables = [
    {
        name: 'figureCitations',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS figureCitations ( 
    id INTEGER PRIMARY KEY,
    figureNum INTEGER DEFAULT 0,
    figureCitationId TEXT NOT NULL,
    treatmentId TEXT NOT NULL,
    captionText TEXT,
    httpUri TEXT,
    deleted INTEGER DEFAULT 0,
    
    -- ms since epoch record created in zenodeo
    created INTEGER DEFAULT (strftime('%s','now') * 1000),  

    -- ms since epoch record updated in zenodeo
    updated INTEGER,
    UNIQUE (figureCitationId, figureNum)
)`,
        insert: `INSERT INTO ${alias}.figureCitations (
    figureNum,
    figureCitationId,
    treatmentId,
    captionText,
    httpUri,
    deleted
)
VALUES (
    @figureNum,
    @figureCitationId,
    @treatmentId,
    @captionText,
    @httpUri,
    @deleted
)
ON CONFLICT (figureNum, figureCitationId)
DO UPDATE SET
    figureNum=excluded.figureNum,
    figureCitationId=excluded.figureCitationId,
    treatmentId=excluded.treatmentId,
    captionText=excluded.captionText,
    httpUri=excluded.httpUri,
    deleted=excluded.deleted,
    updated=strftime('%s','now') * 1000`,
        preparedinsert: '',
        data: []
    },
    {
        name: 'ftsFigurecitations',
        type: 'virtual',
        create: `CREATE VIRTUAL TABLE IF NOT EXISTS ftsFigurecitations USING FTS5(
    captionText,
    content=''
)`,
        insert: `INSERT INTO ${alias}.ftsFigurecitations 
SELECT captionText 
FROM figureCitations`,
        preparedinsert: '',
//         maxrowid: 0
    },
]

const indexes = [
    {
        name: 'ix_figureCitations_treatmentId',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_figureCitations_treatmentId ON figureCitations (treatmentId)`
    },
    {
        name: 'ix_figureCitations_figureCitationId_treatmentId_figureNum',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_figureCitations_figureCitationId_treatmentId_figureNum ON figureCitations (figureCitationId, treatmentId, figureNum)`
    },
    {
        name: 'ix_figureCitations_httpUri',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_figureCitations_httpUri ON figureCitations (httpUri)`
    },
    {
        name: 'ix_figureCitations_deleted',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_figureCitations_deleted ON figureCitations (deleted)`
    }
]

// Triggers to keep the FTS index up to date.
// modeled after the triggers on https://sqlite.org/fts5.html
const triggers = [
    {
        name: 'figureCitations_afterInsert',
        create: `CREATE TRIGGER IF NOT EXISTS ${alias}.figureCitations_afterInsert 
        AFTER INSERT ON figureCitations 
        BEGIN
            INSERT INTO ftsFigurecitations(rowid, captionText) 
            VALUES (new.id, new.captionText);
        END;`
    },
    {
        name: 'figureCitations_afterDelete',
        create: `CREATE TRIGGER IF NOT EXISTS ${alias}.figureCitations_afterDelete 
        AFTER DELETE ON figureCitations 
        BEGIN
            INSERT INTO ftsFigurecitations(ftsFigurecitations, rowid, captionText) 
            VALUES('delete', old.id, old.captionText);
        END;`
    },
    {
        name: 'figureCitations_afterUpdate',
        create: `CREATE TRIGGER IF NOT EXISTS ${alias}.figureCitations_afterUpdate 
        AFTER UPDATE ON figureCitations 
        BEGIN
            INSERT INTO ftsFigurecitations(ftsFigurecitations, rowid, captionText) 
            VALUES('delete', old.id, old.captionText);

            INSERT INTO ftsFigurecitations(rowid, captionText) 
            VALUES (new.id, new.captionText);
        END;`
    }
]

export { tables, indexes, triggers }