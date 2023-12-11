CREATE TABLE archives (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- One of yearly, monthly, weekly or daily
    "typeOfArchive" TEXT NOT NULL CHECK (typeOfArchive IN ('yearly', 'monthly', 'weekly', 'daily')),

    -- Date when the archive was created
    "timeOfArchive" TEXT NOT NULL,

    -- Size of the archive in kilobytes
    "sizeOfArchive" INTEGER NOT NULL
);
CREATE TABLE bibRefCitations (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The unique ID of the bibRefCitation
    "bibRefCitationId" TEXT UNIQUE NOT NULL CHECK(Length(bibRefCitationId) = 32),

    -- The DOI of the citation
    "DOI" TEXT COLLATE NOCASE,

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
    "year" INTEGER,

    -- The innertext text of the bibRefCitation
    "innertext" TEXT COLLATE NOCASE,

    -- The ID of the parent treatment (FK)
    "treatments_id" INTEGER NOT NULL REFERENCES treatments(id)
);
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

    -- The URI of the collection
    "httpUri" TEXT COLLATE NOCASE,

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

    -- serial number of figure for a figureCitationId and treatmentId
    -- combination
    "figureNum" INTEGER DEFAULT 0,

    -- The ID of the parent treatment (FK)
    "treatments_id" INTEGER NOT NULL REFERENCES treatments("id"),

    -- unique declaration
    UNIQUE ("figureCitationId", "figureNum")
);
CREATE TABLE genera (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The higher category of the taxonomicName
    "genus" TEXT UNIQUE NOT NULL COLLATE NOCASE
);
CREATE TABLE images (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The URI of the image. 
    "httpUri" TEXT NOT NULL UNIQUE,

    -- The DOI of the image as extracted
    "figureDoiOriginal" TEXT,

    -- The DOI of the image cleaned up
    "figureDoi" TEXT GENERATED ALWAYS AS (
                Iif(
                    Instr(figureDoiOriginal, '/10.'), 
                    Substr(
                        figureDoiOriginal, 
                        Instr(figureDoiOriginal, '/10.') + 1
                    ), 
                    figureDoiOriginal
                ) 
            ) STORED,

    -- The full text of the figure cited by this treatment
    "captionText" TEXT COLLATE NOCASE,

    -- The FK of the parent treatment
    "treatments_id" INTEGER NOT NULL REFERENCES treatments(id)
);
CREATE TABLE IF NOT EXISTS 'imagesFts_data'(id INTEGER PRIMARY KEY, block BLOB);
CREATE TABLE IF NOT EXISTS 'imagesFts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS 'imagesFts_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
CREATE TABLE IF NOT EXISTS 'imagesFts_config'(k PRIMARY KEY, v) WITHOUT ROWID;
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
) WITHOUT rowid;
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
    "treatments_id" INTEGER NOT NULL REFERENCES treatments(id),

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
    "validGeo" BOOLEAN GENERATED ALWAYS AS (
                typeof(latitude) = 'real' AND 
                abs(latitude) < 90 AND 
                typeof(longitude) = 'real' AND 
                abs(longitude) <= 180
            ) STORED,

    -- 1 (true) if treatment is on land
    "isOnLand" INTEGER DEFAULT NULL, 
    ecoregions_id INTEGER, 
    biomes_id INTEGER
);
CREATE TABLE materialCitations_collectionCodes (

    -- The ID of the related materialCitation (FK)
    "materialCitations_id" INTEGER NOT NULL REFERENCES materialCitations(id),

    -- The ID of the related collectionCode (FK)
    "collectionCodes_id" INTEGER NOT NULL REFERENCES collectionCodes(id),

    -- primary key declaration
    PRIMARY KEY ("materialCitations_id", "collectionCodes_id")
) WITHOUT rowid;
CREATE TABLE IF NOT EXISTS 'materialCitationsFts_data'(id INTEGER PRIMARY KEY, block BLOB);
CREATE TABLE IF NOT EXISTS 'materialCitationsFts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS 'materialCitationsFts_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
CREATE TABLE IF NOT EXISTS 'materialCitationsFts_config'(k PRIMARY KEY, v) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS "materialCitationsGeopoly_rowid"(rowid INTEGER PRIMARY KEY,nodeno,a0,a1,a2);
CREATE TABLE IF NOT EXISTS "materialCitationsGeopoly_node"(nodeno INTEGER PRIMARY KEY,data);
CREATE TABLE IF NOT EXISTS "materialCitationsGeopoly_parent"(nodeno INTEGER PRIMARY KEY,parentnode);
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
    "treatmentAuthorId" TEXT NOT NULL PRIMARY KEY Check(Length(treatmentAuthorId) = 32),

    -- The author of this treatment (author of the article is used if
    -- no treatment authority is found)
    "treatmentAuthor" TEXT COLLATE NOCASE,

    -- The email of the author
    "email" TEXT COLLATE NOCASE,

    -- The ID of the parent treatment (FK)
    "treatments_id" INTEGER NOT NULL REFERENCES treatments(id)
) WITHOUT rowid;
CREATE TABLE treatmentCitations (

    -- The unique resourceId of the treatmentCitation
    "treatmentCitationId" TEXT UNIQUE NOT NULL PRIMARY KEY CHECK(Length(treatmentCitationId) = 32),

    -- The ID of the parent treatment (FK)
    "treatments_id" INTEGER NOT NULL REFERENCES treatments(id),

    -- The ID of the related bibRefCitation (FK)
    "bibRefCitations_id" INTEGER REFERENCES bibRefCitations(id),

    -- The taxonomic name and the author of the species, plus the author
    -- of the treatment being cited
    "treatmentCitation" TEXT COLLATE NOCASE,

    -- The bibliographic reference string of the treatments cited by
    -- this treatment
    "refString" TEXT COLLATE NOCASE
) WITHOUT rowid;
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
CREATE TABLE sqlite_stat1(tbl,idx,stat);
CREATE TABLE sqlite_stat4(tbl,idx,neq,nlt,ndlt,sample);
CREATE INDEX ix_archives_typeOfArchive ON archives ("typeOfArchive");
CREATE INDEX ix_archives_timeOfArchive ON archives ("timeOfArchive");
CREATE INDEX ix_archives_sizeOfArchive ON archives ("sizeOfArchive");
CREATE INDEX ix_bibRefCitations_DOI ON bibRefCitations ("DOI");
CREATE INDEX ix_bibRefCitations_author ON bibRefCitations ("author");
CREATE INDEX ix_bibRefCitations_journalOrPublisher ON bibRefCitations ("journalOrPublisher");
CREATE INDEX ix_bibRefCitations_title ON bibRefCitations ("title");
CREATE INDEX ix_bibRefCitations_year ON bibRefCitations ("year");
CREATE INDEX ix_collectionCodes_country ON collectionCodes ("country");
CREATE INDEX ix_collectionCodes_name ON collectionCodes ("name");
CREATE INDEX ix_collectionCodes_httpUri ON collectionCodes ("httpUri");
CREATE INDEX ix_collectionCodes_lsid ON collectionCodes ("lsid");
CREATE INDEX ix_collectionCodes_type ON collectionCodes ("type");
CREATE INDEX ix_downloads_archives_id ON downloads ("archives_id");
CREATE INDEX ix_downloads_started ON downloads ("started");
CREATE INDEX ix_downloads_ended ON downloads ("ended");
CREATE INDEX ix_etl_archives_id ON etl ("archives_id");
CREATE INDEX ix_etl_started ON etl ("started");
CREATE INDEX ix_etl_ended ON etl ("ended");
CREATE INDEX ix_figureCitations_figureCitationId ON figureCitations ("figureCitationId");
CREATE INDEX ix_figureCitations_treatments_id ON figureCitations ("treatments_id");
CREATE INDEX ix_images_figureDoiOriginal ON images ("figureDoiOriginal");
CREATE INDEX ix_images_figureDoi ON images ("figureDoi");
CREATE INDEX ix_images_captionText ON images ("captionText");
CREATE INDEX ix_images_treatments_id ON images ("treatments_id");
CREATE INDEX ix_journalsByYears_journals_id ON journalsByYears ("journals_id");
CREATE INDEX ix_journalsByYears_journalYear ON journalsByYears ("journalYear");
CREATE INDEX ix_materialCitations_treatments_id ON materialCitations ("treatments_id");
CREATE INDEX ix_materialCitations_collectingDate ON materialCitations ("collectingDate");
CREATE INDEX ix_materialCitations_collectorName ON materialCitations ("collectorName");
CREATE INDEX ix_materialCitations_country ON materialCitations ("country");
CREATE INDEX ix_materialCitations_collectingRegion ON materialCitations ("collectingRegion");
CREATE INDEX ix_materialCitations_municipality ON materialCitations ("municipality");
CREATE INDEX ix_materialCitations_county ON materialCitations ("county");
CREATE INDEX ix_materialCitations_stateProvince ON materialCitations ("stateProvince");
CREATE INDEX ix_materialCitations_location ON materialCitations ("location");
CREATE INDEX ix_materialCitations_locationDeviation ON materialCitations ("locationDeviation");
CREATE INDEX ix_materialCitations_specimenCode ON materialCitations ("specimenCode");
CREATE INDEX ix_materialCitations_determinerName ON materialCitations ("determinerName");
CREATE INDEX ix_materialCitations_collectedFrom ON materialCitations ("collectedFrom");
CREATE INDEX ix_materialCitations_collectingMethod ON materialCitations ("collectingMethod");
CREATE INDEX ix_materialCitations_latitude ON materialCitations ("latitude");
CREATE INDEX ix_materialCitations_longitude ON materialCitations ("longitude");
CREATE INDEX ix_materialCitations_elevation ON materialCitations ("elevation");
CREATE INDEX ix_materialCitations_httpUri ON materialCitations ("httpUri");
CREATE INDEX ix_materialCitations_deleted ON materialCitations ("deleted");
CREATE INDEX ix_materialCitations_validGeo ON materialCitations ("validGeo");
CREATE INDEX ix_materialCitations_isOnLand ON materialCitations ("isOnLand");
CREATE INDEX ix_materialCitations_collectionCodes_materialCitations_id ON materialCitations_collectionCodes ("materialCitations_id");
CREATE INDEX ix_materialCitations_collectionCodes_collectionCodes_id ON materialCitations_collectionCodes ("collectionCodes_id");
CREATE INDEX ix_treatmentAuthors_treatmentAuthor ON treatmentAuthors ("treatmentAuthor");
CREATE INDEX ix_treatmentAuthors_email ON treatmentAuthors ("email");
CREATE INDEX ix_treatmentAuthors_treatments_id ON treatmentAuthors ("treatments_id");
CREATE INDEX ix_treatmentCitations_treatments_id ON treatmentCitations ("treatments_id");
CREATE INDEX ix_treatmentCitations_bibRefCitations_id ON treatmentCitations ("bibRefCitations_id");
CREATE INDEX ix_treatmentCitations_treatmentCitation ON treatmentCitations ("treatmentCitation");
CREATE INDEX ix_treatmentCitations_refString ON treatmentCitations ("refString");
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
CREATE INDEX ix_unzip_archives_id ON unzip ("archives_id");
CREATE INDEX ix_unzip_started ON unzip ("started");
CREATE INDEX ix_unzip_ended ON unzip ("ended");
CREATE INDEX ix_unzip_numOfFiles ON unzip ("numOfFiles");
CREATE TRIGGER bc_afterInsert 
AFTER INSERT ON bibRefCitations 
BEGIN

    --insert new entry in fulltext index
    INSERT INTO bibRefCitationsFts( refString ) 
    VALUES ( new.refString );
