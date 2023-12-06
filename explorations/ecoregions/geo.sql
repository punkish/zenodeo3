CREATE TABLE IF NOT EXISTS ecoregions (
    id INTEGER PRIMARY KEY,
    eco_name TEXT,
    biome_name TEXT,
    geometry TEXT
);

CREATE TABLE IF NOT EXISTS biomes (
    id INTEGER PRIMARY KEY,
    biome_name TEXT UNIQUE
);

CREATE VIRTUAL TABLE ecoregionsGeopoly USING geopoly(
    ecoregions_id,
    biomes_id
);

CREATE TRIGGER IF NOT EXISTS er_geom_afterInsert 
    AFTER INSERT ON ecoregions 
    BEGIN

        -- insert new entry in biomes table
        -- but only if it doesn't already exist
        INSERT OR IGNORE INTO biomes (biome_name)
        VALUES (new.biome_name);
    
        -- insert new entry in geopoly table
        INSERT INTO ecoregionsGeopoly (
            _shape,
            ecoregions_id,
            biomes_id
        ) 
        VALUES (
    
            -- shape
            new.geometry,
            new.id,
            (SELECT id FROM biomes WHERE biome_name = new.biome_name)
        );
    END;

INSERT INTO ecoregions ( eco_name, biome_name, geometry ) 
VALUES ( 'one eco', 'one biome', '[[-16,12],[10,15],[24,2],[23,-10],[15,-10],[5,-5],[-16,12]]' ),
( 'two eco', 'two biome', '[[15,-10],[10,-15],[-20,-20],[-25,-5],[5,-5],[15,-10]]' ),
( 'three eco', 'two biome', '[[-16,12],[5,-5],[-25,-5],[-16,12]]' );