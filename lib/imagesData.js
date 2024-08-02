// import { initDb } from '../../lib/dbconn.js';
// const db = initDb().conn;
import * as turf from '@turf/turf'
import * as utils from './utils.js';

// turf points are lon,lat
function getConvex(points) {
    
    const turfPoints = points.map(point => {
        return turf.point([point.longitude, point.latitude])
    });

    let convexHull;

    try {
        convexHull = turf.convex(
            turf.featureCollection(turfPoints)
        );
        return convexHull.geometry.coordinates;
    }
    catch(error) {
        console.log('*'.repeat(50));
        console.log(error);
        console.log(points);
        console.log('='.repeat(50));
    }

}

function getSeverKetor({db, sql, runparams, limit, offset}) {
    let t = process.hrtime();
    const stmt = db.prepare(sql).bind(runparams);
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

export { getSeverKetor }