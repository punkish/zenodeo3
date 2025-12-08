CREATE TABLE treatments (
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
CREATE VIRTUAL TABLE treatmentsFts USING fts5 (
    fulltext, content='treatments', content_rowid='id'
)
CREATE VIRTUAL TABLE treatmentsFtVrow USING fts5vocab(
    'treatmentsFts', 'row'
)
/* treatmentsFtVrow(term,doc,cnt) */;
CREATE VIRTUAL TABLE treatmentsFtVcol USING fts5vocab(
    'treatmentsFts', 'col'
)
/* treatmentsFtVcol(term,col,doc,cnt) */;
CREATE VIRTUAL TABLE treatmentsFtVins USING fts5vocab(
    'treatmentsFts', 'instance'
)
/* treatmentsFtVins(term,doc,col,"offset") */;
CREATE TRIGGER treatments_ai AFTER INSERT ON treatments
    BEGIN
        INSERT INTO treatmentsFts (rowid, fulltext)
        VALUES (new.id, new.fulltext);
    END;
CREATE TRIGGER treatments_ad AFTER DELETE ON treatments
    BEGIN
        INSERT INTO treatmentsFts (treatmentsFts, rowid, fulltext)
        VALUES ('delete', old.id, old.fulltext);
    END;
CREATE TRIGGER treatments_au AFTER UPDATE ON treatments
    BEGIN
        -- To emulate an Update
        -- Delete the old value
        INSERT INTO treatmentsFts (treatmentsFts, rowid, fulltext)
        VALUES ('delete', old.id, old.fulltext);

        -- Insert the new value
        INSERT INTO treatmentsFts (rowid, fulltext)
        VALUES (new.id, new.fulltext);
    END;
CREATE TABLE journals (
        id INTEGER PRIMARY KEY,
        journalTitle TEXT UNIQUE ON CONFLICT IGNORE
    );
CREATE TABLE journalsByYears (
    journals_id INTEGER NOT NULL REFERENCES journals(id),
    journalYear INTEGER NOT NULL,

    -- Number of times a treatment from a journal with this
    -- specific was journals_id was processed in this journalYear
    num INTEGER NOT NULL,
    PRIMARY KEY (journals_id, journalYear)
) WITHOUT rowid;
CREATE TABLE kingdoms (
    id INTEGER PRIMARY KEY,
    kingdom TEXT UNIQUE ON CONFLICT IGNORE
);
CREATE TABLE phyla (
    id INTEGER PRIMARY KEY,
    phylum TEXT UNIQUE ON CONFLICT IGNORE
);
CREATE TABLE classes (
    id INTEGER PRIMARY KEY,
    class TEXT UNIQUE ON CONFLICT IGNORE
);
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    "order" TEXT UNIQUE ON CONFLICT IGNORE
);
CREATE TABLE genera (
    id INTEGER PRIMARY KEY,
    genus TEXT UNIQUE ON CONFLICT IGNORE
);
CREATE TABLE families (
    id INTEGER PRIMARY KEY,
    family TEXT UNIQUE ON CONFLICT IGNORE
);
CREATE TABLE species (
    id INTEGER PRIMARY KEY,
    species TEXT UNIQUE ON CONFLICT IGNORE
);
CREATE TABLE materialCitations (
    id INTEGER PRIMARY KEY,
    materialCitationId TEXT UNIQUE NOT NULL CHECK(Length(materialCitationId) = 32),
    treatments_id INTEGER NOT NULL REFERENCES treatments(id),
    collectingDate TEXT,

    -- The collection codes as a CSV string as they appear in text
    collectionCodeCSV TEXT COLLATE NOCASE,

    -- The person who collected the specimen
    collectorName TEXT COLLATE NOCASE,

    -- The country where the specimen was collected
    country TEXT COLLATE NOCASE,

    -- The geographic region where the specimen was collected
    collectingRegion TEXT COLLATE NOCASE,

    -- The municipality where the specimen was collected
    municipality TEXT COLLATE NOCASE,

    -- The county where the specimen was collected
    county TEXT COLLATE NOCASE,

    -- The state or province where the specimen was collected
    stateProvince TEXT COLLATE NOCASE,

    -- The location where the specimen was collected
    location TEXT COLLATE NOCASE,

    -- The distance to the nearest location, e.g. 23km NW from…
    locationDeviation TEXT COLLATE NOCASE,

    -- The number of listed female specimens
    specimenCountFemale INTEGER,

    -- The number of listed male specimens
    specimenCountMale INTEGER,

    -- The number of listed specimens
    specimenCount INTEGER,

    -- The code of the specimen
    specimenCode TEXT COLLATE NOCASE,

    -- The type status
    typeStatus TEXT COLLATE NOCASE,

    -- The person or agent who identified the specimen
    determinerName TEXT COLLATE NOCASE,

    -- The substrate where the specimen has been collected,
    --  e.g. leaf, flower
    collectedFrom TEXT COLLATE NOCASE,

    -- The method used for collecting the specimen
    collectingMethod TEXT COLLATE NOCASE,

    -- geographic coordinates of the specimen
    latitude REAL,
    longitude REAL,
    validGeo BOOLEAN GENERATED ALWAYS AS (
        typeof(latitude) = 'real'
        AND abs(latitude) < 90
        AND typeof(longitude) = 'real'
        AND abs(longitude) <= 180
    ) STORED,

    elevation REAL,

    -- The persistent identifier of the specimen
    httpUri TEXT COLLATE NOCASE,
    deleted INTEGER DEFAULT 0,
    isOnLand INTEGER DEFAULT NULL,
    ecoregions_id INTEGER,
    biomes_id INTEGER,
    realms_id INTEGER,
    fulltext TEXT COLLATE NOCASE
);
CREATE TABLE collectionCodes (
    id INTEGER PRIMARY KEY,
    collectionCode TEXT UNIQUE NOT NULL COLLATE NOCASE,

    -- Collection-specific information follows
    country TEXT COLLATE NOCASE,
    name TEXT COLLATE NOCASE,
    httpUri TEXT COLLATE NOCASE,
    lsid TEXT COLLATE NOCASE,
    type TEXT COLLATE NOCASE
);
CREATE TABLE materialCitations_collectionCodes (
    materialCitations_id INTEGER NOT NULL REFERENCES materialCitations(id),
    collectionCodes_id INTEGER NOT NULL REFERENCES collectionCodes(id),
    PRIMARY KEY (materialCitations_id, collectionCodes_id)
) WITHOUT rowid;
CREATE VIRTUAL TABLE materialCitationsRtree USING rtree (

    -- corresponds to materialCitations.id
    id,

    --                                   maxX, maxY
    --       +--------------------------------+
    --       |                                |
    --       |               x lng, lat       |
    --       |                                |
    --       +--------------------------------+
    --  minX, minY
    minX,
    maxX,
    minY,
    maxY,

    +longitude REAL NOT NULL,
    +latitude REAL NOT NULL,

    -- ID of parent treatment
    +treatments_id INTEGER NOT NULL
)
CREATE TRIGGER materialCitations_loc_ai AFTER INSERT ON materialCitations
    WHEN new.validGeo = 1
    BEGIN

        -- insert new entry in the rtree table
        INSERT INTO materialCitationsRtree (
            id,
            minX,
            maxX,
            minY,
            maxY,
            longitude,
            latitude,
            treatments_id
        )
        SELECT
            id,
            json_extract(g, '$[0][0]') AS minX,
            json_extract(g, '$[2][0]') AS maxX,
            json_extract(g, '$[0][1]') AS minY,
            json_extract(g, '$[2][1]') AS maxY,
            longitude,
            latitude,
            treatments_id
        FROM (
            SELECT
                new.id,
                geopoly_json(
                    geopoly_bbox(
                        geopoly_regular(
                            new.longitude,
                            new.latitude,

                            -- 5 meters in degrees at given latitude
                            abs(5/(40075017*cos(new.latitude)/360)),

                            -- num of sides of poly
                            4
                        )
                    )
                ) AS g,
                new.longitude,
                new.latitude,
                new.treatments_id
        );

        -- update treatments.validGeo
        UPDATE treatments
        SET validGeo = 1
        WHERE id = new.treatments_id;
    END;
