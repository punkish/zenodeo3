import { pull } from "langchain/hub";
import { ChatOllama } from '@langchain/ollama';
// import { initDb } from '../lib/dbconn.js';
// const db = initDb().conn;
import Database from "better-sqlite3";
const db = new Database('./data/db/zenodeo.sqlite');

// first, create a new treatments table
function createNewTreatmentsTable(db) {
    db.exec(`
CREATE TABLE treatments (
    id INTEGER PRIMARY KEY,

    -- The unique resourceId of the treatment
    treatmentId TEXT UNIQUE NOT NULL CHECK(Length(treatmentId) = 32),

    treatmentTitle TEXT COLLATE NOCASE,
    treatmentVersion INTEGER,

    -- DOI of the treatment as extracted
    treatmentDOIorig TEXT COLLATE NOCASE,

    -- DOI of the treatment cleaned up
    treatmentDOI TEXT GENERATED ALWAYS AS (
        Iif(
            Instr(treatmentDOIorig, '/10.'),
            Substr(
                treatmentDOIorig,
                Instr(treatmentDOIorig, '/10.') + 1
            ),
            treatmentDOIorig
        )
    ) STORED,

    treatmentLSID TEXT COLLATE NOCASE,

    -- Zenodo deposition number
    zenodoDep INTEGER,
    zoobankId TEXT COLLATE NOCASE,

    -- Data on the article in which the treatment was published
    articleId TEXT NOT NULL,
    articleTitle TEXT COLLATE NOCASE,
    articleAuthor TEXT COLLATE NOCASE,
    articleDOIorig TEXT COLLATE NOCASE,
    articleDOI TEXT GENERATED ALWAYS AS (
        Iif(
            Instr(articleDOIorig, '/10.'),
            Substr(
                articleDOIorig,
                Instr(articleDOIorig, '/10.') + 1
            ),
            articleDOIorig
        )
    ) STORED,

    -- The publication date of the treatment as a string,
    -- and also as ms since unixepoch
    publicationDate TEXT,
    publicationDateMs INTEGER GENERATED ALWAYS AS (
        (julianday(publicationDate) - 2440587.5) * 86400 * 1000
    ) STORED,

    -- journal information
    journals_id INTEGER DEFAULT NULL REFERENCES journals(id),
    journalYear INTEGER,
    journalVolume TEXT COLLATE NOCASE,
    journalIssue TEXT COLLATE NOCASE,

    -- The from and to pages where the treatment occurs in the 
    -- published article
    pages TEXT COLLATE NOCASE,

    -- The author(s) of the treatment
    authorityName TEXT COLLATE NOCASE,

    -- The year when the taxon name was published
    authorityYear INTEGER,

    -- taxon classification
    kingdoms_id INTEGER DEFAULT NULL REFERENCES kingdoms(id),
    phyla_id INTEGER DEFAULT NULL REFERENCES phyla(id),
    classes_id INTEGER DEFAULT NULL REFERENCES classes(id),
    orders_id INTEGER DEFAULT NULL REFERENCES orders(id),
    families_id INTEGER DEFAULT NULL REFERENCES families(id),
    genera_id INTEGER DEFAULT NULL REFERENCES genera(id),
    species_id INTEGER DEFAULT NULL REFERENCES species(id),

    -- The descriptor for the taxonomic status proposed by a  
    -- given treatment 
    status TEXT COLLATE NOCASE,

    -- The Taxonomic Name Label of a new species
    taxonomicNameLabel TEXT COLLATE NOCASE,

    -- The taxonomic rank of the taxon, e.g. species, family
    rank TEXT COLLATE NOCASE,

    -- The time when the treatment was last updated (stored as 
    -- ms since unixepoch)
    updateTime INTEGER,

    -- The time when the article was first uploaded into 
    -- the system (stored as ms since unixepoch)
    checkinTime INTEGER,

    -- Four digit year of checkinTime
    checkInYear INTEGER GENERATED ALWAYS AS (
        strftime('%Y', datetime(checkinTime/1000, 'unixepoch'))
    ) VIRTUAL,

    -- ms since epoch record created in zenodeo
    created INTEGER DEFAULT ((julianday() - 2440587.5) * 86400 * 1000),

    -- ms since epoch record updated in zenodeo
    updated INTEGER,

    -- time taken in ms to parse XML
    timeToParseXML INTEGER,

    -- true if treatment has geolocation
    validGeo BOOLEAN,

    -- A boolean that tracks whether or not this resource is 
    -- considered deleted/revoked, 1 if yes, 0 if no
    deleted INTEGER DEFAULT 0,

    -- LLM-generated summary of the treatment
    summary TEXT,

    -- A boolean that tracks if the summary is filled correctly
    hasSpeciesSummary BOOLEAN GENERATED ALWAYS AS (
        Iif(summary IS NULL OR Substring(summary, 1, 5) = 'I don', 0, 1)
    ) VIRTUAL,

    -- fulltext of the treatment
    fulltext TEXT
)
    `);
}

