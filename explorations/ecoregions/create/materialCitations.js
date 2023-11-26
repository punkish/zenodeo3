import { db } from '../dbconn.js';

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
        ecoregions_id INTEGER REFERENCES ecoregions(id)
    )`;

    db.prepare(sql).run();
}

function mc_geopoly() {
    console.log('creating virtual table materialCitationsGeopoly');

    const sql = `CREATE VIRTUAL TABLE materialCitationsGeopoly USING geopoly (
        materialCitations_id,
        treatments_id
    )`;

    db.prepare(sql).run();
}

function mc_trigg() {
    console.log('creating trigger mc_loc_afterInsert');

    const sql = `CREATE TRIGGER IF NOT EXISTS mc_loc_afterInsert 
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

        -- update 'ecoregions_id' column
        UPDATE materialCitations
        SET ecoregions_id = (
            SELECT ecoregions_id 
            FROM ecoregionsGeopoly
            WHERE geopoly_contains_point(_shape, new.longitude, new.latitude)
        )
        WHERE id = new.id;
    END;`;

    db.prepare(sql).run();
}

export { mc, mc_geopoly, mc_trigg }