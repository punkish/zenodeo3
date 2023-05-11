import { resources } from '../../../../../../data-dictionary/resources.js';
const alias = 'main';
const name = 'treatments';
//const alias = resources.filter(r => r.name === name)[0].alias;


const tables = {

    // CREATE TABLE statement is without alias because the 
    // table is created without ATTACHing the db
    treatments: `CREATE TABLE IF NOT EXISTS treatments ( 
    id INTEGER PRIMARY KEY,
    treatmentId TEXT UNIQUE NOT NULL,
    treatmentTitle TEXT,
    treatmentVersion INTEGER,
    treatmentDOI TEXT,
    treatmentLSID TEXT,
    zenodoDep INTEGER,
    zoobankId TEXT,
    articleId TEXT,
    articleTitle TEXT,
    articleAuthor TEXT,
    articleDOI TEXT,
    publicationDate TEXT,

    -- foreign key to journals(journalId)
    journalId INTEGER,
    journalYear INTEGER,
    journalVolume TEXT,
    journalIssue TEXT,
    pages TEXT,
    authorityName TEXT,
    authorityYear TEXT,
    kingdom TEXT,
    phylum TEXT,
    class TEXT,
    "order" TEXT,
    family TEXT,
    genus TEXT,
    species TEXT,
    status TEXT,
    taxonomicNameLabel TEXT,
    rank TEXT,
    fulltext TEXT,

    -- ms since epoch when record was updated in TB
    updateTime INTEGER DEFAULT NULL,  

    -- ms since epoch when record was entered in TB
    checkinTime INTEGER DEFAULT NULL, 

    -- four digit year of checkinTime
    checkInYear INTEGER GENERATED ALWAYS AS (
        strftime('%Y', datetime(checkinTime/1000, 'unixepoch'))
    ) VIRTUAL,

    deleted INTEGER DEFAULT 0,

    -- ms since epoch record created in zenodeo
    created INTEGER DEFAULT (strftime('%s','now') * 1000),  

    -- ms since epoch record updated in zenodeo
    updated INTEGER,

    -- foreign keys
    FOREIGN KEY(journalId) REFERENCES journals(journalId)
)`,

    ftsTreatments: `CREATE VIRTUAL TABLE IF NOT EXISTS ftsTreatments USING FTS5(
    treatmentTitle, 
    fulltext,
    content=''
)`,
    
    journals: `CREATE TABLE IF NOT EXISTS journals (
    journalId INTEGER PRIMARY KEY,
    journalTitle TEXT UNIQUE NOT NULL
)`,

    journals_x_year: `CREATE TABLE IF NOT EXISTS journals_x_year (
    id INTEGER PRIMARY KEY,
    journalId INTEGER NOT NULL,
    journalYear INTEGER NOT NULL,

    -- num of journals by year
    num INTEGER NOT NULL,

    -- foreign keys
    FOREIGN KEY(journalId) REFERENCES journals(journalId),

    -- combo unique
    UNIQUE(journalId, journalYear)
)`
};


