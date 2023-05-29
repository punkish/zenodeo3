CREATE TABLE treatments (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The unique resourceId of the treatment
    "treatmentId" TEXT UNIQUE NOT NULL CHECK(Length(treatmentId) = 32),

    -- Title of the treatment
    "treatmentTitle" TEXT COLLATE NOCASE,

    -- The version of the treatment
    "treatmentVersion" INTEGER,

    -- DOI of the treatment as extracted
    "treatmentDOIorig" TEXT COLLATE NOCASE,

    -- DOI of the treatment cleaned up
    "treatmentDOI" TEXT GENERATED ALWAYS AS (
                Iif(
                    Instr(treatmentDOIorig, '/10.'), 
                    Substr(
                        treatmentDOIorig, 
                        Instr(treatmentDOIorig, '/10.') + 1
                    ), 
                    treatmentDOIorig
                ) 
            ) STORED,

    -- LSID of the treatment
    "treatmentLSID" TEXT COLLATE NOCASE,

    -- Zenodo deposition number
    "zenodoDep" INTEGER,

    -- ZooBank ID of the journal article
    "zoobankId" TEXT COLLATE NOCASE,

    -- The unique ID of the article
    "articleId" TEXT NOT NULL,

    -- The article in which the treatment was published
    "articleTitle" TEXT COLLATE NOCASE,

    -- The author of the article in which the treatment was published
    "articleAuthor" TEXT COLLATE NOCASE,

    -- DOI of journal article as extracted
    "articleDOIorig" TEXT COLLATE NOCASE,

    -- DOI of journal article cleaned up
    "articleDOI" TEXT GENERATED ALWAYS AS (
                Iif(
                    Instr(articleDOIorig, '/10.'), 
                    Substr(
                        articleDOIorig, 
                        Instr(articleDOIorig, '/10.') + 1
                    ), 
                    articleDOIorig
                ) 
            ) STORED,

    -- The publication date of the treatment
    "publicationDate" TEXT,

    -- The publication date of the treatment in ms since unixepoch
    "publicationDateMs" INTEGER GENERATED ALWAYS AS (
            (julianday(publicationDate) - 2440587.5) * 86400 * 1000
        ) STORED,

    -- ID of the journal
    "journals_id" INTEGER DEFAULT NULL REFERENCES journals(id),

    -- The year of the journal
    "journalYear" INTEGER,

    -- The volume of the journal
    "journalVolume" TEXT COLLATE NOCASE,

    -- The issue of the journal
    "journalIssue" TEXT COLLATE NOCASE,

    -- The "from" and "to" pages where the treatment occurs in the published
    -- article
    "pages" TEXT COLLATE NOCASE,

    -- The author(s) of the treatment
    "authorityName" TEXT COLLATE NOCASE,

    -- The year when the taxon name was published
    "authorityYear" INTEGER,

    -- ID of the kingdom
    "kingdoms_id" INTEGER DEFAULT NULL REFERENCES kingdoms(id),

    -- ID of the phylum
    "phyla_id" INTEGER DEFAULT NULL REFERENCES phyla(id),

    -- ID of the class
    "classes_id" INTEGER DEFAULT NULL REFERENCES classes(id),

    -- ID of the order
    "orders_id" INTEGER DEFAULT NULL REFERENCES orders(id),

    -- ID of the family
    "families_id" INTEGER DEFAULT NULL REFERENCES families(id),

    -- ID of the genus
    "genera_id" INTEGER DEFAULT NULL REFERENCES genera(id),

    -- ID of the species
    "species_id" INTEGER DEFAULT NULL REFERENCES species(id),

    -- The descriptor for the taxonomic status proposed by a given treatment
    "status" TEXT COLLATE NOCASE,

    -- The Taxonomic Name Label of a new species
    "taxonomicNameLabel" TEXT COLLATE NOCASE,

    -- The taxonomic rank of the taxon, e.g. species, family
    "rank" TEXT COLLATE NOCASE,

    -- The time when the treatment was last updated (stored as ms since
    -- unixepoch)
    "updateTime" INTEGER,

    -- The time when the article was first uploaded into the system (stored
    -- as ms since unixepoch)
    "checkinTime" INTEGER,

    -- The full text of the treatment
    "fulltext" TEXT COLLATE NOCASE,

    -- A boolean that tracks whether or not this resource is considered
    -- deleted/revoked, 1 if yes, 0 if no
    "deleted" INTEGER DEFAULT 0,

    -- Four digit year of checkinTime
    "checkInYear" INTEGER GENERATED ALWAYS AS (
        strftime('%Y', datetime(checkinTime/1000, 'unixepoch'))
    ) VIRTUAL,

    -- ms since epoch record created in zenodeo
    "created" INTEGER DEFAULT ((julianday() - 2440587.5) * 86400 * 1000),

    -- ms since epoch record updated in zenodeo
    "updated" INTEGER,

    -- time taken in ms to parse XML
    "timeToParseXML" INTEGER,

    -- true if treatment has geolocation
    "validGeo" BOOLEAN
);
CREATE TRIGGER tr_afterInsertFts 
    AFTER INSERT ON treatments 
    BEGIN

        -- insert new entry in fulltext index
        INSERT INTO treatmentsFts( fulltext ) 
        VALUES ( new.fulltext );
    END;