END;
CREATE TRIGGER bc_afterUpdate
AFTER UPDATE ON bibRefCitations 
BEGIN

    -- "delete" the old index from the fts table
    INSERT INTO bibRefCitationsFts( bibRefCitationsFts, rowid, refString ) 
    VALUES( 'delete', old.id, old.refString );

    -- add the new index to the fts table
    INSERT INTO bibRefCitationsFts( rowid, refString ) 
    VALUES ( new.id, new.refString );
END;
CREATE TRIGGER bc_afterDelete 
AFTER DELETE ON bibRefCitations 
BEGIN

    -- "delete" the old index from the fts table
    INSERT INTO bibRefCitationsFts( bibRefCitationsFts, rowid, refString ) 
    VALUES( 'delete', old.id, old.refString );
END;
CREATE VIRTUAL TABLE bibRefCitationsFts USING fts5 (
    refString,
    content='bibRefCitations',
    content_rowid='id'
)
/* bibRefCitationsFts(refString) */;
CREATE TRIGGER im_afterInsert 
AFTER INSERT ON images 
BEGIN

    --insert new entry in fulltext index
    INSERT INTO imagesFts( captionText ) 
    VALUES ( new.captionText );
END;
CREATE TRIGGER im_afterUpdate
AFTER UPDATE ON images 
BEGIN

    -- "delete" the old index from the fts table
    INSERT INTO imagesFts( imagesFts, rowid, captionText ) 
    VALUES( 'delete', old.id, old.captionText );

    -- add the new index to the fts table
    INSERT INTO imagesFts( rowid, captionText ) 
    VALUES ( new.id, new.captionText );