CREATE VIEW binomensView AS
    SELECT DISTINCT
        genus || ' ' || species AS binomen
    FROM
        treatments
        JOIN genera ON genera_id = genera.id
        JOIN species ON species_id = species.id
    WHERE
        rank = 'species'
        AND genera_id IS NOT NULL
        AND genera_id != 18
        AND species_id IS NOT NULL
        AND species_id != 2
/* binomensView(binomen) */;
CREATE VIRTUAL TABLE binomens USING fts5 (
    binomen, tokenize='trigram'
)
CREATE TABLE figureCitations (
    id INTEGER PRIMARY KEY,
    figureCitationId TEXT NOT NULL Check(Length(figureCitationId = 32)),
    treatments_id INTEGER NOT NULL REFERENCES treatments(id),
    httpUri TEXT NOT NULL UNIQUE ON CONFLICT IGNORE,

    figureDoiOriginal TEXT,

    -- The DOI of the image cleaned up
    figureDoi TEXT GENERATED ALWAYS AS (Iif(
        Instr(figureDoiOriginal, '/10.'),
        Substr(figureDoiOriginal, Instr(figureDoiOriginal, '/10.') + 1),
        figureDoiOriginal
    )) STORED,

    -- serial number of figure for a figureCitationId and
    -- treatmentId combination
    figureNum INTEGER DEFAULT 0,
    updateVersion INTEGER,
    captionText TEXT COLLATE NOCASE,
    UNIQUE (figureCitationId, figureNum)
);
CREATE VIEW images AS
    SELECT
        id,
        treatments_id,
        httpUri,
        figureDoi,
        captionText
    FROM
        figureCitations