CREATE TRIGGER tr_afterUpdate 
    AFTER UPDATE ON treatments 
    BEGIN

        -- "delete" the old index from the fts table
        INSERT INTO treatmentsFts( treatmentsFts, rowid, fulltext ) 
        VALUES( 'delete', old.id, old.fulltext );

        -- add the new index to the fts table
        INSERT INTO treatmentsFts( rowid, fulltext ) 
        VALUES ( new.id, new.fulltext );
    END;
CREATE TRIGGER tr_afterInsertJournal 
    AFTER INSERT ON treatments 
    WHEN new.journals_id IS NOT NULL 
    BEGIN

        -- insert or update journals by year frequency
        INSERT INTO journalsByYears (
            journals_id, 
            journalYear, 
            num
        )
        VALUES (
            new.journals_id, 
            new.journalYear, 
            1
        )
        ON CONFLICT(journals_id, journalYear) 
        DO UPDATE SET num = num + 1;
    END;
CREATE TRIGGER tr_afterDelete 
    AFTER DELETE ON treatments 
    BEGIN

        -- update the count in the journals by year freq table
        UPDATE journalsByYears 
        SET num = num - 1
        WHERE 
            journals_id = old.journals_id AND 
            journalYear = old.journalYear;

        -- "delete" the old index from the fts table
        INSERT INTO treatmentsFts( treatmentsFts, rowid, fulltext ) 
        VALUES( 'delete', old.id, old.fulltext );
    END;
CREATE INDEX ix_treatments_treatmentTitle ON treatments ("treatmentTitle");
CREATE INDEX ix_treatments_treatmentVersion ON treatments ("treatmentVersion");
CREATE INDEX ix_treatments_treatmentDOI ON treatments ("treatmentDOI");
CREATE INDEX ix_treatments_articleId ON treatments ("articleId");
CREATE INDEX ix_treatments_articleTitle ON treatments ("articleTitle");
CREATE INDEX ix_treatments_articleAuthor ON treatments ("articleAuthor");
CREATE INDEX ix_treatments_articleDOI ON treatments ("articleDOI");
CREATE INDEX ix_treatments_publicationDate ON treatments ("publicationDate");
CREATE INDEX ix_treatments_publicationDateMs ON treatments ("publicationDateMs");
CREATE INDEX ix_treatments_journals_id ON treatments ("journals_id");
CREATE INDEX ix_treatments_journalYear ON treatments ("journalYear");
CREATE INDEX ix_treatments_authorityName ON treatments ("authorityName");
CREATE INDEX ix_treatments_authorityYear ON treatments ("authorityYear");
CREATE INDEX ix_treatments_kingdoms_id ON treatments ("kingdoms_id");
CREATE INDEX ix_treatments_phyla_id ON treatments ("phyla_id");
CREATE INDEX ix_treatments_classes_id ON treatments ("classes_id");
CREATE INDEX ix_treatments_orders_id ON treatments ("orders_id");
CREATE INDEX ix_treatments_families_id ON treatments ("families_id");
CREATE INDEX ix_treatments_genera_id ON treatments ("genera_id");
CREATE INDEX ix_treatments_species_id ON treatments ("species_id");
CREATE INDEX ix_treatments_status ON treatments ("status");
CREATE INDEX ix_treatments_taxonomicNameLabel ON treatments ("taxonomicNameLabel");
CREATE INDEX ix_treatments_rank ON treatments ("rank");
CREATE INDEX ix_treatments_updateTime ON treatments ("updateTime");
CREATE INDEX ix_treatments_checkinTime ON treatments ("checkinTime");
CREATE INDEX ix_treatments_deleted ON treatments ("deleted");
CREATE INDEX ix_treatments_validGeo ON treatments ("validGeo");
CREATE TABLE classes (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The higher category of the taxonomicName
    "class" TEXT UNIQUE NOT NULL COLLATE NOCASE
);
CREATE TABLE families (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The higher category of the taxonomicName
    "family" TEXT UNIQUE NOT NULL COLLATE NOCASE
);
CREATE TABLE genera (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The higher category of the taxonomicName
    "genus" TEXT UNIQUE NOT NULL COLLATE NOCASE
);
