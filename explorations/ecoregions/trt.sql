ATTACH DATABASE './geo.sqlite' AS geo;

CREATE TABLE IF NOT EXISTS treatments (
    id INTEGER PRIMARY KEY,
    treatment TEXT
);

CREATE TABLE IF NOT EXISTS materialCitations (
    id INTEGER PRIMARY KEY,
    materialCitation TEXT,
    treatments_id INTEGER NOT NULL REFERENCES treatments(id),
    longitude REAL,
    latitude REAL,
    validGeo BOOLEAN GENERATED ALWAYS AS (
        typeof(latitude) = 'real' AND 
        abs(latitude) < 90 AND 
        typeof(longitude) = 'real' AND 
        abs(longitude) <= 180
    ) STORED,
    ecoregions_id INTEGER,
    biomes_id INTEGER
);

CREATE VIRTUAL TABLE materialCitationsGeopoly USING geopoly (
    materialCitations_id,
    treatments_id
);

CREATE TRIGGER IF NOT EXISTS mc_loc_afterInsert1 
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
    END;

-- SELECT * FROM geo.ecoregions;

CREATE TEMPORARY TRIGGER IF NOT EXISTS mc_loc_afterInsert2 
    AFTER INSERT ON materialCitations 
    WHEN new.validGeo = 1
    BEGIN

        -- update 'ecoregions_id' and 'biomes_id' columns
        UPDATE materialCitations
        SET 
            ecoregions_id = (
                SELECT ecoregions_id 
                FROM geo.ecoregionsGeopoly
                WHERE geopoly_contains_point(
                    _shape, new.longitude, new.latitude
                )
            ),
            biomes_id = (
                SELECT biomes_id 
                FROM geo.ecoregionsGeopoly
                WHERE geopoly_contains_point(
                    _shape, new.longitude, new.latitude
                )
            )
        WHERE id = new.id;
    END;

INSERT INTO treatments ( treatment ) 
VALUES ('one treatment'), ('two treatment'), ('three treatment');

INSERT INTO materialCitations ( 
    materialCitation,
    treatments_id,
    longitude,
    latitude
) 
VALUES ('one materialCitation', 1, -5, 10),
('two materialCitation', 1, 14, 5),
('three materialCitation', 2, 23, 12),
('four materialCitation', 3, -5, 10),
('five materialCitation', 2, -15, 25),
('six materialCitation', 2, -160, '10a.3f'), -- bad values
('seven materialCitation', 3, -15, 5);