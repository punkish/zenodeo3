import { resources } from '../../../../../../data-dictionary/resources.js';
const alias = resources.filter(r => r.name === 'bibRefCitations')[0].alias;

const tables = [
    {
        name: 'bibRefCitations',
        //type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS bibRefCitations ( 
    id INTEGER PRIMARY KEY,
    bibRefCitationId TEXT NOT NULL UNIQUE,
    treatmentId TEXT NOT NULL,
    author TEXT,
    journalOrPublisher TEXT,
    title TEXT, 
    refString TEXT,
    type TEXT,
    year TEXT,
    fulltext TEXT,
    deleted INTEGER DEFAULT 0, 

    -- ms since epoch record created in zenodeo
    created INTEGER DEFAULT (strftime('%s','now') * 1000),  

    -- ms since epoch record updated in zenodeo
    updated INTEGER 
)`,
        insert: [
            `INSERT INTO ${alias}.bibRefCitations (
    bibRefCitationId,
    treatmentId,
    author,
    journalOrPublisher,
    title,
    refString,
    type,
    year,
    fulltext,
    deleted
)
VALUES ( 
    @bibRefCitationId,
    @treatmentId,
    @author,
    @journalOrPublisher,
    @title,
    @refString,
    @type,
    @year,
    @fulltext,
    @deleted
)
ON CONFLICT (bibRefCitationId)
DO UPDATE SET
    treatmentId=excluded.treatmentId,
    author=excluded.author,
    journalOrPublisher=excluded.journalOrPublisher,
    title=excluded.title,
    refString=excluded.refString,
    type=excluded.type,
    year=excluded.year,
    fulltext=excluded.fulltext,
    deleted=excluded.deleted,
    updated=strftime('%s','now') * 1000`
],
        // preparedinsert: '',
        // data: []
    },
    {
        name: 'ftsBibrefcitations',
        type: 'virtual',
        create: `CREATE VIRTUAL TABLE IF NOT EXISTS ftsBibrefcitations USING FTS5(
    fulltext,
    content=''
)`,
        inserts: [
            `INSERT INTO ${alias}.ftsBibrefcitations 
SELECT fulltext 
FROM bibRefCitations`
],
        //preparedinsert: '',
//         maxrowid: 0
    },
]

const indexes = [
    {
        name: 'ix_bibRefCitations_bibRefCitationId',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_bibRefCitations_bibRefCitationId ON bibRefCitations (bibRefCitationId)`
    },
    {
        name: 'ix_bibRefCitations_treatmentId',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_bibRefCitations_treatmentId ON bibRefCitations (treatmentId)`
    },
    {
        name: 'ix_bibRefCitations_year',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_bibRefCitations_year ON bibRefCitations (year)`
    },
    {
        name: 'ix_bibRefCitations_deleted',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_bibRefCitations_deleted ON bibRefCitations (deleted)`
    }
]

// Triggers to keep the FTS index up to date.
// modeled after the triggers on https://sqlite.org/fts5.html
const triggers = [
    {
        name: 'bibRefCitations_afterInsert',
        create: `CREATE TRIGGER IF NOT EXISTS ${alias}.bibRefCitations_afterInsert 
        AFTER INSERT ON bibRefCitations 
        BEGIN
            INSERT INTO ftsBibRefCitations(rowid, fulltext) 
            VALUES (new.id, new.fulltext);
        END;`
    },
    {
        name: 'bibRefCitations_afterDelete',
        create: `CREATE TRIGGER IF NOT EXISTS ${alias}.bibRefCitations_afterDelete 
        AFTER DELETE ON bibRefCitations 
        BEGIN
            INSERT INTO ftsBibRefCitations(ftsBibRefCitations, rowid, fulltext) 
            VALUES('delete', old.id, old.fulltext);
        END;`
    },
    {
        name: 'bibRefCitations_afterUpdate',
        create: `CREATE TRIGGER IF NOT EXISTS ${alias}.bibRefCitations_afterUpdate 
        AFTER UPDATE ON bibRefCitations 
        BEGIN
            INSERT INTO ftsBibRefCitations(ftsBibRefCitations, rowid, fulltext) 
            VALUES('delete', old.id, old.fulltext);

            INSERT INTO ftsBibRefCitations(rowid, fulltext) 
            VALUES (new.id, new.fulltext);
        END;`
    }
]

export { tables, indexes, triggers }