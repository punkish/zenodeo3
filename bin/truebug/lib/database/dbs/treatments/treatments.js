import { resources } from '../../../../../../data-dictionary/resources.js';
const alias = resources.filter(r => r.name === 'treatments')[0].alias;

const tables = [
    {
        name: 'treatments',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS treatments ( 
    id INTEGER PRIMARY KEY,
    treatmentId TEXT NOT NULL UNIQUE,
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
    journalTitle TEXT,
    journalYear TEXT,
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
    updated INTEGER
)`,
        insert: `INSERT INTO ${alias}.treatments (
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
    journalTitle,
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
    @journalTitle,
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
    journalTitle=excluded.journalTitle,
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
    updated=strftime('%s','now') * 1000`,
        preparedinsert: '',
        data: []
    },
    {
        name: 'ftsTreatments',
        type: 'virtual',
        create: `CREATE VIRTUAL TABLE IF NOT EXISTS ftsTreatments USING FTS5(
    treatmentTitle, 
    fulltext,
    content=''
)`,
        insert: `INSERT INTO ${alias}.ftsTreatments 
SELECT treatmentTitle, fulltext 
FROM tr.treatments`,
        preparedinsert: '',
        maxrowid: 0
    }
];

const indexes = [
    {
        name: 'ix_treatments_treatmentId',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_treatmentId ON treatments (treatmentId)`
    },
    {
        name: 'ix_treatments_treatmentTitle',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_treatmentTitle ON treatments (treatmentTitle)`
    },
    {
        name: 'ix_treatments_articleTitle',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_articleTitle ON treatments (articleTitle)`
    },
    {
        name: 'ix_treatments_publicationDate',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_publicationDate ON treatments (publicationDate)`
    },
    {
        name: 'ix_treatments_journalTitle',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_journalTitle ON treatments (journalTitle)`
    },
    {
        name: 'ix_treatments_journalYear',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_journalYear ON treatments (journalYear)`
    },
    {
        name: 'ix_treatments_authorityName',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_authorityName ON treatments (authorityName)`
    },
    {
        name: 'ix_treatments_taxonomicNameLabel',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_taxonomicNameLabel ON treatments (taxonomicNameLabel)`
    },
    {
        name: 'ix_treatments_kingdom',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_kingdom ON treatments (kingdom)`
    },
    {
        name: 'ix_treatments_phylum',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_phylum ON treatments (phylum)`
    },
    {
        name: 'ix_treatments_class',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_class ON treatments (class)`
    },
    {
        name: 'ix_treatments_order',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_order ON treatments ("order")`
    },
    {
        name: 'ix_treatments_family',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_family ON treatments (family)`
    },
    {
        name: 'ix_treatments_genus',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_genus ON treatments (genus)`
    },
    {
        name: 'ix_treatments_species',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_species ON treatments (species)`
    },
    {
        name: 'ix_treatments_status',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_status ON treatments (status)`
    },
    {
        name: 'ix_treatments_rank',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_rank ON treatments (rank)`
    },
    {
        name: 'ix_treatments_k_phylum',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_k_phylum ON treatments (kingdom, phylum)`
    },
    {
        name: 'ix_treatments_k_p_class',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_k_p_class ON treatments (kingdom, phylum, class)`
    },
    {
        name: 'ix_treatments_k_p_c_order',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_k_p_c_order ON treatments (kingdom, phylum, class, "order")`
    },
    {
        name: 'ix_treatments_k_p_c_o_family',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_k_p_c_o_family ON treatments (kingdom, phylum, class, "order", family)`
    },
    {
        name: 'ix_treatments_k_p_c_o_f_genus',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_k_p_c_o_f_genus ON treatments (kingdom, phylum, class, "order", family, genus)`
    },
    {
        name: 'ix_treatments_k_p_c_o_f_g_species',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_k_p_c_o_f_g_species ON treatments (kingdom, phylum, class, "order", family, genus, species)`
    },
    {
        name: 'ix_treatments_facets',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_facets ON treatments (treatmentId, journalTitle, journalYear, kingdom, phylum, "order", family, genus, species, status, rank)`
    },
    {
        name: 'ix_treatments_checkinTime',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_checkinTime ON treatments (checkinTime)`
    },
    {
        name: 'ix_treatments_updateTime',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_updateTime ON treatments (updateTime)`
    },
    {
        name: 'ix_treatments_deleted',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatments_deleted ON treatments (deleted)`
    }
];

// Triggers to keep the FTS index up to date.
// modeled after the triggers on https://sqlite.org/fts5.html
const triggers = [
    {
        name: 'treatments_afterInsert',
        create: `CREATE TRIGGER IF NOT EXISTS ${alias}.treatments_afterInsert AFTER INSERT ON treatments 
        BEGIN
            INSERT INTO ftsTreatments(rowid, treatmentTitle, fulltext) 
            VALUES (new.id, new.treatmentTitle, new.fulltext);
        END;`
    },
    {
        name: 'treatments_afterDelete',
        create: `CREATE TRIGGER IF NOT EXISTS ${alias}.treatments_afterDelete AFTER DELETE ON treatments 
        BEGIN
            INSERT INTO ftsTreatments(ftsTreatments, rowid, treatmentTitle, fulltext) 
            VALUES('delete', old.id, old.treatmentTitle, old.fulltext);
        END;`
    },
    {
        name: 'treatments_afterUpdate',
        create: `CREATE TRIGGER IF NOT EXISTS ${alias}.treatments_afterUpdate AFTER UPDATE ON treatments 
        BEGIN
            INSERT INTO ftsTreatments(ftsTreatments, rowid, treatmentTitle, fulltext) 
            VALUES('delete', old.id, old.treatmentTitle, old.fulltext);

            INSERT INTO ftsTreatments(rowid, treatmentTitle, fulltext) 
            VALUES (new.id, new.treatmentTitle, new.fulltext);
        END;`
    }
];

export { tables, indexes, triggers }