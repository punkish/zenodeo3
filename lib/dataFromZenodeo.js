import { zql } from './zql/index.js';
import * as utils from './utils.js';
import * as turf from '@turf/turf';

/**
 * Runs the sql query. 
 * @param {string} sql - SQL statement.
 * @param {object} runparams - an object of params to bind to the SQL.
 * @param {object} fastify - an instance of fastify.
 * @param {string} returnRows - specifies whether the query returns rows or not
 */
function sqlRunner({ fastify, sql, runparams, returnRows = 'none' }) {
    
    try {
        let t = process.hrtime();
        let runType = 'all';

        if (returnRows === 'none') {
            runType = 'run';
        }
        else if (returnRows === 'one') {
            runType = 'get';
        }

        const result = runparams
            ? fastify.zqlite.prepare(sql)[runType](runparams)
            : fastify.zqlite.prepare(sql)[runType]();
        
        t = process.hrtime(t);
        
        return { result, runtime: utils.timerFormat(t) }
    }
    catch(error) {
        console.error('*'.repeat(50));
        console.error(sql);
        console.error(runparams);
        console.error('*'.repeat(50));
        throw error;
    }
}

function runQuery({ 
    fastify, 
    queryName, 
    queries, 
    runparams, 
    returnRows, 
    debugInfo 
}) {
    const sql = queries[queryName];
    fastify.zlog.info(`running query ${queryName}: ${sql}`);

    const { result, runtime } = sqlRunner({
        fastify, 
        sql, 
        runparams, 
        returnRows
    });

    debugInfo[queryName] = {
        sql: utils.unFormatSql(utils.formatSql(sql, runparams)),
        runtime
    }

    return { result, runtime }
}

/**
 * Retrieve data from Zenodeo. 
 * @param {object} request - the request object.
 * @param {string} resource - name of the resource.
 * @param {object} fastify - an instance of fastify.
 */
function getDataFromZenodeo (fastify, resource, request) {

    // Get the SQL queries from zql()
    const { queries, runparams } = zql(fastify, resource, request);

    // An object to store the result and, 
    // optionally, the sql info for debugging
    let response = {};
    let debugInfo = {};

    const queryObj = { 
        fastify, 
        //queryName: 'dropTmp', 
        queries, 
        //runparams: null, 
        //returnRows: 'none', 
        debugInfo 
    }

    // If there is a dropTmp query, we run that first.
    if (queries.dropTmp) {
        queryObj.queryName = 'dropTmp';
        queryObj.runparams = null;
        queryObj.returnRows = 'none';
        runQuery(queryObj);
    }

    // If there is a createTmp query, we run that next.
    if (queries.createTmp) {
        queryObj.queryName = 'createTmp';
        queryObj.runparams = runparams;
        runQuery(queryObj);
    }

    // if createTmp existed, createIndex has to exist
    if (queries.createIndex) {
        queryObj.queryName = 'createIndex';
        queryObj.runparams = null;
        queryObj.returnRows = 'none';
        runQuery(queryObj);
    }

    if (queries.count) {
        queryObj.queryName = 'count';
        queryObj.runparams = runparams;
        queryObj.returnRows = 'one';
        const { result, runtime } = runQuery(queryObj);
        response.count = result.num_of_records;
    }

    // There are records in the table for the REST query, 
    // so we run the remaining queries
    if (queries.full) {
        let res;
        
        if (queries.createTmp) {

            if (resource.name === 'images') {
                fastify.zlog.info(`resource images: ${queries.full}`);
                res = getSeverKetor({
                    fastify, 
                    sql: queries.full,
                    key_id: 'images_id'
                });
            }
            else if (resource.name === 'treatments') {
                fastify.zlog.info(`resource treatments: ${queries.full}`);
                res = getSeverKetor({
                    fastify, 
                    sql: queries.full,
                    key_id: 'treatments_id'
                });
            }

            response.records = res.result;
            debugInfo.full = { 
                sql: queries.full, 
                runtime: res.runtime
            }

        }
        else {
            fastify.zlog.info(`resource other than 'images'/'treatments'`);
            queryObj.queryName = 'full';
            queryObj.runparams = runparams;
            queryObj.returnRows = 'many';
            const { result, runtime } = runQuery(queryObj);
            response.records = result;
        }

    }

    if (queries.termFreq && runparams.q) {
        queryObj.queryName = 'termFreq';
        queryObj.runparams = runparams;
        queryObj.returnRows = 'many';
        const { result, runtime } = runQuery(queryObj);
        response.termFreq = result;
    }

    if (queries.yearlyCounts) {
        queryObj.queryName = 'yearlyCounts';
        queryObj.runparams = runparams;
        queryObj.returnRows = 'many';
        const { result, runtime } = runQuery(queryObj);
        response.yearlyCounts = result;
    }

    if (queries.related) {
        response.relatedRecords = {};
        debugInfo.relatedRecords = {};
        //sql.relatedRecords = {};

        for (let [relatedRecord, queries] of Object.entries(queries.related)) { 
            const { result, runtime } = sqlRunner({
                sql: queries.full, 
                runparams,
                fastify,
                returnRows: 'many'
            });

            response.relatedRecords[relatedRecord] = result;

            debugInfo.relatedRecords[relatedRecord] = { 
                sql: queries.full, 
                runtime 
            }
        }
    }

    if (queries.facets) {
        response.facets = {};
        debugInfo.facets = {};

        for (let [facet, sql] of Object.entries(queries.facets)) {
            const { result, runtime } = sqlRunner({
                sql, 
                runparams,
                fastify,
                returnRows: 'many'
            });

            response.facets[facet] = result;

            debugInfo.facets[facet] = { 
                runparams,
                sql, 
                runtime 
            }
        }
    }

    if (queries.stats) {
        response.stats = {};
        debugInfo.facets = {};

        for (let [entity, sql] of Object.entries(queries.stats.charts)) {
            const { result, runtime } = sqlRunner({
                sql, 
                runparams,
                fastify,
                returnRows: 'many'
            });

            response.stats[entity] = result;

            debugInfo.stats[entity] = { 
                sql, 
                runtime 
            }
        }

        const { categories, values } = res2data(stats);
        response.stats.categories = categories;
        response.stats.values = values;

        const locSql = queries.stats.locations;
        const { result, runtime } = sqlRunner({
            sql: locSql, 
            runparams,
            fastify,
            returnRows: 'many'
        });
        
        response.stats.locations = result;

        debugInfo.stats.locations = { 
            sql: locSql, 
            runtime 
        };
    }

    return { response, debugInfo }
}

