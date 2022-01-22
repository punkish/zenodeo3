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
            zenodoDep TEXT,
            zoobankId TEXT,
            articleId TEXT,
            articleTitle TEXT,
            articleAuthor INTEGER,
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
            "order" TEXT,
            family TEXT,
            genus TEXT,
            species TEXT,
            status TEXT,
            taxonomicNameLabel TEXT,
            rank TEXT,
            fulltext TEXT,
            --author TEXT,
            updateTime INTEGER,
            checkinTime INTEGER,
            deleted INTEGER DEFAULT 0,
            created INTEGER DEFAULT (strftime('%s','now')),
            updated INTEGER
        )`,
        insert: `INSERT INTO treatments (
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
            "order",
            family,
            genus,
            species,
            status,
            taxonomicNameLabel,
            rank,
            fulltext,
            --author,
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
            @order,
            @family,
            @genus,
            @species,
            @status,
            @taxonomicNameLabel,
            @rank,
            @fulltext,
            --@author,
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
            "order"=excluded."order",
            family=excluded.family,
            genus=excluded.genus,
            species=excluded.species,
            status=excluded.status,
            taxonomicNameLabel=excluded.taxonomicNameLabel,
            rank=excluded.rank,
            fulltext=excluded.fulltext,
            --author=excluded.author,
            updateTime=excluded.updateTime,
            checkinTime=excluded.checkinTime,
            deleted=excluded.deleted,
            updated=strftime('%s','now')`,
        preparedinsert: '',
        data: []
    },
    {
        name: 'vtreatments',
        type: 'virtual',
        create: `CREATE VIRTUAL TABLE IF NOT EXISTS vtreatments USING FTS5(
            treatmentId, 
            fullText
        )`,
        insert: `INSERT INTO vtreatments 
                SELECT treatmentId, fulltext 
                FROM treatments 
                WHERE rowid > @maxrowid AND deleted = 0`,
        preparedinsert: '',
        maxrowid: 0
    }
]

const indexes = [
    `CREATE INDEX IF NOT EXISTS ix_treatments_treatmentId        ON treatments (deleted, treatmentId)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_treatmentTitle     ON treatments (deleted, treatmentTitle COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_articleTitle       ON treatments (deleted, articleTitle COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_publicationDate    ON treatments (deleted, publicationDate)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_journalTitle       ON treatments (deleted, journalTitle COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_journalYear        ON treatments (deleted, journalYear)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_authorityName      ON treatments (deleted, authorityName COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_taxonomicNameLabel ON treatments (deleted, taxonomicNameLabel COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_kingdom            ON treatments (deleted, kingdom COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_phylum             ON treatments (deleted, phylum COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_order              ON treatments (deleted, "order" COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_family             ON treatments (deleted, family COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_genus              ON treatments (deleted, genus COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_species            ON treatments (deleted, species COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_status             ON treatments (deleted, status COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_rank               ON treatments (deleted, rank COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_k_phylum           ON treatments (deleted, kingdom, phylum)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_k_p_order          ON treatments (deleted, kingdom, phylum, "order")`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_k_p_o_family       ON treatments (deleted, kingdom, phylum, "order", family)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_k_p_o_f_genus      ON treatments (deleted, kingdom, phylum, "order", family, genus)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_k_p_o_f_g_species  ON treatments (deleted, kingdom, phylum, "order", family, genus, species)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_facets             ON treatments (deleted, treatmentId, journalTitle, journalYear, kingdom, phylum, "order", family, genus, species, status, rank)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_checkinTime        ON treatments (deleted, checkinTime)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_updateTime         ON treatments (deleted, updateTime)`,
    `CREATE INDEX IF NOT EXISTS ix_treatments_deleted            ON treatments (deleted)`,
]

module.exports = { tables, indexes }