// indexes are created after tables are ATTACHed, so we need to 
// qualify index names with alias
const indexes = {
    ix_tr_treatmentId        : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_treatmentId ON treatments (treatmentId)`,
    ix_tr_treatmentTitle     : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_treatmentTitle ON treatments (treatmentTitle)`,
    ix_tr_articleTitle       : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_articleTitle ON treatments (articleTitle)`,
    ix_tr_publicationDate    : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_publicationDate ON treatments (publicationDate)`,
    ix_trournalTitle         : `CREATE INDEX IF NOT EXISTS ${alias}.ix_trournalTitle ON journals (journalTitle)`,
    ix_tr_journalYear        : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_journalYear ON treatments (journalYear)`,
    ix_tr_authorityName      : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_authorityName ON treatments (authorityName)`,
    ix_tr_taxonomicNameLabel : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_taxonomicNameLabel ON treatments (taxonomicNameLabel)`,
    ix_tr_kingdom            : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_kingdom ON treatments (kingdom)`,
    ix_tr_phylum             : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_phylum ON treatments (phylum)`,
    ix_tr_class              : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_class ON treatments (class)`,
    ix_tr_order              : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_order ON treatments ("order")`,
    ix_tr_family             : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_family ON treatments (family)`,
    ix_tr_genus              : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_genus ON treatments (genus)`,
    ix_tr_species            : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_species ON treatments (species)`,
    ix_tr_status             : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_status ON treatments (status)`,
    ix_tr_rank               : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_rank ON treatments (rank)`,
    ix_tr_k_phylum           : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_k_phylum ON treatments (kingdom, phylum)`,
    ix_tr_k_p_class          : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_k_p_class ON treatments (kingdom, phylum, class)`,
    ix_tr_k_p_c_order        : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_k_p_c_order ON treatments (kingdom, phylum, class, "order")`,
    ix_tr_k_p_c_o_family     : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_k_p_c_o_family ON treatments (kingdom, phylum, class, "order", family)`,
    ix_tr_k_p_c_o_f_genus    : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_k_p_c_o_f_genus ON treatments (kingdom, phylum, class, "order", family, genus)`,
    ix_tr_k_p_c_o_f_g_species: `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_k_p_c_o_f_g_species ON treatments (kingdom, phylum, class, "order", family, genus, species)`,
    ix_tr_facets             : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_facets ON treatments (treatmentId, journalTitle, journalYear, kingdom, phylum, "order", family, genus, species, status, rank)`,
    ix_tr_checkinTime        : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_checkinTime ON treatments (checkinTime)`,
    ix_tr_updateTime         : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_updateTime ON treatments (updateTime)`,
    ix_tr_deleted            : `CREATE INDEX IF NOT EXISTS ${alias}.ix_tr_deleted ON treatments (deleted)`
};

// Triggers to keep the FTS index up to date.
// modeled after the triggers on https://sqlite.org/fts5.html

// no alias required because triggers are created in standalone
// dbs with ATTACHing them, just like CREATE TABLE above
const triggers = {
    tr_afterInsert: `CREATE TRIGGER IF NOT EXISTS tr_afterInsert AFTER INSERT ON treatments 
        BEGIN

            -- insert or update journals by year frequency
            INSERT INTO journals_x_year (journalId, journalYear, num)
            VALUES (new.journalId, new.journalYear, 1)
            ON CONFLICT(journalId, journalYear) 
            DO UPDATE SET num = num + 1;

            -- insert new entry in fulltext index
            INSERT INTO ftsTreatments(rowid, treatmentTitle, fulltext) 
            VALUES (new.id, new.treatmentTitle, new.fulltext);
        END;`,
    
    // "delete" the old index from the fts table
    tr_afterDelete: `CREATE TRIGGER IF NOT EXISTS tr_afterDelete AFTER DELETE ON treatments 
        BEGIN
            INSERT INTO ftsTreatments(
                ftsTreatments, 
                rowid, 
                treatmentTitle, 
                fulltext
            ) 
            VALUES(
                'delete', 
                old.id, 
                old.treatmentTitle, 
                old.fulltext
            );
        END;`,
    
    // "delete" the old index from the fts table and add new index
    tr_afterUpdate: `CREATE TRIGGER IF NOT EXISTS tr_afterUpdate AFTER UPDATE ON treatments 
        BEGIN
            INSERT INTO ftsTreatments(
                ftsTreatments, 
                rowid, 
                treatmentTitle, 
                fulltext
            ) 
            VALUES(
                'delete', 
                old.id, 
                old.treatmentTitle, 
                old.fulltext
            );

            INSERT INTO ftsTreatments(
                rowid, 
                treatmentTitle, 
                fulltext
            ) 
            VALUES (
                new.id, 
                new.treatmentTitle, 
                new.fulltext
            );
        END;`
};