/* images(id,treatments_id,httpUri,figureDoi,captionText) */;
CREATE TABLE treatmentAuthors (
    id INTEGER PRIMARY KEY,
    treatmentAuthorId TEXT NOT NULL Check(Length(treatmentAuthorId) = 32),
    treatments_id INTEGER NOT NULL REFERENCES treatments(id),

    -- The author of this treatment (author of the article is used if
    -- no treatment authority is found)
    treatmentAuthor TEXT COLLATE NOCASE,
    email TEXT COLLATE NOCASE
);
CREATE TABLE treatmentCitations (
    id INTEGER PRIMARY KEY,
    treatmentCitationId TEXT UNIQUE NOT NULL CHECK(Length(treatmentCitationId) = 32),
    treatments_id INTEGER NOT NULL REFERENCES treatments(id),
    bibRefCitations_id INTEGER REFERENCES bibRefCitations(id),

    -- The taxonomic name and the author of the species,
    -- plus the author of the treatment being cited
    treatmentCitation TEXT COLLATE NOCASE,

    -- The bibliographic reference string of the treatments cited by
    -- this treatment
    refString TEXT COLLATE NOCASE
);
CREATE VIEW treatmentCitationsView AS
    SELECT
        t.treatmentCitationId,
        t.treatments_id,
        t.treatmentCitation,
        t.refString,
        t.bibRefCitations_id,
        b.bibRefCitationId
    FROM
        treatmentCitations t
        JOIN bibRefCitations b ON t.bibRefCitations_id = b.id
/* treatmentCitationsView(treatmentCitationId,treatments_id,treatmentCitation,refString,bibRefCitations_id,bibRefCitationId) */;
CREATE TRIGGER treatmentCitationsView_ii INSTEAD OF INSERT ON treatmentCitationsView
    BEGIN
        INSERT INTO treatmentCitations (
            treatmentCitationId,
            treatments_id,
            treatmentCitation,
            refString
        )
        VALUES (
            new.treatmentCitationId,
            new.treatments_id,
            new.treatmentCitation,
            new.refString
        );

        UPDATE treatmentCitations
        SET bibRefCitations_id = (SELECT id FROM bibRefCitations WHERE bibRefCitationId = new.bibRefCitationId)
        WHERE treatmentCitationId = new.treatmentCitationId;
    END;
CREATE TABLE bibRefCitations (
    id INTEGER PRIMARY KEY,
    bibRefCitationId TEXT UNIQUE NOT NULL CHECK(Length(bibRefCitationId) = 32),
    treatments_id INTEGER NOT NULL REFERENCES treatments(id),
    DOI TEXT COLLATE NOCASE,
    author TEXT COLLATE NOCASE,
    journalOrPublisher TEXT COLLATE NOCASE,
    title TEXT COLLATE NOCASE,
    type TEXT COLLATE NOCASE,
    year INTEGER,

    -- The full text and innertext of the reference
    -- cited by the treatment
    refString TEXT COLLATE NOCASE,
    innertext TEXT COLLATE NOCASE
);
CREATE INDEX figureCitations_treatmentsId ON figureCitations(
    treatments_id
);
CREATE INDEX materialCitations_treatmentsId ON materialCitations(
    treatments_id
);
CREATE INDEX figureCitations_images ON figureCitations(
    id,
    treatments_id,
    httpUri,
    captionText
);
CREATE INDEX treatments_images ON treatments(
    id,
    treatmentId,
    treatmentTitle,
    treatmentDOI,
    zenodoDep,
    articleTitle,
    articleAuthor
);
CREATE INDEX materialCitations_images ON materialCitations(
    treatments_id,
    latitude,
    longitude
);
CREATE INDEX treatments_orders ON treatments(orders_id);
CREATE INDEX treatments_classes ON treatments(classes_id);
CREATE INDEX treatments_families ON treatments(families_id);
CREATE INDEX treatments_binomens ON treatments(
    rank,
    genera_id,
    species_id
);
CREATE TABLE sqlite_stat1(tbl,idx,stat);
CREATE TABLE sqlite_stat4(tbl,idx,neq,nlt,ndlt,sample);