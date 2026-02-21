CREATE TABLE biomes (
            id INTEGER PRIMARY KEY,
            biome_num INTEGER,
            biome_name TEXT,
            UNIQUE(biome_num, biome_name)
        );
CREATE TABLE biome_synonyms (
            id INTEGER PRIMARY KEY,
            biome_synonym TEXT,
            biomes_id INTEGER
        );