'use strict';

import Chance from 'chance';
const chance = Chance();
import { db } from '../../lib/dbconn.js';
import process from 'node:process';

const createTables = (db) => {

    db.conn.prepare(`DROP TABLE rt`).run();
    db.conn.prepare(`DROP TABLE geo`).run();

    let stm1 = `CREATE VIRTUAL TABLE rt USING rtree(
        id,
        minX,         -- lower left longitude
        maxX,         -- upper right longitude
        minY,         -- lower left latitude
        maxY,         -- upper right latitude
        +longitude,
        +latitude
    )`;

    stm1 = `CREATE VIRTUAL TABLE rt USING rtree(
        id,
        minX,         -- lower left longitude
        maxX,         -- upper right longitude
        minY,         -- lower left latitude
        maxY,         -- upper right latitude
        +materialCitationId,
        +treatmentId
    )`;

    // with DISTINCT points and two aux fields to JOIN
    db.conn.prepare(stm1).run();

    let stm2 = `CREATE VIRTUAL TABLE geo USING geopoly(
        longitude,
        latitude
    )`;

    stm2 = `CREATE VIRTUAL TABLE geo USING geopoly(
        materialCitationId,
        treatmentId
    )`;

    // with DISTINCT shapes, so we need DISTINCT aux fields to JOIN
    db.conn.prepare(stm2).run();
}

const geopolyRegular = (longitude, latitude, R, N) => {
    return `geopoly_regular(
        ${longitude}, 
        ${latitude}, 
        abs(${R}/(40075017*cos(${latitude})/360)), 
        ${N} 
    )`
};

const jsonExt = (pos, longitude, latitude, R, N) => {
    return `json_extract(
        geopoly_json(
            geopoly_bbox(
                ${geopolyRegular(longitude, latitude, R, N)}
            )
        ), 
        '${pos}'
    )`
};

const loadGeoTables = (db, nondist = false) => {

    // SQLite's rtree can store "polys" of zero area,
    // but while geopoly can store such "polys", the geopoly_within()
    // function will not find them. So we convert points into tiny polys 
    // of 5m circumradius before inserting them in geopoly

    // 111320 meters is 1° of latitude (almost) all over the earth
    // 1m = (1 / 111320)°
    // 5m in degrees

    // meters of longitude depends on the latitude
    // radius of earth = 40075017 meters
    // abs(40075017 * cos( latitude ) / 360) meters is 1° of longitude 
    // 5m in degrees
    // 5 / (40075017 * Math.cos( 0 ) / 360) in ° longitude

    // DISTINCT
    let stm = `
        CREATE TEMP TABLE coords AS
        SELECT
            longitude, 
            latitude, 
            shape,
            json_extract(geopolyJson, '$[0][0]') AS minX,
            json_extract(geopolyJson, '$[0][1]') AS minY,
            json_extract(geopolyJson, '$[2][0]') AS maxX,
            json_extract(geopolyJson, '$[2][1]') AS maxY
        FROM (
            SELECT 
                longitude, 
                latitude, 
                shape, 
                geopoly_json(shape) AS geopolyJson 
            FROM (
                SELECT 
                    longitude, 
                    latitude, 
                    geopoly_bbox(geopolyRegular) AS shape
                FROM (
                    SELECT 
                        longitude, 
                        latitude, 
                        geopoly_regular(
                            longitude, 
                            latitude, 
                            abs(5/(40075017*cos(latitude)/360)),
                            4
                        ) AS geopolyRegular
                    FROM (
                        SELECT DISTINCT 
                            longitude, 
                            latitude 
                        FROM materialCitations
                        WHERE validGeo = 1
                    )
                )
            )
        )
    `;

    if (nondist) {
        stm = `
            CREATE TEMP TABLE coords AS
            SELECT
                materialCitationId, 
                treatmentId, 
                shape,
                json_extract(geopolyJson, '$[0][0]') AS minX,
                json_extract(geopolyJson, '$[0][1]') AS minY,
                json_extract(geopolyJson, '$[2][0]') AS maxX,
                json_extract(geopolyJson, '$[2][1]') AS maxY
            FROM (
                SELECT 
                    materialCitationId, 
                    treatmentId, 
                    shape, 
                    geopoly_json(shape) AS geopolyJson 
                FROM (
                    SELECT 
                        materialCitationId, 
                        treatmentId, 
                        geopoly_bbox(geopolyRegular) AS shape
                    FROM (
                        SELECT 
                            materialCitationId, 
                            treatmentId,
                            geopoly_regular(
                                longitude, 
                                latitude, 
                                abs(5/(40075017*cos(latitude)/360)),
                                4
                            ) AS geopolyRegular
                        FROM (
                            SELECT 
                                longitude, 
                                latitude, 
                                materialCitationId, 
                                treatmentId
                            FROM materialCitations
                            WHERE validGeo = 1
                        )
                    )
                )
            )
        `;
    }

    db.conn.prepare(stm).run();

    let insGeo = `
        INSERT INTO materialCitationsGeopoly (_shape, longitude, latitude)
        SELECT shape, longitude, latitude 
        FROM coords
    `;

    if (nondist) {
        insGeo = `
            INSERT INTO materialCitationsGeopoly (_shape, materialCitationId, treatmentId)
            SELECT shape, materialCitationId, treatmentId 
            FROM coords
        `;
    }

    try {
        db.conn.prepare(insGeo).run();
    }
    catch (error) {
        console.log(error);
    }

    let insRt = `
        INSERT INTO materialCitationsRtree (minX, maxX, minY, maxY, longitude, latitude)
        SELECT minX, maxX, minY, maxY, longitude, latitude 
        FROM coords
    `;

    if (nondist) {
        insRt = `
            INSERT INTO materialCitationsRtree (minX, maxX, minY, maxY, materialCitationId, treatmentId)
            SELECT minX, maxX, minY, maxY, materialCitationId, treatmentId 
            FROM coords
        `;
    }

    try {
        db.conn.prepare(insRt).run();
    }
    catch (error) {
        console.log(error);
    }
}

