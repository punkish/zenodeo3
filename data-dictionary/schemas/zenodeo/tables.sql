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

CREATE TABLE IF NOT EXISTS journals (
    id INTEGER PRIMARY KEY, 
    journalTitle TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TABLE IF NOT EXISTS journalsByYears (
    journals_id INTEGER NOT NULL REFERENCES journals(id),
    journalYear INTEGER NOT NULL,

    -- Number of times a treatment from a journal with this 
    -- specific was journals_id was processed in this journalYear
    num INTEGER NOT NULL,
    PRIMARY KEY (journals_id, journalYear)
) WITHOUT rowid;

CREATE TABLE IF NOT EXISTS kingdoms (
    id INTEGER PRIMARY KEY, 
    kingdom TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TABLE IF NOT EXISTS phyla (
    id INTEGER PRIMARY KEY, 
    phylum TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY, 
    class TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY, 
    "order" TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TABLE IF NOT EXISTS genera (
    id INTEGER PRIMARY KEY, 
    genus TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TABLE IF NOT EXISTS families (
    id INTEGER PRIMARY KEY, 
    family TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TABLE IF NOT EXISTS species (
    id INTEGER PRIMARY KEY, 
    species TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TABLE IF NOT EXISTS treatmentCitations (
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

CREATE TABLE IF NOT EXISTS treatmentAuthors (
    id INTEGER PRIMARY KEY,
    treatmentAuthorId TEXT NOT NULL Check(Length(treatmentAuthorId) = 32),
    treatments_id INTEGER NOT NULL REFERENCES treatments(id),

    -- The author of this treatment (author of the article is used if
    -- no treatment authority is found)
    treatmentAuthor TEXT COLLATE NOCASE,
    email TEXT COLLATE NOCASE
);

CREATE TABLE IF NOT EXISTS rowcounts (
    tblname TEXT PRIMARY KEY NOT NULL, 
    rows INTEGER
);

CREATE TABLE IF NOT EXISTS materialCitations (
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

CREATE TABLE IF NOT EXISTS collectionCodes (
    id INTEGER PRIMARY KEY,
    collectionCode TEXT UNIQUE NOT NULL COLLATE NOCASE,

    -- Collection-specific information follows
    country TEXT COLLATE NOCASE,
    name TEXT COLLATE NOCASE,
    httpUri TEXT COLLATE NOCASE,
    lsid TEXT COLLATE NOCASE,
    type TEXT COLLATE NOCASE
);

CREATE TABLE IF NOT EXISTS materialCitations_collectionCodes (
    materialCitations_id INTEGER NOT NULL REFERENCES materialCitations(id),
    collectionCodes_id INTEGER NOT NULL REFERENCES collectionCodes(id),
    PRIMARY KEY (materialCitations_id, collectionCodes_id)
) WITHOUT rowid;

CREATE VIRTUAL TABLE IF NOT EXISTS materialCitationsRtree USING rtree (

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
);

CREATE TABLE IF NOT EXISTS figureCitations (
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

CREATE VIRTUAL TABLE IF NOT EXISTS imagesFts USING fts5 (
    captionText,
    content='images',
    content_rowid='id'
);

/* fts table for binomens */
CREATE VIRTUAL TABLE IF NOT EXISTS binomens USING fts5 (
    binomen, 
    tokenize='trigram'
);

CREATE TABLE IF NOT EXISTS bibRefCitations (
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