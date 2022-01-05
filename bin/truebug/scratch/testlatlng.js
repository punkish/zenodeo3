'use strict';

const config = require('config');
const Database = require('better-sqlite3');
const db = {
    treatments: new Database(config.get('db.treatments')),
    stats: new Database(config.get('db.stats'))
}


const dbfoo = new Database('foo.sqlite');

const isLat = val => Number.isFinite(val) && Math.abs(val) <= 90;
const isLng = val => Number.isFinite(val) && Math.abs(val) <= 180;

const createFoo = () => {
    console.log('creating table t');
    let s = 'CREATE TABLE t (lat REAL, lng REAL)';
    dbfoo.prepare(s).run();
    console.log('inserting data in table t');
    s = "INSERT INTO t VALUES (-3, 45.04), (-95, -22), ('6°', '52.35°'), ('-34.5-6.23', 47.223), (6, 182), (-34.53, 22.45)";
    dbfoo.prepare(s).run();
}

const createDupFoo = () => {
    console.log('creating table t_tmp');
    let s = `CREATE TABLE t_tmp (
        lat REAL, 
        lng REAL, 
        valid INT AS (
            CASE 
                WHEN typeof(lat) = 'real' AND typeof(lng) = 'real' AND abs(lat) <= 90 AND abs(lng) <= 180
                THEN 1
                ELSE 0
            END
        ) STORED
    )`;
    dbfoo.prepare(s).run();
    console.log('inserting data in table t_tmp from table t');
    s = 'INSERT INTO t_tmp SELECT lat, lng FROM t';
    dbfoo.prepare(s).run();
    console.log('dropping table t');
    s = 'DROP TABLE t';
    dbfoo.prepare(s).run();
    console.log('renaming table t_tmp to t');
    s = 'ALTER TABLE t_tmp RENAME to t';
    dbfoo.prepare(s).run();
    console.log('inserting new data in table t');
    s = "INSERT INTO t VALUES (-7.5, 42), (-89, -220), ('7.56°', '52.35°'), ('-34.5-6.23', '47.223+87'), (63, 187), (43.5, 44.56)";
    dbfoo.prepare(s).run();
    console.log('selecting data from new t');
    s = 'SELECT lat, lng FROM t WHERE valid = 1';
    const rows = dbfoo.prepare(s).all();
    console.log(rows);
}

// const alterFoo = () => {
//     console.log('altering table t');
//     let s = `ALTER TABLE t 
//     ADD COLUMN valid INTEGER`;
//     dbfoo.prepare(s).run();
//     console.log('updating valid')
//     s = `UPDATE t SET valid = CASE 
//         WHEN typeof(lat) = 'real' AND typeof(lng) = 'real' AND abs(lat) <= 90 AND abs(lng) <= 180
//         THEN 1
//         ELSE 0
//         END`;
//     dbfoo.prepare(s).run();
// }

// const getValidLatLngFromFoo = () => {
//     console.log('selecting lat/lng from t (complicated)');
//     const sel = "SELECT lat, lng FROM t WHERE typeof(lat) = 'real' AND typeof(lng) = 'real' AND abs(lat) <= 90 AND abs(lng) <= 180";
//     const rows = dbfoo.prepare(sel).all();
//     console.log(rows);
// }

const getNewValidFromFoo = () => {
    console.log('selecting data from table t (easy)');
    const sel = "SELECT lat, lng FROM t WHERE valid = 1";
    const rows = dbfoo.prepare(sel).all();
    console.log(rows);
}

const getValidLatLng_old = () => {
    const sel = `SELECT treatmentId, materialsCitationId, latitude, longitude
    FROM materialsCitations
    WHERE 
            materialsCitationId != '3B1B3CEA1D309D67D1A07AD2FB96CCFF'
            AND latitude != '' 
            AND longitude != ''`;

    const rows = db.treatments.prepare(sel).all();
    let count = 0;

    console.log(`| treatmentId                      | materialsCitationId              | latitude    | longitude    |`);
    console.log(`|----------------------------------|----------------------------------|-------------|--------------|`);
    rows.forEach((row, i) => {
        const treatmentId = row.treatmentId;
        const materialsCitationId = row.materialsCitationId;
        const latitude = row.latitude;
        const longitude = row.longitude;

        if (!isLat(latitude) || !isLng(longitude)) {
            count++;
            console.log(`| ${treatmentId} | ${materialsCitationId} | ${latitude} | ${longitude} |`);
        }
    })

    console.log('---')
    console.log(`possibly wrong coords: ${count}`);
}

