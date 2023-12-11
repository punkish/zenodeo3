CREATE TABLE biomes (
   id INTEGER PRIMARY KEY,
   biome_name TEXT UNIQUE
);
CREATE TABLE IF NOT EXISTS "ecoregions" (
   id INTEGER PRIMARY KEY,
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
   geometry TEXT, 
   biomes_id INTEGER
);
CREATE VIRTUAL TABLE ecoregionsGeopoly USING geopoly(
        ecoregions_id,
        biomes_id
    )
/* ecoregionsGeopoly(_shape,ecoregions_id,biomes_id) */;
CREATE TABLE IF NOT EXISTS "ecoregionsGeopoly_rowid"(rowid INTEGER PRIMARY KEY,nodeno,a0,a1,a2);
CREATE TABLE IF NOT EXISTS "ecoregionsGeopoly_node"(nodeno INTEGER PRIMARY KEY,data);
CREATE TABLE IF NOT EXISTS "ecoregionsGeopoly_parent"(nodeno INTEGER PRIMARY KEY,parentnode);
CREATE INDEX ix_eco_name_ecoregions ON ecoregions(eco_name);
CREATE INDEX ix_biome_name_ecoregions ON ecoregions(biome_name);
CREATE TABLE biome_synonyms (
    id INTEGER PRIMARY KEY,
    synonym TEXT UNIQUE,
    biomes_id INTEGER REFERENCES biomes(id)
);
CREATE INDEX ix_synonym_biome_synonyms ON biome_synonyms(synonym);