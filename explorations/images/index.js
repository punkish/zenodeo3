import { initDb } from '../../lib/dbconn.js';
const db = initDb().conn;
import * as turf from '@turf/turf'
import * as utils from '../../lib/utils.js';
import { preZql, zql } from '../../lib/zql/index.js';
import { formatDialect, sqlite as dialect } from 'sql-formatter';

// turf points are lon,lat
function getConvex(points) {
    
    const turfPoints = points.map(point => {
        return turf.point([point.longitude, point.latitude])
    });

    const tp = turf.featureCollection(turfPoints);
    
    let convexHull;

    try {
        convexHull = turf.convex(tp);
        return convexHull.geometry.coordinates;
    }
    catch(error) {
        console.log('*'.repeat(50));
        console.log(error);
        console.log(points);
        console.log('='.repeat(50));
    }

}


// first, lets select images
// function getOnlyImages(limit, offset) {
//     const sql = `
//     SELECT
//         images.id AS images_id,
//         -- images.httpUri,
//         -- images.captionText,
//         -- treatments.treatmentId,
//         -- treatments.treatmentTitle,
//         -- treatments.treatmentDOI,
//         -- treatments.zenodoDep,
//         -- treatments.articleTitle,
//         -- treatments.articleAuthor,
//         images.treatments_id
//     FROM
//         images
//         JOIN treatments ON images.treatments_id = treatments.id
//         JOIN classes ON treatments.classes_id = classes.id 
//     WHERE
//         classes.class LIKE 'Malacostraca%'
//     ORDER BY
//         images_id ASC
//     LIMIT @limit OFFSET @offset`;

//     return db.prepare(sql).all({
//         limit,
//         offset
//     });
// }

// function getImageLocations(tids) {
//     const sql = `
//     SELECT 
//         materialCitations.treatments_id,
//         materialCitations.id,
//         materialCitations.latitude,
//         materialCitations.longitude
//     FROM 
//         materialCitations 
//     WHERE 
//         materialCitations.treatments_id IN (${tids.join()})`;

//     return db.prepare(sql).all();
// }

// function getImages() {
//     const res1 = getOnlyImages(30, 0);
//     const treatments_ids = res1.map(r => r.treatments_id);
//     const res2 = getImageLocations(treatments_ids);
//     //console.log(res2)
   
//     // combine res1 and res2 on treatments_id
//     res1.forEach(r1 => {
//         const loc = res2.filter(r2 => {
//             const cond1 = r2.treatments_id === r1.treatments_id;
//             const cond2 = r2.latitude !== '' && r2.longitude !== '';
//             return cond1 && cond2;
//         })
//         .map(row => {
//             return {
//                 latitude: row.latitude,
//                 longitude: row.longitude
//             }
//         });

//         r1.loc = loc;
//     });

//     return res1;
// }

// const res = getImages();
// console.log(JSON.stringify(res, null, 2));


function getBo({
    db, runparams, limit, offset
}) {
    let t = process.hrtime();
    const sql = `
    SELECT 
        a30.*,
        materialCitations.latitude,
        materialCitations.longitude
    FROM (
        SELECT 
            images.id AS images_id, 
            -- images.httpUri, 
            -- images.captionText, 
            images.treatments_id
            -- treatments.treatmentId
            -- treatments.treatmentTitle, 
            -- treatments.treatmentDOI, 
            -- treatments.zenodoDep, 
            -- treatments.articleTitle, 
            -- treatments.articleAuthor, 
            -- materialCitations.latitude, 
            -- materialCitations.longitude
        FROM 
            images 
            JOIN treatments ON images.treatments_id = treatments.id 
            JOIN classes ON treatments.classes_id = classes.id
        WHERE 
            classes.class LIKE @class
        ORDER BY images_id
        LIMIT 30 
        OFFSET 0
    ) a30 
    LEFT JOIN materialCitations ON a30.treatments_id = materialCitations.treatments_id
    --WHERE 
    --    materialCitations.latitude 
    --        BETWEEN @min_lat AND @max_lat 
    --    AND materialCitations.longitude 
    --        BETWEEN @min_lon AND @max_lon
    `;

    const uniq = {};
    const rows = db.prepare(sql).all(runparams);

    for (const row of rows) {
        if (!(row.images_id in uniq)) {
            if (row.latitude && row.longitude) {
                row.loc = [{
                    latitude: row.latitude,
                    longitude: row.longitude
                }];
            }
            else {
                row.loc = [];
            }

            uniq[row.images_id] = row;
        }
        else {
            const thisRowAlreadySaved = uniq[row.images_id];

            if (row.latitude && row.longitude) {
                if (thisRowAlreadySaved.loc) {
                    thisRowAlreadySaved.loc.push({
                        latitude: row.latitude,
                        longitude: row.longitude
                    });
                }
                else {
                    thisRowAlreadySaved.loc = [{
                        latitude: row.latitude,
                        longitude: row.longitude
                    }];
                }
            }
        }

        delete row.latitude;
        delete row.longitude;
    }

    const res = Object.values(uniq).map((row, index) => {
        row.convexHull = undefined;

        if (row.loc) {
            if (row.loc.length > 1) {
                row.loc = uniqLatLon(row.loc);
            }

            if (row.loc.length > 2) {
                row.convexHull = getConvex(row.loc);
                row.loc = undefined;
            }
        }
        
        return row;
    });

    t = process.hrtime(t);
    return { res, runtime: utils.timerFormat(t) }
}

