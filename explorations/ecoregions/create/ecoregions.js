import { db } from '../dbconn.js';

function er() {
    console.log('creating table ecoregions');

    const sql = `CREATE TABLE IF NOT EXISTS ecoregions (
        id INTEGER PRIMARY KEY,
        eco_name TEXT,
        biome_name TEXT,
        geometry TEXT
     )`;

    db.prepare(sql).run();
}

function er_geopoly() {
    console.log('creating virtual table ecoregionsGeopoly');

    const sql = `CREATE VIRTUAL TABLE ecoregionsGeopoly USING geopoly(
        ecoregions_id
    )`;

    db.prepare(sql).run();
}

function er_trigg() {
    console.log('creating trigger er_geom_afterInsert');

    const sql = `CREATE TRIGGER IF NOT EXISTS er_geom_afterInsert 
    AFTER INSERT ON ecoregions 
    BEGIN
    
        -- insert new entry in geopoly table
        INSERT INTO ecoregionsGeopoly (
            _shape,
            ecoregions_id
        ) 
        VALUES (
    
            -- shape
            new.geometry,
            new.id
        );
    END;`;

    db.prepare(sql).run();
}

export { er, er_geopoly, er_trigg }