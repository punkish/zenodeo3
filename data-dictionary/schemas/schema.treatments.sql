CREATE TABLE treatments (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The unique resourceId of the treatment
    "treatmentId" TEXT UNIQUE NOT NULL CHECK(Length(treatmentId) = 32),

    -- Title of the treatment
    "treatmentTitle" TEXT,

    -- The version of the treatment
    "treatmentVersion" INTEGER,

    -- DOI of the treatment
    "treatmentDOI" TEXT,

    -- LSID of the treatment
    "treatmentLSID" TEXT,

    -- Zenodo deposition number
    "zenodoDep" INTEGER,

    -- ZooBank ID of the journal article
    "zoobankId" TEXT,

    -- The unique ID of the article
    "articleId" TEXT NOT NULL,

    -- The article in which the treatment was published
    "articleTitle" TEXT,

    -- The author of the article in which the treatment was published
    "articleAuthor" TEXT,

    -- DOI of journal article
    "articleDOI" TEXT,

    -- The publication date of the treatment
    "publicationDate" TEXT,

    -- ID of the journal
    "journalId" INTEGER DEFAULT NULL REFERENCES journals(journalId),

    -- The year of the journal
    "journalYear" TEXT,

    -- The volume of the journal
    "journalVolume" TEXT,

    -- The issue of the journal
    "journalIssue" TEXT,

    -- The "from" and "to" pages where the treatment occurs in the published
    -- article
    "pages" TEXT,

    -- The author(s) of the treatment
    "authorityName" TEXT,

    -- The year when the taxon name was published
    "authorityYear" TEXT,

    -- The higher category of the taxonomicName
    "kingdom" TEXT,

    -- The higher category of the taxonomicName
    "phylum" TEXT,

    -- The higher category of the taxonomicName
    "class" TEXT,

    -- The higher category of the taxonomicName
    "order" TEXT,

    -- The higher category of the taxonomicName
    "family" TEXT,

    -- The higher category of the taxonomicName
    "genus" TEXT,

    -- The higher category of the taxonomicName
    "species" TEXT,

    -- The descriptor for the taxonomic status proposed by a given treatment
    "status" TEXT,

    -- The Taxonomic Name Label of a new species
    "taxonomicNameLabel" TEXT,

    -- The taxonomic rank of the taxon, e.g. species, family
    "rank" TEXT,

    -- The time when the treatment was last updated (stored as ms since
    -- unixepoch)
    "updateTime" INTEGER,

    -- The time when the article was first uploaded into the system (stored
    -- as ms since unixepoch)
    "checkinTime" INTEGER,

    -- The full text of the treatment
    "fulltext" TEXT,

    -- A boolean that tracks whether or not this resource is considered
    -- deleted/revoked, 1 if yes, 0 if no
    "deleted" INTEGER DEFAULT 0,

    -- Four digit year of checkinTime
    "checkInYear" INTEGER GENERATED ALWAYS AS (
        strftime('%Y', datetime(checkinTime/1000, 'unixepoch'))
    ) VIRTUAL,

    -- ms since epoch record created in zenodeo
    "created" INTEGER DEFAULT (strftime('%s','now') * 1000),

    -- ms since epoch record updated in zenodeo
    "updated" INTEGER
);
CREATE TABLE treatments_x_collectionCodes (

    -- The ID of the related treatment (FK)
    "treatmentId" TEXT NOT NULL REFERENCES treatments(treatmentId),

    -- The ID of the related collectionCode (FK)
    "collectionCode" TEXT NOT NULL REFERENCES collectionCodes(collectionCode),

    -- primary key declaration
    PRIMARY KEY ("treatmentId", "collectionCode")
) WITHOUT rowid;
CREATE TABLE journals (

    -- PK
    "journalId" INTEGER PRIMARY KEY,

    -- The journal in which the treatment was published
    "journalTitle" TEXT UNIQUE NOT NULL
);
CREATE TABLE journals_x_year (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- FK to journals(journalId)
    "journalId" INTEGER NOT NULL REFERENCES journals(journalId),

    -- Year the journal was published
    "journalYear" INTEGER NOT NULL,

    -- Number of times the journal was processed in a given year
    "num" INTEGER NOT NULL,

    -- unique declaration
    UNIQUE ("journalId", "journalYear")
);
CREATE VIRTUAL TABLE treatmentsFts USING fts5 (
    treatmentTitle,
    fulltext,
    content=''
)
/* treatmentsFts(treatmentTitle,fulltext) */;
CREATE TABLE IF NOT EXISTS 'treatmentsFts_data'(id INTEGER PRIMARY KEY, block BLOB);
CREATE TABLE IF NOT EXISTS 'treatmentsFts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS 'treatmentsFts_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
CREATE TABLE IF NOT EXISTS 'treatmentsFts_config'(k PRIMARY KEY, v) WITHOUT ROWID;
CREATE TRIGGER tr_afterInsertFts
            AFTER INSERT ON treatments
            BEGIN

                -- insert new entry in fulltext index
                INSERT INTO treatmentsFts(
                    rowid,
                    treatmentTitle,
                    fulltext
                )
                VALUES (
                    new.id,
                    new.treatmentTitle,
                    new.fulltext
                );
            END;