function getSeverKetor({db, queries, runparams, limit, offset}) {
    let t = process.hrtime();
    let stmt = db.prepare(queries.createTmp).run(runparams);
    stmt = db.prepare('SELECT * FROM tmp');
    const skipUniq = {};
    const retrUniq = {};

    for (const row of stmt.iterate()) {

        // Skip the row
        if (Object.keys(skipUniq).length < offset) {
            if (!(row.images_id in skipUniq)) {
                skipUniq[row.images_id] = 1;
            }
        }

        // This row is more than the offset, so process the data, 
        // skipping the rows prior to the offset.
        else {

            if (!(row.images_id in retrUniq)) {

                if (Object.keys(retrUniq).length == limit) {
                    break;
                }
                
                if (row.latitude && row.longitude) {
                    row.loc = [{
                        latitude: row.latitude,
                        longitude: row.longitude
                    }];
                }

                retrUniq[row.images_id] = row;
            }
            else {
                const thisRowAlreadySaved = retrUniq[row.images_id];

                if (row.latitude && row.longitude) {
                    if (thisRowAlreadySaved.loc) {
                        thisRowAlreadySaved.loc.push({
                            latitude: row.latitude,
                            longitude: row.longitude
                        });
                    }
                    else {
                        thisRowAlreadySaved.loc = [{
                            latitude: row.latitude,
                            longitude: row.longitude
                        }];
                    }
                }
            }

            delete row.latitude;
            delete row.longitude;
            
        }
    }

    const res = Object.values(retrUniq).map((row, index) => {
        row.convexHull = undefined;

        if (row.loc) {
            if (row.loc.length > 1) {
                row.loc = uniqLatLon(row.loc);
            }

            if (row.loc.length > 2) {
                row.convexHull = getConvex(row.loc);
                row.loc = undefined;
            }
        }
        
        return row;
    });

    t = process.hrtime(t);
    return { res, runtime: utils.timerFormat(t) }
}

// remove duplicate lat/lon from loc
// https://stackoverflow.com/a/53882732/183692
function uniqLatLon(data) {
    const result= data.reduce((current,next)=> {
        const cond = current.some(a => {
            return a.latitude  === next.latitude &&
                    a.longitude === next.longitude
        });

        if (!cond) {
            current.push(next);
        }

        return current;
    },[]);

    return result;
}

function multiQueries({db, baseSql, secondarySql, runparams, limit, offset}) {
    let t = process.hrtime();
    const res = db.prepare(baseSql).all(runparams);
    const secondaryStmt = db.prepare(secondarySql);

    // res.forEach(row => {
    //     const secondaryRes = secondaryStmt.all({
    //         treatments_id: row.treatments_id
    //     });

    //     if (secondaryRes.length < 2) {
    //         row.convexHull = undefined;
    //         row.loc = secondaryRes;
    //     }
    //     else if (secondaryRes.length > 2) {
    //         row.convexHull = getConvex(row.loc);
    //         row.loc = undefined;
    //     }
    //     else {
    //         row.convexHull = undefined;
    //         row.loc = secondaryRes;
    //     }
    // });

    t = process.hrtime(t);
    return { res, runtime: utils.timerFormat(t) }
}