END;
CREATE TRIGGER im_afterDelete 
AFTER DELETE ON images 
BEGIN

    -- "delete" the old index from the fts table
    INSERT INTO imagesFts( imagesFts, rowid, captionText ) 
    VALUES( 'delete', old.id, old.captionText );
END;
CREATE VIRTUAL TABLE imagesFts USING fts5 (
    captionText,
    content='images',
    content_rowid='id'
)
/* imagesFts(captionText) */;
CREATE TRIGGER mc_afterInsert 
AFTER INSERT ON materialCitations 
BEGIN

    --insert new entry in fulltext index
    INSERT INTO materialCitationsFts( fulltext ) 
    VALUES ( new.fulltext );

    -- update validGeo in treatments
    UPDATE treatments 
    SET validGeo = new.validGeo
    WHERE treatments.id = new.treatments_id;
END;
CREATE TRIGGER mc_afterUpdate
AFTER UPDATE ON materialCitations 
BEGIN

    -- "delete" the old index from the fts table
    INSERT INTO materialCitationsFts( materialCitationsFts, rowid, fulltext ) 
    VALUES( 'delete', old.id, old.fulltext );

    -- add the new index to the fts table
    INSERT INTO materialCitationsFts( rowid, fulltext ) 
    VALUES ( new.id, new.fulltext );
