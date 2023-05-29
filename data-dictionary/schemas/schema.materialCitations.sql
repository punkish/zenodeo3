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
    "isOnLand" INTEGER DEFAULT NULL
);
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
CREATE INDEX ix_collectionCodes_country ON collectionCodes ("country");
CREATE INDEX ix_collectionCodes_name ON collectionCodes ("name");
CREATE INDEX ix_collectionCodes_httpUri ON collectionCodes ("httpUri");
CREATE INDEX ix_collectionCodes_lsid ON collectionCodes ("lsid");
CREATE INDEX ix_collectionCodes_type ON collectionCodes ("type");