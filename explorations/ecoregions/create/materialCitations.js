import { dbmat } from '../dbconn.js';

function mc() {
    console.log('creating table materialCitations');

    const sql = `CREATE TABLE IF NOT EXISTS materialCitations (
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
    )`;

    dbmat.prepare(sql).run();
}

function mc_geopoly() {
    console.log('creating virtual table materialCitationsGeopoly');

    const sql = `CREATE VIRTUAL TABLE materialCitationsGeopoly USING geopoly (
        materialCitations_id,
        treatments_id
    )`;

    dbmat.prepare(sql).run();
}

function mc_trigg() {
    console.log('creating trigger mc_loc_afterInsert1');

    const sql1 = `CREATE TRIGGER IF NOT EXISTS mc_loc_afterInsert1 
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
    END;`;

    dbmat.prepare(sql1).run();

    const res = dbmat.prepare('SELECT * FROM geo.ecoregions').all();
    console.log(res);

    console.log('creating trigger mc_loc_afterInsert2');

    const sql2 = `CREATE TEMPORARY TRIGGER IF NOT EXISTS mc_loc_afterInsert2 
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
    END;`;

    dbmat.prepare(sql2).run();
}

export { mc, mc_geopoly, mc_trigg }