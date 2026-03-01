CREATE TABLE IF NOT EXISTS ecoregions (
    id INTEGER PRIMARY KEY,
    objectid INTEGER,
    eco_name TEXT,
    biome_num INTEGER,
    biome_name TEXT,
    realm TEXT,
    eco_biome_ TEXT,
    nnh INTEGER,
    eco_id INTEGER,
    shape_leng REAL,
    shape_area REAL,
    nnh_name TEXT,
    color TEXT,
    color_bio TEXT,
    color_nnh TEXT,
    license TEXT,

    -- original feature type
    featureType TEXT,

    -- original JSON in geometry.coordinates
    coordinates TEXT,

    -- FK to biomes(id)
    biomes_id INTEGER,

    -- FK to realms(id)
    realms_id INTEGER
);

CREATE TABLE IF NOT EXISTS biomes (
    id INTEGER PRIMARY KEY,
    biome_num INTEGER,
    biome_name TEXT,
    UNIQUE(biome_num, biome_name)
);

CREATE TABLE IF NOT EXISTS biome_synonyms (
    id INTEGER PRIMARY KEY,
    biome_synonym TEXT,
    biomes_id INTEGER
);

CREATE TABLE IF NOT EXISTS realms (
    id INTEGER PRIMARY KEY,
    realm TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS ecoregionsPolygons (
    id INTEGER PRIMARY KEY,

    -- single, simple polygon expected by SQLite [[x,y],[x,y]…]
    polygon TEXT,

    -- FK to ecoregions(id)
    ecoregions_id INTEGER
);

CREATE VIRTUAL TABLE IF NOT EXISTS ecoregionsGeopoly USING geopoly (

    -- FK to ecoregions(id)
    ecoregions_id,

    -- FK to ecoregions(biomes_id)
    biomes_id,

    -- FK to ecoregions(realms_id)
    realms_id
);
