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

CREATE TRIGGER IF NOT EXISTS materialCitations_loc_ai AFTER INSERT ON materialCitations 
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

CREATE TRIGGER IF NOT EXISTS materialCitations_ai AFTER INSERT ON materialCitations 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('materialCitations', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'materialCitations'; 
    END;
CREATE TRIGGER IF NOT EXISTS materialCitations_ad AFTER DELETE ON materialCitations 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'materialCitations'; 
    END;