const getValidLatLng = () => {
    const sel = "SELECT latitude, longitude FROM materialsCitations WHERE typeof(latitude) = 'real' AND typeof(longitude) = 'real' AND abs(latitude) <= 90 AND abs(longitude) <= 180 LIMIT 10";
    const rows = db.treatments.prepare(sel).all();
    console.log(rows);
}

//getValidLatLng();


const createDupMatCit = () => {
    console.log('creating table mc_tmp');
    let s = `CREATE TABLE mc_tmp (
            id INTEGER PRIMARY KEY,
            materialsCitationId TEXT NOT NULL,
            treatmentId TEXT NOT NULL,
            collectingDate TEXT,
            -- collection code here is a csv string as in the text
            collectionCode TEXT,
            collectorName TEXT,
            country TEXT,
            collectingRegion TEXT,
            municipality TEXT,
            county TEXT,
            stateProvince TEXT,
            location TEXT,
            locationDeviation TEXT,
            specimenCountFemale TEXT,
            specimenCountMale TEXT,
            specimenCount TEXT,
            specimenCode TEXT,
            typeStatus TEXT,
            determinerName TEXT,
            collectedFrom TEXT,
            collectingMethod TEXT,
            latitude REAL,
            longitude REAL,
            elevation REAL,
            httpUri TEXT,
            deleted INTEGER DEFAULT 0,
            created INTEGER DEFAULT (strftime('%s','now')),
            updated INTEGER,
            validGeo INT AS (
                CASE 
                    WHEN 
                        typeof(latitude) = 'real' AND 
                        abs(latitude) <= 90 AND 
                        typeof(longitude) = 'real' AND 
                        abs(longitude) <= 180
                    THEN 1
                    ELSE 0
                END
            ) STORED,
            UNIQUE (materialsCitationId, treatmentId)
        );`
    db.treatments.prepare(s).run();

    console.log('inserting data in table mc_tmp from table materialsCitations');
    s = 'INSERT INTO mc_tmp SELECT * FROM materialsCitations';
    db.treatments.prepare(s).run();

    console.log('dropping table materialsCitations');
    s = 'DROP TABLE materialsCitations';
    db.treatments.prepare(s).run();

    console.log('renaming table mc_tmp to materialsCitations');
    s = 'ALTER TABLE mc_tmp RENAME to materialsCitations';
    db.treatments.prepare(s).run();

    const indexes = [
        'CREATE INDEX ix_materialsCitations_materialsCitationId ON materialsCitations (deleted, materialsCitationId)',
        'CREATE INDEX ix_materialsCitations_treatmentId         ON materialsCitations (deleted, treatmentId)',
        'CREATE INDEX ix_materialsCitations_collectingDate      ON materialsCitations (deleted, collectingDate COLLATE NOCASE)',
        'CREATE INDEX ix_materialsCitations_collectionCode      ON materialsCitations (deleted, collectionCode COLLATE NOCASE)',
        'CREATE INDEX ix_materialsCitations_collectorName       ON materialsCitations (deleted, collectorName COLLATE NOCASE)',
        'CREATE INDEX ix_materialsCitations_country             ON materialsCitations (deleted, country COLLATE NOCASE)',
        'CREATE INDEX ix_materialsCitations_collectingRegion    ON materialsCitations (deleted, collectingRegion COLLATE NOCASE)',
        'CREATE INDEX ix_materialsCitations_municipality        ON materialsCitations (deleted, municipality COLLATE NOCASE)',
        'CREATE INDEX ix_materialsCitations_county              ON materialsCitations (deleted, county COLLATE NOCASE)',
        'CREATE INDEX ix_materialsCitations_stateProvince       ON materialsCitations (deleted, stateProvince COLLATE NOCASE)',
        'CREATE INDEX ix_materialsCitations_location            ON materialsCitations (deleted, location COLLATE NOCASE)',
        'CREATE INDEX ix_materialsCitations_locationDeviation   ON materialsCitations (deleted, locationDeviation COLLATE NOCASE)',
        'CREATE INDEX ix_materialsCitations_specimenCountFemale ON materialsCitations (deleted, specimenCountFemale COLLATE NOCASE)',
        'CREATE INDEX ix_materialsCitations_specimenCountMale   ON materialsCitations (deleted, specimenCountMale COLLATE NOCASE)',
        'CREATE INDEX ix_materialsCitations_specimenCount       ON materialsCitations (deleted, specimenCount COLLATE NOCASE)',
        'CREATE INDEX ix_materialsCitations_specimenCode        ON materialsCitations (deleted, specimenCode COLLATE NOCASE)',
        'CREATE INDEX ix_materialsCitations_typeStatus          ON materialsCitations (deleted, typeStatus COLLATE NOCASE)',
        'CREATE INDEX ix_materialsCitations_determinerName      ON materialsCitations (deleted, determinerName COLLATE NOCASE)',
        'CREATE INDEX ix_materialsCitations_collectedFrom       ON materialsCitations (deleted, collectedFrom COLLATE NOCASE)',
        'CREATE INDEX ix_materialsCitations_collectingMethod    ON materialsCitations (deleted, collectingMethod COLLATE NOCASE)',
        'CREATE INDEX ix_materialsCitations_latitude            ON materialsCitations (deleted, latitude)',
        'CREATE INDEX ix_materialsCitations_longitude           ON materialsCitations (deleted, longitude)',
        'CREATE INDEX ix_materialsCitations_elevation           ON materialsCitations (deleted, elevation)',
        'CREATE INDEX ix_materialsCitations_deleted             ON materialsCitations (deleted)',
    ];

    console.log('recreating indexes for materialsCitations');
    indexes.forEach(i => {
        db.treatments.prepare(i).run();
    })
}