const inserts = {
    insertJournalAndGetJournalId: (cache, treatment, db) => {
        let journalId;     

        if (cache.journalIds.has(treatment.journalTitle)) {
            journalId = cache.journalIds.get(treatment.journalTitle);
            cache.hits++;
        }
        else {
            journalId = db.prepare(
                `INSERT OR IGNORE INTO ${alias}.journals (journalTitle) 
                VALUES (@journalTitle) RETURNING journalId`
            ).get(treatment).journalId;

            cache.journalIds.set(treatment.journalTitle, journalId);
            
        }

        return journalId;
    },

    insertTreatment: (treatment, db) => db.prepare(
        `INSERT INTO ${alias}.treatments (
            treatmentId,
            treatmentTitle,
            treatmentVersion,
            treatmentDOI,
            treatmentLSID,
            zenodoDep,
            zoobankId,
            articleId,
            articleTitle,
            articleAuthor,
            articleDOI,
            publicationDate,
            journalId,
            journalYear,
            journalVolume,
            journalIssue,
            pages,
            authorityName,
            authorityYear,
            kingdom,
            phylum,
            class,
            "order",
            family,
            genus,
            species,
            status,
            taxonomicNameLabel,
            rank,
            fulltext,
            updateTime,
            checkinTime,
            deleted
        )
        VALUES ( 
            @treatmentId,
            @treatmentTitle,
            @treatmentVersion,
            @treatmentDOI,
            @treatmentLSID,
            @zenodoDep,
            @zoobankId,
            @articleId,
            @articleTitle,
            @articleAuthor,
            @articleDOI,
            @publicationDate,
            @journalId,
            @journalYear,
            @journalVolume,
            @journalIssue,
            @pages,
            @authorityName,
            @authorityYear,
            @kingdom,
            @phylum,
            @class,
            @order,
            @family,
            @genus,
            @species,
            @status,
            @taxonomicNameLabel,
            @rank,
            @fulltext,
            @updateTime,
            @checkinTime,
            @deleted
        )
        ON CONFLICT (treatmentId)
        DO UPDATE SET
            treatmentTitle=excluded.treatmentTitle,
            treatmentDOI=excluded.treatmentDOI,
            treatmentLSID=excluded.treatmentLSID,
            zenodoDep=excluded.zenodoDep,
            zoobankId=excluded.zoobankId,
            articleId=excluded.articleId,
            articleTitle=excluded.articleTitle,
            articleAuthor=excluded.articleAuthor,
            articleDOI=excluded.articleDOI,
            publicationDate=excluded.publicationDate,
            journalId=excluded.journalId,
            journalYear=excluded.journalYear,
            journalVolume=excluded.journalVolume,
            journalIssue=excluded.journalIssue,
            pages=excluded.pages,
            authorityName=excluded.authorityName,
            authorityYear=excluded.authorityYear,
            kingdom=excluded.kingdom,
            phylum=excluded.phylum,
            class=excluded.class,
            "order"=excluded."order",
            family=excluded.family,
            genus=excluded.genus,
            species=excluded.species,
            status=excluded.status,
            taxonomicNameLabel=excluded.taxonomicNameLabel,
            rank=excluded.rank,
            fulltext=excluded.fulltext,
            updateTime=excluded.updateTime,
            checkinTime=excluded.checkinTime,
            deleted=excluded.deleted,
            updated=strftime('%s','now') * 1000`
    ).run(treatment),

    // updateJournalsByYear: (treatment, db) => db.prepare(
    //     `INSERT INTO ${alias}.journals_x_year (
    //         journalId, 
    //         journalYear, 
    //         num
    //     ) 
    //     VALUES (@journalId, @journalYear, 1) 
    //     ON CONFLICT (journalId, journalYear) 
    //     DO UPDATE SET num = num + 1`
    // ).run(treatment),

    // insertFtsTreatments: (treatment, db) => db.prepare(
    //     `INSERT INTO ${alias}.ftsTreatments(
    //         rowid, 
    //         treatmentTitle, 
    //         fulltext
    //     ) 
    //     VALUES (
    //         @id, 
    //         @treatmentTitle, 
    //         @fulltext
    //     )`
    // ).run(treatment)
};

export { tables, indexes, triggers, inserts }