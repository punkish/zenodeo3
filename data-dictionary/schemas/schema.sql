CREATE TABLE archives (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- One of yearly, monthly, weekly or daily
    "typeOfArchive" TEXT NOT NULL CHECK (typeOfArchive IN ('yearly', 'monthly', 'weekly', 'daily')),

    -- Time when the archive was created in UTC ms since epoch
    "timeOfArchive" INTEGER NOT NULL,

    -- Size of the archive in kilobytes
    "sizeOfArchive" INTEGER NOT NULL
);
CREATE TABLE bibRefCitations (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The unique ID of the bibRefCitation
    "bibRefCitationId" TEXT UNIQUE NOT NULL CHECK(Length(bibRefCitationId) = 32),

    -- The ID of the parent treatment (FK)
    "treatments_id" INTEGER NOT NULL,

    -- The author
    "author" TEXT COLLATE NOCASE,

    -- The journal or publisher
    "journalOrPublisher" TEXT COLLATE NOCASE,

    -- The title of the citation
    "title" TEXT COLLATE NOCASE,

    -- The full text of the reference cited by the treatment
    "refString" TEXT COLLATE NOCASE,

    -- The type of reference cited by the treatment
    "type" TEXT COLLATE NOCASE,

    -- The year of the reference cited by this treatment
    "year" TEXT COLLATE NOCASE,

    -- The full text of the bibRefCitation
    "fulltext" TEXT COLLATE NOCASE
);
CREATE VIRTUAL TABLE bibRefCitationsFts USING fts5 (
    fulltext,
    content=''
)
/* bibRefCitationsFts(fulltext) */;
CREATE TABLE IF NOT EXISTS 'bibRefCitationsFts_data'(id INTEGER PRIMARY KEY, block BLOB);
CREATE TABLE IF NOT EXISTS 'bibRefCitationsFts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS 'bibRefCitationsFts_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
CREATE TABLE IF NOT EXISTS 'bibRefCitationsFts_config'(k PRIMARY KEY, v) WITHOUT ROWID;
CREATE TABLE classes (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The higher category of the taxonomicName
    "class" TEXT UNIQUE NOT NULL COLLATE NOCASE
);
CREATE TABLE collectionCodes (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The collection code for a natural history collection
    "collectionCode" TEXT UNIQUE NOT NULL COLLATE NOCASE,

    -- The country of the collection
    "country" TEXT COLLATE NOCASE,

    -- The name of the collection
    "name" TEXT COLLATE NOCASE,

    -- The LSID of the collection
    "lsid" TEXT COLLATE NOCASE,

    -- The type of the collection
    "type" TEXT COLLATE NOCASE
);
CREATE TABLE downloads (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- FK to archives(id)
    "archives_id" INTEGER NOT NULL REFERENCES archives(id),

    -- start of process in ms
    "started" INTEGER,

    -- end of process in ms
    "ended" INTEGER
);
CREATE TABLE etl (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- FK to archives(id)
    "archives_id" INTEGER NOT NULL REFERENCES archives(id),

    -- Time ETL process started in UTC ms since epoch
    "started" INTEGER,

    -- Time ETL process ended in UTC ms since epoch
    "ended" INTEGER,

    -- Number of treatments in the archive
    "treatments" INTEGER,

    -- Number of treatmentCitations in the archive
    "treatmentCitations" INTEGER,

    -- Number of materialCitations in the archive
    "materialCitations" INTEGER,

    -- Number of figureCitations in the archive
    "figureCitations" INTEGER,

    -- Number of bibRefCitations in the archive
    "bibRefCitations" INTEGER,

    -- Number of authors in the archive
    "treatmentAuthors" INTEGER,

    -- Number of collection codes in the archive
    "collectionCodes" INTEGER,

    -- Number of journals in the archive
    "journals" INTEGER
);
CREATE TABLE families (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The higher category of the taxonomicName
    "family" TEXT UNIQUE NOT NULL COLLATE NOCASE
);
CREATE TABLE figureCitations (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The resourceId of the figureCitation
    "figureCitationId" TEXT NOT NULL Check(Length(figureCitationId = 32)),

    -- The ID of the parent treatment (FK)
    "treatments_id" INTEGER NOT NULL,

    -- serial number of figure for a figureCitationId and treatmentId
    -- combination
    "figureNum" INTEGER DEFAULT 0,

    -- The full text of the figure cited by this treatment
    "captionText" TEXT COLLATE NOCASE,

    -- The URI of the image
    "httpUri" TEXT COLLATE NOCASE,

    -- unique declaration
    UNIQUE ("figureCitationId", "figureNum")
);
CREATE VIRTUAL TABLE figureCitationsFts USING fts5 (
    captionText,
    content=''
)
/* figureCitationsFts(captionText) */;
CREATE TABLE IF NOT EXISTS 'figureCitationsFts_data'(id INTEGER PRIMARY KEY, block BLOB);
CREATE TABLE IF NOT EXISTS 'figureCitationsFts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS 'figureCitationsFts_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
CREATE TABLE IF NOT EXISTS 'figureCitationsFts_config'(k PRIMARY KEY, v) WITHOUT ROWID;
CREATE TABLE genera (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The higher category of the taxonomicName
    "genus" TEXT UNIQUE NOT NULL COLLATE NOCASE
);
CREATE TABLE journals (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The journal in which the treatment was published
    "journalTitle" TEXT UNIQUE NOT NULL COLLATE NOCASE
);
CREATE TABLE journalsByYears (

    -- FK to journals(id)
    "journals_id" INTEGER NOT NULL REFERENCES journals(id),

    -- Year the journal was published
    "journalYear" INTEGER NOT NULL,

    -- Number of times the journal was processed in a given year
    "num" INTEGER NOT NULL,

    -- Primary Key
    PRIMARY KEY ("journals_id", "journalYear")
);
CREATE TABLE kingdoms (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The higher category of the taxonomicName
    "kingdom" TEXT UNIQUE NOT NULL COLLATE NOCASE
);
CREATE TABLE materialCitations (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The unique resourceId of the materialCitation
    "materialCitationId" TEXT NOT NULL UNIQUE,

    -- The ID of the parent treatment (FK)
    "treatments_id" INTEGER NOT NULL,

    -- The date when the specimen was collected
    "collectingDate" TEXT COLLATE NOCASE,

    -- The collection codes as a CSV string as they appear in text
    "collectionCodeCSV" TEXT COLLATE NOCASE,

    -- The person who collected the specimen
    "collectorName" TEXT COLLATE NOCASE,

    -- The country where the specimen was collected
    "country" TEXT COLLATE NOCASE,

    -- The geographic region where the specimen was collected
    "collectingRegion" TEXT COLLATE NOCASE,

    -- A lower administrative region
    "municipality" TEXT COLLATE NOCASE,

    -- The county where the specimen was collected
    "county" TEXT COLLATE NOCASE,

    -- The state or province where the specimen was collected
    "stateProvince" TEXT COLLATE NOCASE,

    -- The location where the specimen was collected
    "location" TEXT COLLATE NOCASE,

    -- The distance to the nearest location, e.g. 23km NW from…
    "locationDeviation" TEXT COLLATE NOCASE,

    -- The number of listed female specimens
    "specimenCountFemale" INTEGER,

    -- The number of listed male specimens
    "specimenCountMale" INTEGER,

    -- The number of listed specimens
    "specimenCount" INTEGER,

    -- The code of the specimen
    "specimenCode" TEXT COLLATE NOCASE,

    -- The type status
    "typeStatus" TEXT COLLATE NOCASE,

    -- The person or agent who identified the specimen
    "determinerName" TEXT COLLATE NOCASE,

    -- The substrate where the specimen has been collected, e.g. leaf,
    -- flower
    "collectedFrom" TEXT COLLATE NOCASE,

    -- The method used for collecting the specimen
    "collectingMethod" TEXT COLLATE NOCASE,

    -- The geolocation of the treatment
    "latitude" REAL,

    -- The geolocation of the treatment
    "longitude" REAL,

    -- Elevation of the location where the specimen was collected
    "elevation" REAL,

    -- The persistent identifier of the specimen
    "httpUri" TEXT COLLATE NOCASE,

    -- A boolean that tracks whether or not this resource is considered
    -- deleted/revoked, 1 if yes, 0 if no
    "deleted" INTEGER DEFAULT 0,

    -- The full text of the material citation
    "fulltext" TEXT COLLATE NOCASE,

    -- 1 (true) if treatment has a valid geolocation
    "validGeo" INTEGER AS (
        CASE
            WHEN
                typeof(latitude) = 'real' AND
                abs(latitude) <= 90 AND
                typeof(longitude) = 'real' AND
                abs(longitude) <= 180
            THEN 1
            ELSE 0
        END
    ) STORED,

    -- 1 (true) if treatment is on land
    "isOnLand" INTEGER DEFAULT NULL
);
CREATE TABLE materialCitationsXcollectionCodes (

    -- The ID of the related materialCitation (FK)
    "materialCitations_id" TEXT NOT NULL REFERENCES materialCitations(id),

    -- The ID of the related collectionCode (FK)
    "collectionCodes_id" TEXT NOT NULL REFERENCES collectionCodes(id),

    -- primary key declaration
    PRIMARY KEY ("materialCitations_id", "collectionCodes_id")
) WITHOUT rowid;
CREATE VIRTUAL TABLE materialCitationsFts USING fts5 (
    fulltext,
    content=''
)
/* materialCitationsFts(fulltext) */;
CREATE TABLE IF NOT EXISTS 'materialCitationsFts_data'(id INTEGER PRIMARY KEY, block BLOB);
CREATE TABLE IF NOT EXISTS 'materialCitationsFts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS 'materialCitationsFts_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
CREATE TABLE IF NOT EXISTS 'materialCitationsFts_config'(k PRIMARY KEY, v) WITHOUT ROWID;
CREATE VIRTUAL TABLE materialCitationsGeopoly USING geopoly (
    materialCitations_id,
    treatments_id
)
/* materialCitationsGeopoly(_shape,materialCitations_id,treatments_id) */;
CREATE TABLE IF NOT EXISTS "materialCitationsGeopoly_rowid"(rowid INTEGER PRIMARY KEY,nodeno,a0,a1,a2);
CREATE TABLE IF NOT EXISTS "materialCitationsGeopoly_node"(nodeno INTEGER PRIMARY KEY,data);
CREATE TABLE IF NOT EXISTS "materialCitationsGeopoly_parent"(nodeno INTEGER PRIMARY KEY,parentnode);
CREATE VIRTUAL TABLE materialCitationsRtree USING rtree (

    -- Primary Key
    id,

    -- lower left longitude
    minX,

    -- upper right longitude
    maxX,

    -- lower left latitude
    minY,

    -- upper right latitude
    maxY,

    -- ID of parent materialCitation
    +materialCitations_id INTEGER NOT NULL,

    -- ID of parent treatment
    +treatments_id INTEGER NOT NULL
)
/* materialCitationsRtree(id,minX,maxX,minY,maxY,materialCitations_id,treatments_id) */;
CREATE TABLE IF NOT EXISTS "materialCitationsRtree_rowid"(rowid INTEGER PRIMARY KEY,nodeno,a0,a1);
CREATE TABLE IF NOT EXISTS "materialCitationsRtree_node"(nodeno INTEGER PRIMARY KEY,data);
CREATE TABLE IF NOT EXISTS "materialCitationsRtree_parent"(nodeno INTEGER PRIMARY KEY,parentnode);
CREATE TABLE orders (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The higher category of the taxonomicName
    "order" TEXT UNIQUE NOT NULL COLLATE NOCASE
);
CREATE TABLE phyla (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The higher category of the taxonomicName
    "phylum" TEXT UNIQUE NOT NULL COLLATE NOCASE
);
CREATE TABLE species (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The higher category of the taxonomicName
    "species" TEXT UNIQUE NOT NULL COLLATE NOCASE
);
CREATE TABLE treatmentAuthors (

    -- The unique resourceId of the treatmentAuthor
    "treatmentAuthorId" TEXT NOT NULL PRIMARY KEY,

    -- The author of this treatment (author of the article is used if
    -- no treatment authority is found)
    "treatmentAuthor" TEXT COLLATE NOCASE,

    -- The ID of the parent treatment (FK)
    "treatments_id" INTEGER NOT NULL
) WITHOUT rowid;
CREATE TABLE treatmentCitations (

    -- The unique resourceId of the treatmentCitation
    "treatmentCitationId" TEXT UNIQUE NOT NULL PRIMARY KEY CHECK(Length(treatmentCitationId) = 32),

    -- The ID of the parent treatment (FK)
    "treatments_id" INTEGER NOT NULL,

    -- The ID of the related bibRefCitation (FK)
    "bibRefCitations_id" INTEGER,

    -- The taxonomic name and the author of the species, plus the author
    -- of the treatment being cited
    "treatmentCitation" TEXT COLLATE NOCASE,

    -- The bibliographic reference string of the treatments cited by
    -- this treatment
    "refString" TEXT COLLATE NOCASE
) WITHOUT rowid;
CREATE TABLE treatmentImages (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The ID of the parent figureCitation (FK)
    "figureCitations_id" INTEGER NOT NULL ,

    -- The ID of the parent figureCitation (FK)
    "httpUri" TEXT NOT NULL UNIQUE,

    -- The ID of the parent figureCitation (FK)
    "captionText" TEXT NOT NULL COLLATE NOCASE,

    -- The ID of the parent treatment (FK)
    "treatments_id" INTEGER NOT NULL
);
CREATE TABLE treatments (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The unique resourceId of the treatment
    "treatmentId" TEXT UNIQUE NOT NULL CHECK(Length(treatmentId) = 32),

    -- Title of the treatment
    "treatmentTitle" TEXT COLLATE NOCASE,

    -- The version of the treatment
    "treatmentVersion" INTEGER,

    -- DOI of the treatment
    "treatmentDOI" TEXT COLLATE NOCASE,

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

    -- DOI of journal article
    "articleDOI" TEXT COLLATE NOCASE,

    -- The publication date of the treatment
    "publicationDate" TEXT,

    -- The publication date of the treatment in ms since unixepoch
    "publicationDateMs" INTEGER AS ((julianday(Cast(publicationDate AS INTEGER)) - 2440587.5) * 86400 * 1000) STORED,

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
    "updated" INTEGER
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
CREATE TABLE unzip (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- FK to archives(id)
    "archives_id" INTEGER NOT NULL REFERENCES archives(id),

    -- start of process in ms
    "started" INTEGER,

    -- end of process in ms
    "ended" INTEGER,

    -- number of files in the zip archive
    "numOfFiles" INTEGER
);