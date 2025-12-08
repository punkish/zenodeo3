CREATE TABLE ecoregions (
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
CREATE TABLE realms (
            id INTEGER PRIMARY KEY,
            realm TEXT UNIQUE
        );
CREATE TRIGGER ecoregions_afterInsert1
        AFTER INSERT ON ecoregions
        BEGIN

            --insert entry in biomes
            INSERT OR IGNORE INTO biomes(biome_num, biome_name)
            VALUES (new.biome_num, new.biome_name);

            --insert entry in realms
            INSERT OR IGNORE INTO realms(realm)
            VALUES (new.realm);

            -- update ecoregions table
            UPDATE ecoregions
            SET
                biomes_id = (
                    SELECT id FROM biomes WHERE biome_name = new.biome_name
                ),
                realms_id = (
                    SELECT id FROM realms WHERE realm = new.realm
                )
            WHERE id = new.id;
        END;
CREATE TABLE ecoregionsPolygons (
            id INTEGER PRIMARY KEY,

            -- single, simple polygon expected by SQLite [[x,y],[x,y]…]
            polygon TEXT,

            -- FK to ecoregions(id)
            ecoregions_id INTEGER
        );
CREATE TRIGGER ecoregionsPolygons_afterInsert
        AFTER INSERT ON ecoregionsPolygons
        BEGIN

            --insert in ecoregionsGeopoly
            INSERT INTO ecoregionsGeopoly (
                rowid,
                _shape,
                ecoregions_id,
                biomes_id,
                realms_id
            )
            VALUES (
                new.id,
                new.polygon,
                new.ecoregions_id,
                (SELECT biomes_id FROM ecoregions WHERE id = new.ecoregions_id),(SELECT realms_id FROM ecoregions WHERE id = new.ecoregions_id)
            );
        END;
CREATE VIRTUAL TABLE ecoregionsGeopoly USING geopoly (

    -- FK to ecoregions(id)
    ecoregions_id,

    -- FK to ecoregions(biomes_id)
    biomes_id,

    -- FK to ecoregions(realms_id)
    realms_id
);
CREATE INDEX ix_ecoregions_biomes_id ON ecoregions(biomes_id);
CREATE INDEX ix_ecoregions_realms_id ON ecoregions(realms_id);
CREATE INDEX ix_biome_synonym_biome_synonyms ON biome_synonyms(biome_synonym);
CREATE INDEX ix_ecoregions_id_ecoregionsPolygons ON ecoregionsPolygons(
    ecoregions_id
);