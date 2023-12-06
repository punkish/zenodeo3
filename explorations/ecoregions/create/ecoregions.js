import { dbgeo } from '../dbconn.js';

function er() {
    console.log('creating table ecoregions');

    const sql = `CREATE TABLE IF NOT EXISTS ecoregions (
        id INTEGER PRIMARY KEY,
        eco_name TEXT,
        biome_name TEXT,
        geometry TEXT
     )`;

    dbgeo.prepare(sql).run();
}

function bm() {
    console.log('creating table biomes');

    const sql = `CREATE TABLE IF NOT EXISTS biomes (
        id INTEGER PRIMARY KEY,
        biome_name TEXT UNIQUE
     )`;

    dbgeo.prepare(sql).run();
}

function er_geopoly() {
    console.log('creating virtual table ecoregionsGeopoly');

    const sql = `CREATE VIRTUAL TABLE ecoregionsGeopoly USING geopoly(
        ecoregions_id,
        biomes_id
    )`;

    dbgeo.prepare(sql).run();
}

function er_trigg() {
    console.log('creating trigger er_geom_afterInsert');

    const sql = `CREATE TRIGGER IF NOT EXISTS er_geom_afterInsert 
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
    END;`;

    dbgeo.prepare(sql).run();
}

export { er, bm, er_geopoly, er_trigg }