END;
CREATE TRIGGER mc_afterDelete 
AFTER DELETE ON materialCitations 
BEGIN

    -- "delete" the old index from the fts table
    INSERT INTO materialCitationsFts( materialCitationsFts, rowid, fulltext ) 
    VALUES( 'delete', old.id, old.fulltext );

    -- remove entries from the geopoly and rtree tables
    DELETE FROM materialCitationsGeopoly 
    WHERE materialCitations_id = old.id;

    DELETE FROM materialCitationsRtree 
    WHERE materialCitations_id = old.id;
END;
CREATE TRIGGER mc_loc_afterInsert 
AFTER INSERT ON materialCitations 
WHEN new.validGeo = 1
BEGIN

    -- insert new entry in geopoly table
    INSERT INTO materialCitationsGeopoly (
        _shape,
        materialCitations_id,
        treatments_id
    ) 
    VALUES (

        -- shape
        geopoly_bbox(
            geopoly_regular(
                new.longitude, 
                new.latitude, 

                -- 5 meters in degrees at given latitude
                abs(5/(40075017*cos(new.latitude)/360)),

                -- num of sides of poly
                4
            )
        ),
        new.id,
        new.treatments_id
    );

    -- insert new entry in the rtree table
    INSERT INTO materialCitationsRtree (
        minX,
        maxX,
        minY,
        maxY,
        materialCitations_id,
        treatments_id
    )
    SELECT 
        json_extract(g, '$[0][0]') AS minX, 
        json_extract(g, '$[2][0]') AS maxX,
        json_extract(g, '$[0][1]') AS minY,
        json_extract(g, '$[2][1]') AS maxY,
        id,
        treatments_id
    FROM (
        SELECT
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
            new.id,
            new.treatments_id
    );
END;
CREATE VIRTUAL TABLE materialCitationsFts USING fts5 (
    fulltext,
    content='materialCitations',
    content_rowid='id'
)
/* materialCitationsFts(fulltext) */;
CREATE VIRTUAL TABLE materialCitationsGeopoly USING geopoly (
    materialCitations_id,
    treatments_id
)
/* materialCitationsGeopoly(_shape,materialCitations_id,treatments_id) */;
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
CREATE VIRTUAL TABLE treatmentsFts USING fts5 (
    fulltext,
    content='treatments',
    content_rowid='id'
)
/* treatmentsFts(fulltext) */;
CREATE VIRTUAL TABLE treatmentsFtvrow USING fts5vocab('treatmentsFts', 'row')
/* treatmentsFtvrow(term,doc,cnt) */;
CREATE VIRTUAL TABLE treatmentsFtvcol USING fts5vocab('treatmentsFts', 'col')
/* treatmentsFtvcol(term,col,doc,cnt) */;
CREATE VIRTUAL TABLE treatmentsFtvins USING fts5vocab('treatmentsFts', 'instance')
/* treatmentsFtvins(term,doc,col,"offset") */;
CREATE INDEX ix_materialCitations_ecoregions_id ON materialCitations ("ecoregions_id");
CREATE INDEX ix_materialCitations_biomes_id ON materialCitations ("biomes_id");