function copyDataFromTreatmentsOld(db) {
    console.time('Copying data from old treatments table to new one');
    db.exec(`
INSERT INTO treatments (
    id,
    treatmentId,
    treatmentTitle,
    treatmentVersion,
    treatmentDOIorig,
    treatmentLSID,
    zenodoDep,
    zoobankId,
    articleId,
    articleTitle,
    articleAuthor,
    articleDOIorig,
    publicationDate,
    journals_id,
    journalYear,
    journalVolume,
    journalIssue,
    pages,
    authorityName,
    authorityYear,
    kingdoms_id,
    phyla_id,
    classes_id,
    orders_id,
    families_id,
    genera_id,
    species_id,
    status,
    taxonomicNameLabel,
    rank,
    updateTime,
    checkinTime,
    created,
    updated,
    timeToParseXML,
    validGeo,
    deleted,
    summary
)
SELECT
    id,
    treatmentId,
    treatmentTitle,
    treatmentVersion,
    treatmentDOIorig,
    treatmentLSID,
    zenodoDep,
    zoobankId,
    articleId,
    articleTitle,
    articleAuthor,
    articleDOIorig,
    publicationDate,
    journals_id,
    journalYear,
    journalVolume,
    journalIssue,
    pages,
    authorityName,
    authorityYear,
    kingdoms_id,
    phyla_id,
    classes_id,
    orders_id,
    families_id,
    genera_id,
    species_id,
    status,
    taxonomicNameLabel,
    rank,
    updateTime,
    checkinTime,
    created,
    updated,
    timeToParseXML,
    validGeo,
    deleted,
    summary
FROM treatments_old
    `);
    console.timeEnd('Copying data from old treatments table to new one');
}

function updateFulltextFromTreatments_orig(db) {
    console.time('Updating treatments table with fulltext from orig');
    db.exec(`
UPDATE treatments
SET fulltext = t2.fulltext
FROM treatments_orig t2
WHERE treatments.id = t2.id`);
    console.timeEnd('Updating treatments table with fulltext from orig');
}


async function answerFromZai({ 
    question, 
    context, 
    promptTemplate, 
    llm, 
    treatments_id 
}) {
    const messages = await promptTemplate.invoke({
        question,
        context
    });

    try {
        const answer = await llm.invoke(messages);
        return answer.content;
    }
    catch (error) {
        console.error('-'.repeat(50));
        console.error(`treatments_id: ${treatments_id}`);
        console.error('-'.repeat(50));
        console.error(question);
        console.error('-'.repeat(50));
        console.error(context);
        console.log(error);
        console.error('='.repeat(50));
        return false;
    }

}

function writeSummary({ db, summary, id, counter }) {
    db.prepare(`
        UPDATE treatments 
        SET summary = @summary
        WHERE id = @id
    `).run({ summary, id })
}

// Determine the number of treatments in the table
function getCountOfTreatments(db) {
    return db.prepare(`SELECT COUNT(*) AS c FROM treatments`).get().c;
}

function getCountOfUnsummarized(db) {
    return db.prepare(`
SELECT Count(*) AS c
FROM treatments 
WHERE 
    rank = 'species' 
    AND summary IS NULL
    AND genera_id IS NOT NULL
    AND genera_id != 18 
    AND species_id IS NOT NULL
    AND species_id != 2
    `).get().c;
}