CREATE TRIGGER tr_afterInsertJournal
                AFTER INSERT ON treatments
                WHEN new.journalId IS NOT NULL
                BEGIN

                    -- insert or update journals by year frequency
                    INSERT INTO journals_x_year (
                        journalId,
                        journalYear,
                        num
                    )
                    VALUES (
                        new.journalId,
                        new.journalYear,
                        1
                    )
                    ON CONFLICT(journalId, journalYear)
                    DO UPDATE SET num = num + 1;
                END;
CREATE TRIGGER tr_afterDelete
            AFTER DELETE ON treatments
            BEGIN

                -- update the count in the journals by year freq table
                UPDATE journals_x_year
                SET num = num - 1
                WHERE
                    journalId = old.journalId AND
                    journalYear = old.journalYear;

                -- "delete" the old index from the fts table
                INSERT INTO treatmentsFts(
                    treatmentsFts,
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
            END;
CREATE TRIGGER tr_afterUpdate
            AFTER UPDATE ON treatments
            BEGIN

                -- "delete" the old index from the fts table
                INSERT INTO treatmentsFts(
                    treatmentsFts,
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

                -- add the new index to the fts table
                INSERT INTO treatmentsFts(
                    rowid,
                    treatmentTitle,
                    fulltext
                )
                VALUES (
                    new.id,
                    new.treatmentTitle,
                    new.fulltext
                );
            END;
CREATE INDEX ix_treatments_treatmentId ON treatments ("treatmentId");
CREATE INDEX ix_treatments_treatmentTitle ON treatments ("treatmentTitle");
CREATE INDEX ix_treatments_articleId ON treatments ("articleId");
CREATE INDEX ix_treatments_articleTitle ON treatments ("articleTitle");
CREATE INDEX ix_treatments_articleAuthor ON treatments ("articleAuthor");
CREATE INDEX ix_treatments_publicationDate ON treatments ("publicationDate");
CREATE INDEX ix_treatments_journalId ON treatments ("journalId");
CREATE INDEX ix_treatments_journalYear ON treatments ("journalYear");
CREATE INDEX ix_treatments_authorityName ON treatments ("authorityName");
CREATE INDEX ix_treatments_authorityYear ON treatments ("authorityYear");
CREATE INDEX ix_treatments_kingdom ON treatments ("kingdom");
CREATE INDEX ix_treatments_phylum ON treatments ("phylum");
CREATE INDEX ix_treatments_class ON treatments ("class");
CREATE INDEX ix_treatments_order ON treatments ("order");
CREATE INDEX ix_treatments_family ON treatments ("family");
CREATE INDEX ix_treatments_genus ON treatments ("genus");
CREATE INDEX ix_treatments_species ON treatments ("species");
CREATE INDEX ix_treatments_status ON treatments ("status");
CREATE INDEX ix_treatments_taxonomicNameLabel ON treatments ("taxonomicNameLabel");
CREATE INDEX ix_treatments_rank ON treatments ("rank");
CREATE INDEX ix_treatments_updateTime ON treatments ("updateTime");
CREATE INDEX ix_treatments_checkinTime ON treatments ("checkinTime");
CREATE INDEX ix_treatments_deleted ON treatments ("deleted");
CREATE INDEX ix_treatments_x_collectionCodes_treatmentId ON treatments_x_collectionCodes ("treatmentId");
CREATE INDEX ix_treatments_x_collectionCodes_collectionCode ON treatments_x_collectionCodes ("collectionCode");
CREATE INDEX ix_treatmentAuthors_treatmentAuthorId ON treatmentAuthors ("treatmentAuthorId");
CREATE INDEX ix_treatmentAuthors_treatmentAuthor ON treatmentAuthors ("treatmentAuthor");
CREATE INDEX ix_treatmentAuthors_treatmentId ON treatmentAuthors ("treatmentId");
CREATE INDEX ix_journals_journalTitle ON journals ("journalTitle");
CREATE INDEX ix_journals_x_year_journalId ON journals_x_year ("journalId");
CREATE INDEX ix_journals_x_year_journalYear ON journals_x_year ("journalYear");