/**
 * Convert results to data. 
 * @param {object} result - the result object.
 */
function res2data(result) {
    const categories = [];
    const values = {};

    const cats = {};

    for (let [tb, res] of Object.entries(result)) {
        res.forEach(r => cats[r.checkInYear] = 1);
        values[tb] = [];
    }

    categories.push(...Object.keys(cats).map(e => Number(e)));

    for (let [tb, res] of Object.entries(result)) {
        categories.forEach(year => {
            const r = res.filter(r => Number(r.checkInYear) === year)[0];

            if (r) {
                values[tb].push(r.num);
            }
            else {
                values[tb].push('');
            }
        })
    }

    return { categories, values }
}

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

// how to output grouped values in a JSON array
// See https://sqlite.org/forum/info/42ff78ab46a3e2bf
// solution by user @SeverKetor
function getSeverKetor({ fastify, sql, key_id }) {
    let t = process.hrtime();

    let limit = 30;
    let offset = 0;
    const res = sql.match(/LIMIT (?<limit>\d+) OFFSET (?<offset>\d+)/);

    if (res) {
        limit = res.groups.limit,
        offset = res.groups.offset
    }

    const stmt = fastify.zqlite.prepare('SELECT * FROM tmp');
    const skipUniq = {};
    const retrUniq = {};
    
    for (const row of stmt.iterate()) {
        
        // Skip the row
        if (Object.keys(skipUniq).length < offset) {
            if (!(row[key_id] in skipUniq)) {
                skipUniq[ row[key_id] ] = 1;
            }
        }

        // This row is more than the offset, so process the data, 
        // skipping the rows prior to the offset.
        else {

            if (!(row[key_id] in retrUniq)) {

                if (Object.keys(retrUniq).length == limit) {
                    break;
                }
                
                if (row.latitude && row.longitude) {
                    row.loc = [{
                        latitude: row.latitude,
                        longitude: row.longitude
                    }];
                }

                retrUniq[ row[key_id] ] = row;
            }
            else {
                const thisRowAlreadySaved = retrUniq[ row[key_id] ];

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

    const result = Object.values(retrUniq).map((row, index) => {
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
    return { result, runtime: utils.timerFormat(t) }
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

export { sqlRunner, runQuery, getDataFromZenodeo, res2data }