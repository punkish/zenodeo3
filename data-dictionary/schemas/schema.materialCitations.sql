CREATE TABLE materialCitations (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The unique resourceId of the materialCitation
    "materialCitationId" TEXT NOT NULL UNIQUE,

    -- The ID of the parent treatment (FK)
    "treatmentId" TEXT NOT NULL REFERENCES treatments(treatmentId),

    -- The date when the specimen was collected
    "collectingDate" TEXT,

    -- The collection codes as a CSV string as they appear in text
    "collectionCodeCSV" TEXT,

    -- The person who collected the specimen
    "collectorName" TEXT,

    -- The country where the specimen was collected
    "country" TEXT,

    -- The geographic region where the specimen was collected
    "collectingRegion" TEXT,

    -- A lower administrative region
    "municipality" TEXT,

    -- The county where the specimen was collected
    "county" TEXT,

    -- The state or province where the specimen was collected
    "stateProvince" TEXT,

    -- The location where the specimen was collected
    "location" TEXT,

    -- The distance to the nearest location, e.g. 23km NW from…
    "locationDeviation" TEXT,

    -- The number of listed female specimens
    "specimenCountFemale" INTEGER,

    -- The number of listed male specimens
    "specimenCountMale" INTEGER,

    -- The number of listed specimens
    "specimenCount" INTEGER,

    -- The code of the specimen
    "specimenCode" TEXT,

    -- The type status
    "typeStatus" TEXT,

    -- The person or agent who identified the specimen
    "determinerName" TEXT,

    -- The substrate where the specimen has been collected, e.g. leaf,
    -- flower
    "collectedFrom" TEXT,

    -- The method used for collecting the specimen
    "collectingMethod" TEXT,

    -- The geolocation of the treatment
    "latitude" REAL,

    -- The geolocation of the treatment
    "longitude" REAL,

    -- Elevation of the location where the specimen was collected
    "elevation" REAL,

    -- The persistent identifier of the specimen
    "httpUri" TEXT,

    -- A boolean that tracks whether or not this resource is considered
    -- deleted/revoked, 1 if yes, 0 if no
    "deleted" INTEGER DEFAULT 0,

    -- The full text of the material citation
    "fulltext" TEXT,

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
    "isOnLand" INTEGER DEFAULT NULL,

    -- FK to materialCitationsGeopoly(rowid)
    "shapeId" INTEGER,

    -- FK to materialCitationsRtree(rowid)
    "rtreeId" INTEGER
);
CREATE TABLE materialCitations_x_collectionCodes (

    -- The ID of the related materialCitation (FK)
    "materialCitationId" TEXT NOT NULL REFERENCES materialCitations(materialCitationId),

    -- The ID of the related collectionCode (FK)
    "collectionCode" TEXT NOT NULL REFERENCES collectionCodes(collectionCode),

    -- primary key declaration
    PRIMARY KEY ("materialCitationId", "collectionCode")
) WITHOUT rowid;
CREATE TABLE collectionCodes (

    -- The collection code for a natural history collection
    "collectionCode" TEXT UNIQUE NOT NULL PRIMARY KEY,

    -- The country of the collection
    "country" TEXT,

    -- The name of the collection
    "name" TEXT,

    -- The LSID of the collection
    "lsid" TEXT,

    -- The type of the collection
    "type" TEXT
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
CREATE TRIGGER mc_afterInsert
            AFTER INSERT ON materialCitations
            BEGIN

                -- insert new entry in fulltext index
                INSERT INTO materialCitationsFts(
                    rowid,
                    fulltext
                )
                VALUES (
                    new.id,
                    new.fulltext
                );
            END;
CREATE TRIGGER mc_afterUpdate
            AFTER UPDATE ON materialCitations
            BEGIN

                -- "delete" the old index from the fts table
                INSERT INTO materialCitationsFts(
                    materialCitationsFts,
                    rowid,
                    fulltext
                )
                VALUES(
                    'delete',
                    old.id,
                    old.fulltext
                );

                -- add the new index to the fts table
                INSERT INTO materialCitationsFts(
                    rowid,
                    fulltext
                )
                VALUES (
                    new.id,
                    new.fulltext
                );
            END;
CREATE TRIGGER mc_afterDelete
            AFTER DELETE ON materialCitations
            BEGIN

                -- "delete" the old index from the fts table
                INSERT INTO materialCitationsFts(
                    materialCitationsFts,
                    rowid,
                    fulltext
                )
                VALUES(
                    'delete',
                    old.id,
                    old.fulltext
                );

                -- remove entries from the geopoly and rtree tables
                DELETE FROM materialCitationsGeopoly WHERE rowid = old.shapeId;
                DELETE FROM materialCitationsRtree WHERE rowid = old.rtreeId;
            END;
CREATE INDEX ix_materialCitations_materialCitationId ON materialCitations ("materialCitationId");
CREATE INDEX ix_materialCitations_treatmentId ON materialCitations ("treatmentId");
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
CREATE INDEX ix_materialCitations_shapeId ON materialCitations ("shapeId");
CREATE INDEX ix_materialCitations_rtreeId ON materialCitations ("rtreeId");
CREATE INDEX ix_materialCitations_x_collectionCodes_materialCitationId ON materialCitations_x_collectionCodes ("materialCitationId");
CREATE INDEX ix_materialCitations_x_collectionCodes_collectionCode ON materialCitations_x_collectionCodes ("collectionCode");
CREATE INDEX ix_collectionCodes_country ON collectionCodes ("country");
CREATE INDEX ix_collectionCodes_name ON collectionCodes ("name");
CREATE INDEX ix_collectionCodes_lsid ON collectionCodes ("lsid");
CREATE INDEX ix_collectionCodes_type ON collectionCodes ("type");