// Now, find id of the last summarized treatments
function getLeastSummarizedId(db) {
    return db.prepare(`
        SELECT Min(id) AS c 
        FROM treatments
        WHERE 
            id NOT IN (
                70343, 
                818632, 
                844345, 
                1025676, 
                1025684, 
                1025687, 
                1025761, 
                1025763,
                1026349,
                1042180
            )
            AND rank = 'species' 
            AND summary IS NULL
            AND genera_id IS NOT NULL
            AND genera_id != 18 
            AND species_id IS NOT NULL
            AND species_id != 2
    `).get().c;
}
    
async function summarizeTreatments(db) {
    const count = getCountOfTreatments(db);
    const countUnsummarized = getCountOfUnsummarized(db);
    const leastSummarizedId = getLeastSummarizedId(db) || 0;

    console.log(`Generating summaries starting from ${leastSummarizedId}`);
    console.log(`There are ${countUnsummarized} treatments without summary`);

    const sel = db.prepare(`
        SELECT 
            treatments.id AS treatments_id,
            genus || ' ' || species AS binomen,
            fulltext AS context
        FROM 
            treatments 
            JOIN genera ON genera_id = genera.id 
            JOIN species ON species_id = species.id
        WHERE
            rank = 'species' 
            AND summary IS NULL 
            AND genera_id IS NOT NULL
            AND genera_id != 18 
            AND species_id IS NOT NULL
            AND species_id != 2
            AND treatments.id = @id
    `);

    const promptTemplate = await pull("rlm/rag-prompt");
    const llm = new ChatOllama({
        model: 'llama3.2:1b',
        temperature: 0
    });

    let counter = 0;

    for (let id = leastSummarizedId; id < count; id++) {
        counter++;

        if (counter % 100 === 0) {
            process.stdout.write(`${counter % 5000 ? '.' : '*'}`);
        }

        const res = sel.get({ id });

        if (res) {
            const { treatments_id, binomen, context } = res;
            const summary = await answerFromZai({
                question: `Describe ${binomen}`,
                context,
                promptTemplate,
                llm,
                treatments_id
            });
            
            if (summary) {
                writeSummary({ 
                    db, 
                    summary, 
                    id: treatments_id, 
                    counter 
                });
            }
            
        }
        
    }
}

//createNewTreatmentsTable(db);
// then, copy the data from the old treatments table to the new one
//copyData(db);
// Copying data from old treatments table to new one: 42.073s
//renameTables(db.conn);




function turnOffFKs(db) {
    const label = 'Turning off FKs';
    console.time(label);

    db.exec('PRAGMA foreign_keys=OFF');

    console.timeEnd(label);
}

function dropIndexes(db) {
    const label = 'Dropping indexes';
    console.time(label);

    db.exec(`
BEGIN TRANSACTION;
DROP INDEX IF EXISTS ix_treatments_treatmentId;
DROP INDEX IF EXISTS ix_treatments_summary;
DROP INDEX IF EXISTS ix_treatments_treatmentTitle;
DROP INDEX IF EXISTS ix_treatments_treatmentVersion;
DROP INDEX IF EXISTS ix_treatments_treatmentDOI;
DROP INDEX IF EXISTS ix_treatments_articleId;
DROP INDEX IF EXISTS ix_treatments_articleTitle;
DROP INDEX IF EXISTS ix_treatments_articleAuthor;
DROP INDEX IF EXISTS ix_treatments_articleDOI;
DROP INDEX IF EXISTS ix_treatments_publicationDate;
DROP INDEX IF EXISTS ix_treatments_publicationDateMs;
DROP INDEX IF EXISTS ix_treatments_journals_id;
DROP INDEX IF EXISTS ix_treatments_journalYear;
DROP INDEX IF EXISTS ix_treatments_authorityName;
DROP INDEX IF EXISTS ix_treatments_authorityYear;
DROP INDEX IF EXISTS ix_treatments_kingdoms_id;
DROP INDEX IF EXISTS ix_treatments_phyla_id;
DROP INDEX IF EXISTS ix_treatments_classes_id;
DROP INDEX IF EXISTS ix_treatments_orders_id;
DROP INDEX IF EXISTS ix_treatments_families_id;
DROP INDEX IF EXISTS ix_treatments_genera_id;
DROP INDEX IF EXISTS ix_treatments_species_id;
DROP INDEX IF EXISTS ix_treatments_status;
DROP INDEX IF EXISTS ix_treatments_taxonomicNameLabel;
DROP INDEX IF EXISTS ix_treatments_rank;
DROP INDEX IF EXISTS ix_treatments_updateTime;
DROP INDEX IF EXISTS ix_treatments_checkinTime;
DROP INDEX IF EXISTS ix_treatments_deleted;
DROP INDEX IF EXISTS ix_treatments_validGeo;
DROP INDEX IF EXISTS treatments_idx_rank_species_id_genera_id;
DROP INDEX IF EXISTS ix_treatments_rank_genera_species_summary;
COMMIT;
    `);

    console.timeEnd(label);
}