// const runparams = {
//     class: 'Actinopterygii%',
//     min_lat: 7,
//     max_lat: 14,
//     min_lon: 120,
//     max_lon: 145
// };
// const limit = 30;
// const offset = 60;
// const sql = `
//     SELECT 
//         images.id AS images_id, 
//         -- images.httpUri, 
//         -- images.captionText, 
//         images.treatments_id,
//         -- treatments.treatmentId
//         -- treatments.treatmentTitle, 
//         -- treatments.treatmentDOI, 
//         -- treatments.zenodoDep, 
//         -- treatments.articleTitle, 
//         -- treatments.articleAuthor, 
//         materialCitationsRtree2.latitude, 
//         materialCitationsRtree2.longitude
//     FROM 
//         images 
//         JOIN treatments ON images.treatments_id = treatments.id 
//         JOIN classes ON treatments.classes_id = classes.id 
//         -- LEFT JOIN materialCitations ON treatments.id = materialCitations.treatments_id 
//         JOIN materialCitationsRtree2 ON treatments.id = materialCitationsRtree2.treatments_id
//     WHERE 
//         classes.class LIKE @class 
//         -- AND materialCitations.longitude BETWEEN @min_lon AND @max_lon 
//         -- AND materialCitations.latitude  BETWEEN @min_lat AND @max_lat
//         AND minX >= @min_lon AND minX < @max_lon 
//         AND minY >= @min_lat AND minY < @max_lat
//     ORDER BY images_id ASC`;

// const r0 = getBo({
//     db, sql, runparams, limit, offset
// });
// console.dir(r0.res, {depth: null});
// console.log(`${r0.res.length} records found in ${r0.runtime}`);

// const r1 = getSeverKetor({
//     db, sql, runparams, limit, offset
// });
// console.dir(r1.res, {depth: null});
// console.log(`${r1.res.length} records found in ${r1.runtime}`);

// const baseSql = `
//     SELECT 
//         images.id AS images_id, 
//         images.treatments_id         
//     FROM 
//         images 
//         JOIN treatments ON images.treatments_id = treatments.id 
//         JOIN classes ON treatments.classes_id = classes.id 
//     WHERE 
//         classes.class LIKE @class 
//     ORDER BY images_id ASC
//     LIMIT 30
//     OFFSET 0`;

// const secondarySql = `
//     SELECT DISTINCT  
//         materialCitations.latitude, 
//         materialCitations.longitude
//     FROM
//         materialCitations 
//         JOIN treatments ON treatments.id = materialCitations.treatments_id
//     WHERE 
//         materialCitations.treatments_id = @treatments_id
//         AND materialCitations.latitude != ''
//         AND materialCitations.longitude != ''`;

// const r2 = multiQueries({
//     db, 
//     baseSql, 
//     secondarySql,
//     runparams, 
//     limit, 
//     offset
// })
// console.dir(r2.res, {depth: null});
// console.log(`${r2.res.length} records found in ${r2.runtime}`);

// SELECT 
//     images.id AS images_id, 
//     images.treatments_id,
//     materialCitationsRtree2.latitude, 
//     materialCitationsRtree2.longitude
// FROM 
//     images 
//     JOIN treatments ON images.treatments_id = treatments.id 
//     JOIN classes ON treatments.classes_id = classes.id 
//     -- LEFT JOIN materialCitations ON treatments.id = materialCitations.treatments_id 
//     JOIN materialCitationsRtree2 ON treatments.id = materialCitationsRtree2.treatments_id
// WHERE 
//     classes.class LIKE 'Actinopterygii%' 
//     AND minX >= 120 AND minX < 145 
//     AND minY >=   7 AND minY <  14 
// ORDER BY images_id ASC
// LIMIT 30
// OFFSET 0;


// AND materialCitations.longitude BETWEEN 120 AND 145 
// AND materialCitations.latitude  BETWEEN   7 AND  14

function extractLimOff(query) {
    const res = query.match(/LIMIT (?<limit>\d+) OFFSET (?<offset>\d+)/);
    return {
        limit: res.groups.limit,
        offset: res.groups.offset
    }
}

const url = 'http://localhost:3010/v3/images?page=1&size=30&class=Malacostraca&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption&cols=latitude&cols=longitude&yearlyCounts=true';
const searchparams = 'page=1&size=30&&class=Malacostraca&geolocation=within(min_lat:7,min_lng:120,max_lat:14,max_lng:145)&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption&cols=latitude&cols=longitude&yearlyCounts=true';
const resource = 'images';
const params = preZql(searchparams);
const { queries, runparams } = zql({ resource, params });
const { limit, offset } = extractLimOff(queries.full);
// for (const [qname, query] of Object.entries(queries)) {
//     console.log(qname);
//     console.log('-'.repeat(50));
//     console.log(formatDialect(query, { params: runparams, dialect, tabWidth: 4 }));
//     console.log('\n');
// } 
//console.log(runparams, limit, offset)
const r1 = getSeverKetor({
    db, queries, runparams, limit, offset
});
console.dir(r1.res, {depth: null});
console.log(`${r1.res.length} records found in ${r1.runtime}`);