//createDupMatCit();

const populateGeoPoly = () => {
    console.log('populating geopoly')
    const s = `INSERT INTO vloc_geopoly (treatmentId, materialsCitationId, _shape) 
    WITH points AS (
        SELECT materialsCitationId, treatmentId, '[' || longitude || ',' || latitude || ']' AS p 
        FROM materialsCitations 
        WHERE validGeo = 1
    ) SELECT 
        points.treatmentId,
        points.materialsCitationId,
        '[' || points.p || ',' || points.p || ',' || points.p || ',' || points.p || ']' AS _shape
    FROM points`;
    db.treatments.prepare(s).run();
}

//populateGeoPoly();

const repopulateRtree = () => {
    console.log('dropping vloc_rtree');
    let s = 'DROP TABLE vloc_rtree';
    db.treatments.prepare(s).run();

    console.log('recreating vloc_rtree');
    s = `CREATE VIRTUAL TABLE vloc_rtree USING rtree(
        id,                         -- primary key
        minX, maxX,                 -- X coordinate
        minY, maxY,                 -- Y coordinate
        +materialsCitationId TEXT,
        +treatmentId TEXT
    )`;
    db.treatments.prepare(s).run();

    console.log('loading vloc_rtree');
    s = `INSERT INTO vloc_rtree (
        minX,
        maxX,
        minY,
        maxY,
        materialsCitationId,
        treatmentId
    )
    SELECT
        longitude,
        longitude,
        latitude,
        latitude,
        materialsCitationId,
        treatmentId
    FROM materialsCitations 
    WHERE validGeo = 1`;
    db.treatments.prepare(s).run();
}

repopulateRtree();

// createFoo();
// createDupFoo();
// getValidLatLngFromFoo();
// alterFoo();
// getNewValidFromFoo();

//getValidLatLng();