function dropTriggers(db) {
    const label = 'Dropping triggers';
    console.time(label);

    db.exec(`
BEGIN TRANSACTION;
DROP TRIGGER IF EXISTS tr_afterInsertFts;
DROP TRIGGER IF EXISTS tr_afterUpdate;
DROP TRIGGER IF EXISTS tr_afterInsertJournal;
DROP TRIGGER IF EXISTS tr_afterDelete;
COMMIT;
    `);

    console.timeEnd(label);
}

function dropView(db) {
    const label = 'Dropping view';
    console.time(label);
    db.exec(`DROP VIEW IF EXISTS binomen_view`);
    console.timeEnd(label);
}

function renameTable(db, oldName, newName) {
    const sql = `ALTER TABLE ${oldName} RENAME TO ${newName}`;

    console.time(sql);
    db.exec(sql);
    console.timeEnd(sql);
}

function dropTable(db, name) {
    const sql = `DROP TABLE IF EXISTS ${name}`;
    console.time(sql);
    db.exec(sql);
    console.timeEnd(sql);
}

function createVirtualTables(db) {
    const label = 'Creating virtual tables';
    console.time(label);

    db.exec(`
CREATE VIRTUAL TABLE IF NOT EXISTS treatmentsFts USING fts5 (
    fulltext,
    content='treatments',
    content_rowid='id'
);
CREATE VIRTUAL TABLE IF NOT EXISTS treatmentsFtvrow USING fts5vocab(
    'treatmentsFts', 'row'
);
CREATE VIRTUAL TABLE IF NOT EXISTS treatmentsFtvcol USING fts5vocab(
    'treatmentsFts', 'col'
);
CREATE VIRTUAL TABLE IF NOT EXISTS treatmentsFtvins USING fts5vocab(
    'treatmentsFts', 'instance'
);
    `);

    console.timeEnd(label);
}

function updateTreatmentsFts(db) {
    const label = 'Updating treatmentsFts table with fulltext';
    console.time(label);

    db.exec(`
INSERT INTO treatmentsFts(rowid, fulltext)
SELECT id, fulltext FROM treatments
    `);

    console.timeEnd(label);
}

function createTriggers(db) {
    const label = 'Creating triggers';
    console.time(label);

    db.exec(`
BEGIN TRANSACTION;
CREATE TRIGGER IF NOT EXISTS tr_afterInsertFts AFTER INSERT ON treatments 
    BEGIN

        -- insert new entry in fulltext index
        INSERT INTO treatmentsFts( fulltext ) 
        VALUES ( new.fulltext );
    END;
CREATE TRIGGER tr_afterUpdate AFTER UPDATE ON treatments 
    BEGIN

        -- delete the old index from the fts table
        -- by inserting the value 'delete'
        INSERT INTO treatmentsFts( treatmentsFts, rowid, fulltext ) 
        VALUES( 'delete', old.id, old.fulltext );

        -- add the new index to the fts table
        INSERT INTO treatmentsFts( rowid, fulltext ) 
        VALUES ( new.id, new.fulltext );
    END;
CREATE TRIGGER tr_afterInsertJournal AFTER INSERT ON treatments 
    WHEN new.journals_id IS NOT NULL 
    BEGIN

        -- insert or update journals by year frequency
        INSERT INTO journalsByYears ( journals_id, journalYear, num )
        VALUES ( new.journals_id, new.journalYear, 1 )
        ON CONFLICT(journals_id, journalYear) 
        DO UPDATE SET num = num + 1;
    END;
CREATE TRIGGER tr_afterDelete AFTER DELETE ON treatments 
    BEGIN

        -- update the count in the journals by year freq table
        UPDATE journalsByYears 
        SET num = num - 1
        WHERE 
            journals_id = old.journals_id  
            AND journalYear = old.journalYear;

        -- delete the old index from the fts table
        -- by inserting 'delete'
        INSERT INTO treatmentsFts( treatmentsFts, rowid, fulltext ) 
        VALUES( 'delete', old.id, old.fulltext );
    END;
CREATE TRIGGER mc_afterInsert AFTER INSERT ON materialCitations 
    BEGIN

        --insert new entry in fulltext index
        INSERT INTO materialCitationsFts( fulltext ) 
        VALUES ( new.fulltext );

        -- update validGeo in treatments
        UPDATE treatments 
        SET validGeo = new.validGeo
        WHERE treatments.id = new.treatments_id;
    END;
COMMIT;
    `);

    console.timeEnd(label);
}