const checkGeoTables = (db) => {
    let count = db.conn.prepare(`
        SELECT Count(*) AS count FROM materialCitations WHERE validGeo = 1
    `).get().count;
    console.log(`materialCitations: ${count}`);

    count = db.conn.prepare(`
        SELECT Count(*) AS count FROM materialCitationsGeopoly
    `).get().count;
    console.log(`materialCitationsGeopoly: ${count}`);

    count = db.conn.prepare(`
        SELECT Count(*) AS count FROM materialCitationsRtree
    `).get().count;
    console.log(`materialCitationsRtree: ${count}`);
}

const searchGeoDist = (db, nondist = false) => {
    
    let stm1 = `
        SELECT materialCitationId, treatmentId 
        FROM 
            materialCitationsRtree rt JOIN materialCitations m ON
                rt.longitude = m.longitude AND 
                rt.latitude  = m.latitude 
        WHERE 
            minX BETWEEN 
                ${jsonExt('$[0][0]', '@longitude', '@latitude', '@R', '@N')} AND 
                ${jsonExt('$[2][0]', '@longitude', '@latitude', '@R', '@N')} AND 
            maxX BETWEEN 
                ${jsonExt('$[0][0]', '@longitude', '@latitude', '@R', '@N')} AND 
                ${jsonExt('$[2][0]', '@longitude', '@latitude', '@R', '@N')} AND 
            minY BETWEEN 
                ${jsonExt('$[0][1]', '@longitude', '@latitude', '@R', '@N')} AND 
                ${jsonExt('$[2][1]', '@longitude', '@latitude', '@R', '@N')} AND 
            maxY BETWEEN 
                ${jsonExt('$[0][1]', '@longitude', '@latitude', '@R', '@N')} AND 
                ${jsonExt('$[2][1]', '@longitude', '@latitude', '@R', '@N')}
    `;

    if (nondist) {
        stm1 = `
            SELECT materialCitationId, treatmentId 
            FROM materialCitationsRtree  
            WHERE 
                minX BETWEEN 
                    ${jsonExt('$[0][0]', '@longitude', '@latitude', '@R', '@N')} AND 
                    ${jsonExt('$[2][0]', '@longitude', '@latitude', '@R', '@N')} AND 
                maxX BETWEEN 
                    ${jsonExt('$[0][0]', '@longitude', '@latitude', '@R', '@N')} AND 
                    ${jsonExt('$[2][0]', '@longitude', '@latitude', '@R', '@N')} AND 
                minY BETWEEN 
                    ${jsonExt('$[0][1]', '@longitude', '@latitude', '@R', '@N')} AND 
                    ${jsonExt('$[2][1]', '@longitude', '@latitude', '@R', '@N')} AND 
                maxY BETWEEN 
                    ${jsonExt('$[0][1]', '@longitude', '@latitude', '@R', '@N')} AND 
                    ${jsonExt('$[2][1]', '@longitude', '@latitude', '@R', '@N')}
        `;
    }

    const selRtreeDist = db.conn.prepare(stm1);

    let stm2 = `
        SELECT materialCitationId, treatmentId
        FROM materialCitationsGeopoly geo JOIN materialCitations m ON
            geo.longitude = m.longitude AND 
            geo.latitude  = m.latitude
        WHERE geopoly_within(
            _shape, 
            geopoly_bbox(
                ${geopolyRegular('@longitude', '@latitude', '@R', '@N')}
            )
        )
    `;

    if (nondist) {
        stm2 = `
            SELECT materialCitationId, treatmentId
            FROM materialCitationsGeopoly 
            WHERE geopoly_within(
                _shape, 
                geopoly_bbox(
                    ${geopolyRegular('@longitude', '@latitude', '@R', '@N')}
                )
            )
        `;
    }

    const selGeopolyDist = db.conn.prepare(stm2);

    // circumradius in meters
    const R = 100;

    // number of points in the poly
    const N = 4;

    let totalGeoTime = 0;
    let totalRtTime = 0;

    const j = 100000;

    for (let i = 0; i < j; i++) {
        let longitude = chance.longitude();
        let latitude = chance.latitude();
        
        // find all points within 100m of a given lng/lat
        const params = { longitude, latitude, R, N };

        const startGeo = process.hrtime.bigint();
        const resGeopolyDist = selGeopolyDist.all(params);
        const endGeo = process.hrtime.bigint();
        totalGeoTime += Number(endGeo - startGeo);

        const startRt = process.hrtime.bigint();
        const resRtreeDist = selRtreeDist.all(params);
        const endRt = process.hrtime.bigint();
        totalRtTime += Number(endRt - startRt);

        if (resGeopolyDist.length) {
            if (resRtreeDist.length) {
                console.log(`${longitude}, ${latitude}`);
                console.log(` - Geo (${resGeopolyDist.length}); Rtree (${resRtreeDist.length})`);
            }
            else {
                console.log(`${longitude}, ${latitude}`);
                console.log(` - Geo (${resGeopolyDist.length}); Rtree (0000000)`);
            }
        }
        else if (resRtreeDist.length) {
            if (resGeopolyDist.length) {
                console.log(`${longitude}, ${latitude}`);
                console.log(` + Geo (${resGeopolyDist.length}); Rtree (${resRtreeDist.length})`);
            }
            else {
                console.log(`${longitude}, ${latitude}`);
                console.log(` + Geo (0000000); Rtree (${resRtreeDist.length})`);
            }
        }
    }
    

    console.log(`geo: ${totalGeoTime}; rt: ${totalRtTime}`);
    const diff = totalGeoTime - totalRtTime;
    console.log(`diff: ${diff}`);
    console.log(`${diff > 0 ? 'materialCitationsRtree' : 'materialCitationsGeopoly'} wins`);
}



//createTables(db);
const nondist = true;
// loadGeoTables(db, nondist);
// checkGeoTables(db, nondist);
// searchGeoDist(db, nondist);