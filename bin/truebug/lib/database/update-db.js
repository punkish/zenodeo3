'use strict';

import * as fs from 'fs';
import * as h3 from 'h3-js';
// const turf = require('@turf/turf');
// const isSea = require('is-sea');
// const h3 = require('h3-js');
//const geojson2h3 = require('geojson2h3');
import Database from "better-sqlite3";
// const config = require('config');
// const db = {
//     h3: config.get('db.h3'),
//     treatments: new Database(config.get('db.treatments')),
//     stats: new Database(config.get('db.stats')),
// }

const db = new Database('./data/db/zenodeo.sqlite');

// 510M sq kms
const EARTH = 510000000;

// https://www.math.net/area-of-a-hexagon
const hexarea = (side) => 3 * Math.sqrt(3) * side * side / 2;


//outputWithTurf(200);
//inSeaOrNotWithTurf

// Convert a lat/lng point to a hexagon index at resolution 7
// const h3Index = h3.geoToH3(37.3615593, -122.0553238, 7);
// console.log(`h3Index: ${h3Index}`);
// // -> '87283472bffffff'

// // Get the center of the hexagon
// const hexCenterCoordinates = h3.h3ToGeo(h3Index);
// console.log(`hexCenterCoordinates: ${JSON.stringify(hexCenterCoordinates, null, 4)}`);
// // -> [37.35171820183272, -122.05032565263946]

// // Get the vertices of the hexagon
// const hexBoundary = h3.h3ToGeoBoundary(h3Index);
// console.log(`hexBoundary: ${JSON.stringify(hexBoundary, null, 4)}`);
// // -> [ [37.341099093235684, -122.04156135164334 ], ...]

function calcDensity() {
    
    //const sel = 'SELECT materialsCitationId, longitude, latitude FROM materialsCitations WHERE deleted = 0 AND validGeo = 1';
    //const sel = `SELECT latitude, longitude FROM materialCitations WHERE typeof(latitude) = 'real' AND abs(latitude) < 90 AND typeof(longitude) = 'real' AND abs(longitude) < 180`;
    const sel = 'SELECT DISTINCT latitude, longitude FROM images JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id WHERE materialCitations.validGeo = 1';
    const points = db.prepare(sel).all();
    const j = points.length;
    console.log(`found ${j} points`);
    
    for (let resolution = 0; resolution < 4; resolution++) {
        console.log(`- writing resolution ${resolution}`);
        const density = {};

        for (let i = 0; i < j; i++) {
            const point = points[i];
            const h3id = h3.latLngToCell(
                point.latitude, 
                point.longitude, 
                resolution
            );
    
            if (h3id in density) {
                density[h3id]++;
            }
            else {
                density[h3id] = 1;
            }
        }

        const filename = `./data/h3/treatments-density-h3-${resolution}.json`;
        const done = fs.writeFileSync(filename, JSON.stringify(density));
    }
}

calcDensity();

/*
| lat/lng             | validGeo | isOnLand |
|---------------------|----------|----------|
| lat/lng are empty   | 0        | NULL     |
| lat/lng are wrong   | 0        | NULL     |
| lat/lng are correct | 1        | 1 or 0   |
| lat/lng are correct | 1        | NULL     |
*/

// const isInSea = () => {
//     const recs = db.treatments.prepare('SELECT id, latitude, longitude, isOnLand FROM materialsCitations WHERE deleted = 0 AND validGeo = 1').all();

//     const upd = db.treatments.prepare('UPDATE materialsCitations SET isOnLand = @isOnLand WHERE id = @id');

//     let count = 0;
//     for (const rec of recs) {
//         const params = {isOnLand: 1, id: rec.id};
//         if (isSea(rec.latitude, rec.longitude)) {
//             params.isOnLand = 0;
//             count++;
//         }
        
//         upd.run(params);
//     }
//     console.log(`${count} were in sea`);
// }

//isInSea();