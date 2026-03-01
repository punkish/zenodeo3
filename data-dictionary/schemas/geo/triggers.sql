CREATE TRIGGER IF NOT EXISTS ecoregions_afterInsert1 
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
                SELECT id 
                FROM biomes 
                WHERE biome_name = new.biome_name 
            ),
            realms_id = ( SELECT id FROM realms WHERE realm = new.realm )
        WHERE id = new.id;
    END;

CREATE TRIGGER IF NOT EXISTS ecoregionsPolygons_afterInsert 
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
            ( SELECT biomes_id FROM ecoregions WHERE id = new.ecoregions_id ),
            ( SELECT realms_id FROM ecoregions WHERE id = new.ecoregions_id )
        );
    END;