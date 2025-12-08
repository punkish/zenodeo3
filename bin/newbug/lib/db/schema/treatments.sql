/* treatments */
CREATE TABLE IF NOT EXISTS treatments (
    id INTEGER PRIMARY KEY,
    treatmentId TEXT UNIQUE NOT NULL,
    treatmentTitle TEXT NOT NULL COLLATE NOCASE,
    treatmentVersion INTEGER,
    treatmentDOIorig TEXT COLLATE NOCASE,

    -- DOI of the treatment cleaned up by removing leading
    -- 'http://doi.org/'
    treatmentDOI TEXT GENERATED ALWAYS AS (Iif(
        Instr(treatmentDOIorig, '/10.'),
        Substr(treatmentDOIorig, Instr(treatmentDOIorig, '/10.') + 1),
        treatmentDOIorig
    )) STORED,

    treatmentLSID TEXT COLLATE NOCASE,

    -- Zenodo deposition number
    zenodoDep INTEGER,
    zoobankId TEXT COLLATE NOCASE,

    -- Data on the article in which the treatment was published
    articleId TEXT NOT NULL,
    articleTitle TEXT COLLATE NOCASE,
    articleAuthor TEXT COLLATE NOCASE,
    articleDOIorig TEXT COLLATE NOCASE,
    articleDOI TEXT GENERATED ALWAYS AS (Iif(
        Instr(articleDOIorig, '/10.'),
        Substr(articleDOIorig, Instr(articleDOIorig, '/10.') + 1),
        articleDOIorig
    )) STORED,

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

    -- Information on the authority of the treatment
    authorityName TEXT COLLATE NOCASE,
    authorityYear INTEGER,

    -- taxon classification
    kingdoms_id INTEGER DEFAULT NULL REFERENCES kingdoms(id),
    phyla_id INTEGER DEFAULT NULL REFERENCES phyla(id),
    classes_id INTEGER DEFAULT NULL REFERENCES classes(id),
    orders_id INTEGER DEFAULT NULL REFERENCES orders(id),
    genera_id INTEGER DEFAULT NULL REFERENCES genera(id),
    families_id INTEGER DEFAULT NULL REFERENCES families(id),
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
    --summary TEXT,

    -- A boolean that tracks if the summary is filled correctly
    --hasSpeciesSummary BOOLEAN GENERATED ALWAYS AS (
    --    Iif(summary IS NULL OR Substring(summary, 1, 5) = 'I don', 0, 1)
    --) VIRTUAL,

    -- fulltext of the treatment with the XML tags removed
    fulltext TEXT
);

/* fts tables for treatments fulltext */
CREATE VIRTUAL TABLE IF NOT EXISTS treatmentsFts USING fts5 (
    fulltext, content='treatments', content_rowid='id'
);

/* the following three fts5vocab tables are populated automatically */
CREATE VIRTUAL TABLE IF NOT EXISTS treatmentsFtVrow USING fts5vocab(
    'treatmentsFts', 'row'
);

CREATE VIRTUAL TABLE IF NOT EXISTS treatmentsFtVcol USING fts5vocab(
    'treatmentsFts', 'col'
);

CREATE VIRTUAL TABLE IF NOT EXISTS treatmentsFtVins USING fts5vocab(
    'treatmentsFts', 'instance'
);

/* after-insert trigger to keep treatments and treatmentsFts in sync */
CREATE TRIGGER IF NOT EXISTS treatments_ai AFTER INSERT ON treatments
    BEGIN
        INSERT INTO treatmentsFts (rowid, fulltext) 
        VALUES (new.id, new.fulltext);
    END;

/* after-delete trigger to keep treatments and treatmentsFts in sync */
CREATE TRIGGER IF NOT EXISTS treatments_ad AFTER DELETE ON treatments
    BEGIN
        INSERT INTO treatmentsFts (treatmentsFts, rowid, fulltext)
        VALUES ('delete', old.id, old.fulltext);
    END;

/* after-update trigger to keep treatments and treatmentsFts in sync */
CREATE TRIGGER IF NOT EXISTS treatments_au AFTER UPDATE ON treatments
    BEGIN
        -- To emulate an Update
        -- Delete the old value
        INSERT INTO treatmentsFts (treatmentsFts, rowid, fulltext)
        VALUES ('delete', old.id, old.fulltext);

        -- Insert the new value
        INSERT INTO treatmentsFts (rowid, fulltext)
        VALUES (new.id, new.fulltext);
    END;