function createIndexes(db) {
    const label = 'Creating indexes';
    console.time(label);

    db.exec(`
BEGIN TRANSACTION;
CREATE INDEX IF NOT EXISTS ix_treatments_treatmentId ON treatments(treatmentId COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS ix_treatments_summary ON treatments(summary);
CREATE INDEX IF NOT EXISTS ix_treatments_treatmentTitle ON treatments(treatmentTitle);
CREATE INDEX IF NOT EXISTS ix_treatments_treatmentVersion ON treatments(treatmentVersion);
CREATE INDEX IF NOT EXISTS ix_treatments_treatmentDOI ON treatments(treatmentDOI);
CREATE INDEX IF NOT EXISTS ix_treatments_articleId ON treatments(articleId);
CREATE INDEX IF NOT EXISTS ix_treatments_articleTitle ON treatments(articleTitle);
CREATE INDEX IF NOT EXISTS ix_treatments_articleAuthor ON treatments(articleAuthor);
CREATE INDEX IF NOT EXISTS ix_treatments_articleDOI ON treatments(articleDOI);
CREATE INDEX IF NOT EXISTS ix_treatments_publicationDate ON treatments(publicationDate);
CREATE INDEX IF NOT EXISTS ix_treatments_publicationDateMs ON treatments(publicationDateMs);
CREATE INDEX IF NOT EXISTS ix_treatments_journals_id ON treatments(journals_id);
CREATE INDEX IF NOT EXISTS ix_treatments_journalYear ON treatments(journalYear);
CREATE INDEX IF NOT EXISTS ix_treatments_authorityName ON treatments(authorityName);
CREATE INDEX IF NOT EXISTS ix_treatments_authorityYear ON treatments(authorityYear);
CREATE INDEX IF NOT EXISTS ix_treatments_kingdoms_id ON treatments(kingdoms_id);
CREATE INDEX IF NOT EXISTS ix_treatments_phyla_id ON treatments(phyla_id);
CREATE INDEX IF NOT EXISTS ix_treatments_classes_id ON treatments(classes_id);
CREATE INDEX IF NOT EXISTS ix_treatments_orders_id ON treatments(orders_id);
CREATE INDEX IF NOT EXISTS ix_treatments_families_id ON treatments(families_id);
CREATE INDEX IF NOT EXISTS ix_treatments_genera_id ON treatments(genera_id);
CREATE INDEX IF NOT EXISTS ix_treatments_species_id ON treatments(species_id);
CREATE INDEX IF NOT EXISTS ix_treatments_status ON treatments(status);
CREATE INDEX IF NOT EXISTS ix_treatments_taxonomicNameLabel ON treatments(taxonomicNameLabel);
CREATE INDEX IF NOT EXISTS ix_treatments_rank ON treatments(rank);
CREATE INDEX IF NOT EXISTS ix_treatments_updateTime ON treatments(updateTime);
CREATE INDEX IF NOT EXISTS ix_treatments_checkinTime ON treatments(checkinTime);
CREATE INDEX IF NOT EXISTS ix_treatments_deleted ON treatments(deleted);
CREATE INDEX IF NOT EXISTS ix_treatments_validGeo ON treatments(validGeo);
CREATE INDEX IF NOT EXISTS ix_treatments_hasSpeciesSummary ON treatments(hasSpeciesSummary);
CREATE INDEX IF NOT EXISTS ix_treatments_rank_genera_species_summary ON treatments(rank, genera_id, species_id, summary);
COMMIT;
    `);

    console.timeEnd(label);
}

