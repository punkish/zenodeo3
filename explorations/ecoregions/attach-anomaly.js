// see line 160 below for notes on this bug

import Database from 'better-sqlite3';
const dbgeo = new Database('./geo.sqlite');
const dbmat = new Database('./mat.sqlite');
dbgeo.pragma('foreign_keys = ON');
dbmat.pragma('foreign_keys = ON');
dbmat.prepare(`ATTACH DATABASE './geo.sqlite' AS geo`).run();

/******** ecoregions ***********/

function create_er() {
    console.log('creating table ecoregions');

    const sql = `CREATE TABLE IF NOT EXISTS ecoregions (
        id INTEGER PRIMARY KEY,
        eco_name TEXT,
        biome_name TEXT,
        geometry TEXT
     )`;

    dbgeo.prepare(sql).run();
}

function create_bm() {
    console.log('creating table biomes');

    const sql = `CREATE TABLE IF NOT EXISTS biomes (
        id INTEGER PRIMARY KEY,
        biome_name TEXT UNIQUE
     )`;

    dbgeo.prepare(sql).run();
}

function create_er_geopoly() {
    console.log('creating virtual table ecoregionsGeopoly');

    const sql = `CREATE VIRTUAL TABLE ecoregionsGeopoly USING geopoly(
        ecoregions_id,
        biomes_id
    )`;

    dbgeo.prepare(sql).run();
}

function create_er_trigg() {
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

/************* treatments ***************/
function create_tr() {
    console.log('creating table treatments');

    const sql = `CREATE TABLE IF NOT EXISTS treatments (
        id INTEGER PRIMARY KEY,
        treatment TEXT
    )`;

    dbmat.prepare(sql).run();
}

/************** materialCitations ***********/

function create_mc() {
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

function create_mc_geopoly() {
    console.log('creating virtual table materialCitationsGeopoly');

    const sql = `CREATE VIRTUAL TABLE materialCitationsGeopoly USING geopoly (
        materialCitations_id,
        treatments_id
    )`;

    dbmat.prepare(sql).run();
}

function create_mc_trigg() {
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

    /********************************************************************/
    /* uncomment the following two lines and the script will succeed    */
    /* when these lines are commented, the script fails with the error  */
    /*       SqliteError: no such table: geo.ecoregionsGeopoly          */
    /********************************************************************/
    // const res = dbmat.prepare('SELECT * FROM geo.ecoregions').all();
    // console.log(res);

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

/*********** insert data in ecoregions ****************/

function insert_er() {
    console.log('insert data in table ecoregions');

    const sql = `INSERT INTO ecoregions ( eco_name, biome_name, geometry ) 
    VALUES ( @eco_name, @biome_name, @geometry )`;

    const insert = dbgeo.prepare(sql);

    const data = [
        {
            eco_name: 'one eco',
            biome_name: 'one biome',
            geometry: '[[-16,12],[10,15],[24,2],[23,-10],[15,-10],[5,-5],[-16,12]]'
        },
        {
            eco_name: 'two eco',
            biome_name: 'two biome',
            geometry: '[[15,-10],[10,-15],[-20,-20],[-25,-5],[5,-5],[15,-10]]'
        },
        {
            eco_name: 'three eco',
            biome_name: 'two biome',
            geometry: '[[-16,12],[5,-5],[-25,-5],[-16,12]]'
        }
    ];


    const insertMany = dbgeo.transaction((data) => {
        for (const row of data) insert.run(row);
    });

    insertMany(data);
}

/******* insert data in treatments ******************/

function insert_tr() {
    console.log('insert data in table treatments');

    const sql = `INSERT INTO treatments ( treatment ) 
    VALUES ( @treatment )`;

    const insert = dbmat.prepare(sql);

    const data = [
        { treatment: 'one treatment' },
        { treatment: 'two treatment' },
        { treatment: 'three treatment' }
    ];


    const insertMany = dbmat.transaction((data) => {
        for (const row of data) insert.run(row);
    });

    insertMany(data);
}

/********* insert data in materialCitations ***************/

function insert_mc() {
    console.log('insert data in table materialCitations');

    const sql = `INSERT INTO materialCitations ( 
        materialCitation,
        treatments_id,
        longitude,
        latitude
    ) 
    VALUES ( 
        @materialCitation,
        @treatments_id,
        @longitude,
        @latitude
    )`;

    const insert = dbmat.prepare(sql);

    const data = [
        { 
            materialCitation: 'one materialCitation',
            treatments_id: '1',
            longitude: -5,
            latitude: 10
        },
        { 
            materialCitation: 'two materialCitation',
            treatments_id: '1',
            longitude: 14,
            latitude: 5
        },
        { 
            materialCitation: 'three materialCitation',
            treatments_id: '2',
            longitude: 23,
            latitude: 12
        },
        { 
            materialCitation: 'four materialCitation',
            treatments_id: '3',
            longitude: -5,
            latitude: -10
        },
        { 
            materialCitation: 'five materialCitation',
            treatments_id: '2',
            longitude: -15,
            latitude: -25
        },

        // bad lat long
        { 
            materialCitation: 'six materialCitation',
            treatments_id: '2',
            longitude: -160,
            latitude: '10a.3f'
        },
        { 
            materialCitation: 'seven materialCitation',
            treatments_id: '3',
            longitude: -15,
            latitude: 5
        },
    ];


    const insertMany = dbmat.transaction((data) => {
        for (const row of data) insert.run(row);
    });

    insertMany(data);
}

create_er();
create_bm();
create_er_geopoly();
create_er_trigg();
create_tr();
create_mc();
create_mc_geopoly();
create_mc_trigg();

insert_er();
insert_tr();
insert_mc();