function createView(db) {
    const label = 'Creating binomen view and fts';
    console.time(label);

    db.exec(`
BEGIN TRANSACTION;
CREATE VIEW IF NOT EXISTS binomen_view AS
    SELECT
        treatments.id,
        genus || ' ' || species AS binomen
    FROM
        treatments 
        JOIN genera ON genera_id = genera.id
        JOIN species ON species_id = species.id
    WHERE
        rank = 'species' 
        AND summary IS NOT NULL 
        AND genera_id IS NOT NULL
        AND genera_id != 18 
        AND species_id IS NOT NULL
        AND species_id != 2;

CREATE VIRTUAL TABLE IF NOT EXISTS binomens USING fts5(
    binomen, 
    content='binomen_view', 
    content_rowid='id', 
    tokenize='trigram'
);
COMMIT;
    `);

    console.timeEnd(label);
}

function checkFKs(db) {
    const label = 'Checking FKs';
    console.time(label);

    db.exec('PRAGMA foreign_key_check');

    console.timeEnd(label);
}

function rebuild(db) {
    const label = 'rebuilding';
    console.time(label);

    db.exec(`
BEGIN TRANSACTION;

-- step 1: turn off FKs
PRAGMA foreign_keys=OFF;

-- step 2: drop indexes
DROP INDEX IF EXISTS ix_treatments_treatmentId;
DROP INDEX IF EXISTS ix_treatments_summary;
DROP INDEX IF EXISTS ix_treatments_treatmentTitle;
DROP INDEX IF EXISTS ix_treatments_treatmentVersion;
DROP INDEX IF EXISTS ix_treatments_treatmentDOI;
DROP INDEX IF EXISTS ix_treatments_articleId;
DROP INDEX IF EXISTS ix_treatments_articleTitle;
DROP INDEX IF EXISTS ix_treatments_articleAuthor;
DROP INDEX IF EXISTS ix_treatments_articleDOI;
DROP INDEX IF EXISTS ix_treatments_publicationDate;
DROP INDEX IF EXISTS ix_treatments_publicationDateMs;
DROP INDEX IF EXISTS ix_treatments_journals_id;
DROP INDEX IF EXISTS ix_treatments_journalYear;
DROP INDEX IF EXISTS ix_treatments_authorityName;
DROP INDEX IF EXISTS ix_treatments_authorityYear;
DROP INDEX IF EXISTS ix_treatments_kingdoms_id;
DROP INDEX IF EXISTS ix_treatments_phyla_id;
DROP INDEX IF EXISTS ix_treatments_classes_id;
DROP INDEX IF EXISTS ix_treatments_orders_id;
DROP INDEX IF EXISTS ix_treatments_families_id;
DROP INDEX IF EXISTS ix_treatments_genera_id;
DROP INDEX IF EXISTS ix_treatments_species_id;
DROP INDEX IF EXISTS ix_treatments_status;
DROP INDEX IF EXISTS ix_treatments_taxonomicNameLabel;
DROP INDEX IF EXISTS ix_treatments_rank;
DROP INDEX IF EXISTS ix_treatments_updateTime;
DROP INDEX IF EXISTS ix_treatments_checkinTime;
DROP INDEX IF EXISTS ix_treatments_deleted;
DROP INDEX IF EXISTS ix_treatments_validGeo;
DROP INDEX IF EXISTS treatments_idx_rank_species_id_genera_id;
DROP INDEX IF EXISTS ix_treatments_rank_genera_species_summary;

-- step 3: drop triggers
DROP TRIGGER IF EXISTS tr_afterInsertFts;
DROP TRIGGER IF EXISTS tr_afterUpdate;
DROP TRIGGER IF EXISTS tr_afterInsertJournal;
DROP TRIGGER IF EXISTS tr_afterDelete;

-- step 4: drop virtual tables and old treatments table and view
DROP TABLE IF EXISTS treatmentsFts;
DROP TABLE IF EXISTS treatmentsFtvrow;
DROP TABLE IF EXISTS treatmentsFtvcol;
DROP TABLE IF EXISTS treatmentsFtvins;
DROP TABLE IF EXISTS treatments_old;
DROP VIEW IF EXISTS binomen_view;

-- step 5: rename treatments to treatments_new
ALTER TABLE treatments RENAME TO treatments_new;

-- step 6: rename treatments_orig to treatments
ALTER TABLE treatments_orig RENAME TO treatments;

-- Note: by now, all old references should be reset
-- step 7: drop treatments table
DROP TABLE IF EXISTS treatments;

-- step 8: rename treatments_new to treatments
ALTER TABLE treatments_new RENAME TO treatments;

-- step 9: recreate virtual tables
CREATE VIRTUAL TABLE IF NOT EXISTS treatmentsFts USING fts5 (
    fulltext,
    content='treatments',
    content_rowid='id'
);
CREATE VIRTUAL TABLE IF NOT EXISTS treatmentsFtvrow USING fts5vocab(
    'treatmentsFts', 'row'
);
CREATE VIRTUAL TABLE IF NOT EXISTS treatmentsFtvcol USING fts5vocab(
    'treatmentsFts', 'col'
);
CREATE VIRTUAL TABLE IF NOT EXISTS treatmentsFtvins USING fts5vocab(
    'treatmentsFts', 'instance'
);

-- step 10: recreate triggers
CREATE TRIGGER IF NOT EXISTS tr_afterInsertFts AFTER INSERT ON treatments 
    BEGIN

        -- insert new entry in fulltext index
        INSERT INTO treatmentsFts( fulltext ) 
        VALUES ( new.fulltext );
    END;

CREATE TRIGGER IF NOT EXISTS tr_afterUpdate AFTER UPDATE ON treatments 
    BEGIN

        -- delete the old index from the fts table
        -- by inserting the value 'delete'
        INSERT INTO treatmentsFts( treatmentsFts, rowid, fulltext ) 
        VALUES( 'delete', old.id, old.fulltext );

        -- add the new index to the fts table
        INSERT INTO treatmentsFts( rowid, fulltext ) 
        VALUES ( new.id, new.fulltext );
    END;

CREATE TRIGGER IF NOT EXISTS tr_afterInsertJournal AFTER INSERT ON treatments 
    WHEN new.journals_id IS NOT NULL 
    BEGIN

        -- insert or update journals by year frequency
        INSERT INTO journalsByYears ( journals_id, journalYear, num )
        VALUES ( new.journals_id, new.journalYear, 1 )
        ON CONFLICT(journals_id, journalYear) 
        DO UPDATE SET num = num + 1;
    END;

CREATE TRIGGER IF NOT EXISTS tr_afterDelete AFTER DELETE ON treatments 
    BEGIN

        -- update the count in the journals by year freq table
        UPDATE journalsByYears 
        SET num = num - 1
        WHERE 
            journals_id = old.journals_id  
            AND journalYear = old.journalYear;

        -- delete the old index from the fts table
        -- by inserting 'delete'
        INSERT INTO treatmentsFts( treatmentsFts, rowid, fulltext ) 
        VALUES( 'delete', old.id, old.fulltext );
    END;

-- step 11: update treatmentsFts
INSERT INTO treatmentsFts(rowid, fulltext)
SELECT id, fulltext FROM treatments;

-- step 12: recreate binomens view and virtual table
CREATE VIEW IF NOT EXISTS binomen_view AS
    SELECT
        treatments.id,
        genus || ' ' || species AS binomen
    FROM
        treatments 
        JOIN genera ON genera_id = genera.id
        JOIN species ON species_id = species.id
    WHERE
        rank = 'species' 
        AND summary IS NOT NULL 
        AND genera_id IS NOT NULL
        AND genera_id != 18 
        AND species_id IS NOT NULL
        AND species_id != 2

CREATE VIRTUAL TABLE IF NOT EXISTS binomens USING fts5(
    binomen, 
    content='binomen_view', 
    content_rowid='id', 
    tokenize='trigram'
);

-- step 13: recreate indexes
CREATE INDEX IF NOT EXISTS ix_treatments_treatmentId ON treatments(treatmentId COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS ix_treatments_summary ON treatments(summary);
CREATE INDEX IF NOT EXISTS ix_treatments_treatmentTitle ON treatments(treatmentTitle);
CREATE INDEX IF NOT EXISTS ix_treatments_treatmentVersion ON treatments(treatmentVersion);
CREATE INDEX IF NOT EXISTS ix_treatments_treatmentDOI ON treatments(treatmentDOI);
CREATE INDEX IF NOT EXISTS ix_treatments_articleId ON treatments(articleId);
CREATE INDEX IF NOT EXISTS ix_treatments_articleTitle ON treatments(articleTitle);
CREATE INDEX IF NOT EXISTS ix_treatments_articleAuthor ON treatments(articleAuthor);
CREATE INDEX IF NOT EXISTS ix_treatments_articleDOI ON treatments(articleDOI);
CREATE INDEX IF NOT EXISTS ix_treatments_publicationDate ON treatments(publicationDate);
CREATE INDEX IF NOT EXISTS ix_treatments_publicationDateMs ON treatments(publicationDateMs);
CREATE INDEX IF NOT EXISTS ix_treatments_journals_id ON treatments(journals_id);
CREATE INDEX IF NOT EXISTS ix_treatments_journalYear ON treatments(journalYear);
CREATE INDEX IF NOT EXISTS ix_treatments_authorityName ON treatments(authorityName);
CREATE INDEX IF NOT EXISTS ix_treatments_authorityYear ON treatments(authorityYear);
CREATE INDEX IF NOT EXISTS ix_treatments_kingdoms_id ON treatments(kingdoms_id);
CREATE INDEX IF NOT EXISTS ix_treatments_phyla_id ON treatments(phyla_id);
CREATE INDEX IF NOT EXISTS ix_treatments_classes_id ON treatments(classes_id);
CREATE INDEX IF NOT EXISTS ix_treatments_orders_id ON treatments(orders_id);
CREATE INDEX IF NOT EXISTS ix_treatments_families_id ON treatments(families_id);
CREATE INDEX IF NOT EXISTS ix_treatments_genera_id ON treatments(genera_id);
CREATE INDEX IF NOT EXISTS ix_treatments_species_id ON treatments(species_id);
CREATE INDEX IF NOT EXISTS ix_treatments_status ON treatments(status);
CREATE INDEX IF NOT EXISTS ix_treatments_taxonomicNameLabel ON treatments(taxonomicNameLabel);
CREATE INDEX IF NOT EXISTS ix_treatments_rank ON treatments(rank);
CREATE INDEX IF NOT EXISTS ix_treatments_updateTime ON treatments(updateTime);
CREATE INDEX IF NOT EXISTS ix_treatments_checkinTime ON treatments(checkinTime);
CREATE INDEX IF NOT EXISTS ix_treatments_deleted ON treatments(deleted);
CREATE INDEX IF NOT EXISTS ix_treatments_validGeo ON treatments(validGeo);
CREATE INDEX IF NOT EXISTS ix_treatments_hasSpeciesSummary ON treatments(hasSpeciesSummary);
CREATE INDEX IF NOT EXISTS ix_treatments_rank_genera_species_summary ON treatments(rank, genera_id, species_id, summary);

PRAGMA foreign_key_check;

COMMIT;
    `);

    console.timeEnd(label);
}

// turnOffFKs(db);
// dropIndexes(db);
// dropTriggers(db);
// dropTable(db, 'treatmentsFts');
// dropTable(db, 'treatmentsFtvrow');
// dropTable(db, 'treatmentsFtvcol');
// dropTable(db, 'treatmentsFtvins');
// dropTable(db, 'treatments_old');
// dropView(db);
// renameTable(db, 'treatments', 'treatments_new');
// renameTable(db, 'treatments_orig', 'treatments');
// dropTable(db, 'treatments');
// renameTable(db, 'treatments_new', 'treatments');
// createVirtualTables(db);
// createTriggers(db);
// createIndexes(db);
// updateTreatmentsFts(db);
// createView(db);
// checkFKs(db);
//rebuild(db);
await summarizeTreatments(db);