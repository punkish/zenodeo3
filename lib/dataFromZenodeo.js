import { zql } from './zql/index.js';
import * as utils from './utils.js';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;
import { getSeverKetor } from './imagesData.js';

/**
 * Runs the sql query. 
 * @param {string} sql - SQL statement.
 * @param {object} runparams - an object of params to bind to the SQL.
 * @param {object} fastify - an instance of fastify.
 * @param {string} returnRows - specifies whether the query returns rows or not
 */
function sqlRunner({sql, runparams, fastify, returnRows = 'none'}) {
    try {
        let t = process.hrtime();
        let res;

        if (returnRows === 'none') {
            res = runparams
                ? fastify.betterSqlite3.prepare(sql).run(runparams)
                : fastify.betterSqlite3.prepare(sql).run();
        }
        else if (returnRows === 'one') {
            res = runparams
                ? fastify.betterSqlite3.prepare(sql).get(runparams)
                : fastify.betterSqlite3.prepare(sql).get();
        }
        else if (returnRows === 'many') {
            res = runparams
                ? fastify.betterSqlite3.prepare(sql).all(runparams)
                : fastify.betterSqlite3.prepare(sql).all();
        }
        
        t = process.hrtime(t);
        
        return { res, runtime: utils.timerFormat(t) }
    }
    catch(error) {
        console.log(sql);
        console.log(runparams);
        throw error;
    }
}

/**
 * Retrieve data from Zenodeo. 
 * @param {object} request - the request object.
 * @param {string} resource - name of the resource.
 * @param {object} fastify - an instance of fastify.
 */
function getDataFromZenodeo ({ request, resource, fastify }) {

    // Grab the params from the request and get the SQL queries from zql()
    //
    const params = request.query;
    const { queries, runparams } = zql({ 
        resource, 
        params
    });

    // A couple of objects to store the result and, optionally, the debug info
    //
    const result = {};
    const debug = {};

    // If there is a dropTmp query, we run that first. And, if there is a 
    // dropTmp query, there will also be createTmp and createIndex queries.
    //
    if (queries.dropTmp) {
        
        sqlRunner({
            sql: queries.dropTmp, 
            runparams: null, 
            fastify, 
            returnRows: 'none'
        });

        // if dropTmp existed, createTmp has to exist, so let's run that
        //
        const res1 = sqlRunner({
            sql: queries.createTmp, 
            runparams, 
            fastify, 
            returnRows: 'none'
        });

        if (config.isDebug) {
            debug.createTmp = { 
                query: queries.createTmp, 
                runtime: res1.runtime 
            }
        }

        // if createTmp existed, createIndex has to exist
        const res2 = sqlRunner({
            sql: queries.createIndex, 
            runparams: null, 
            fastify, 
            returnRows: 'none'
        });

        if (config.isDebug) {
            debug.createTmp = { 
                query: queries.createTmp, 
                runtime: res2.runtime 
            }
        }
    }

    if (queries.count) {

        // We run the count SQL query to see if there are any 
        // records for the given REST query
        // 
        const { res, runtime } = sqlRunner({
            sql: queries.count, 
            runparams, 
            fastify,
            returnRows: 'one'
        });
        
        result.count = res.num_of_records;

        if (config.isDebug) {
            debug.runparams = runparams;
            debug.count = { query: queries.count, runtime }
        }
    }
    
    // There are records in the table for the REST query, 
    // so we perform the remaining queries
    // 
    if (result.count) {
        if (queries.full) {
            if (resource === 'images') {
                
                queries.full = 'SELECT * FROM tmp';

                const { res, runtime } = getSeverKetor({
                    db: fastify.betterSqlite3, 
                    sql: queries.full, 
                    runparams, 
                    limit: 30, 
                    offset: 0
                });

                result.records = res;
    
                if (config.isDebug) {
                    debug.full = { query: queries.full, runtime }
                }

            }
            else {
                const { res, runtime } = sqlRunner({
                    sql: queries.full, 
                    runparams, 
                    fastify,
                    returnRows: 'many'
                });
                
                result.records = res;
    
                if (config.isDebug) {
                    debug.full = { query: queries.full, runtime }
                }
            }
            
        }

        if (queries.termFreq) {

            if (runparams.q) {
                const { res, runtime } = sqlRunner({
                    sql: queries.termFreq, 
                    runparams, 
                    fastify,
                    returnRows: 'many'
                });

                result.termFreq = res;
    
                if (config.isDebug) {
                    debug.termFreq = { query: queries.termFreq, runtime }
                }
            }

        }

        if (queries.yearlyCounts) {

            const { res, runtime } = sqlRunner({
                sql: queries.yearlyCounts, 
                runparams, 
                fastify,
                returnRows: 'many'
            });

            result.yearlyCounts = res;

            if (config.isDebug) {
                debug.yearlyCounts = { 
                    query: queries.yearlyCounts, 
                    runtime 
                }
            }
            
        }

        if (queries.related) {
            result.relatedRecords = {};
            debug.relatedRecords = {};

            for (let [relatedRecord, sql] of Object.entries(queries.related)) { 
                const { res, runtime } = sqlRunner({
                    sql: sql.full, 
                    runparams,
                    fastify,
                    returnRows: 'many'
                });

                result.relatedRecords[relatedRecord] = res;

                if (config.isDebug) {
                    debug.related[relatedRecord] = { 
                        query: sql.full, 
                        runtime 
                    }
                }
            }
        }

        if (queries.facets) {
            result.facets = {};
            debug.facets = {};

            for (let [facet, sql] of Object.entries(queries.facets)) {
                const { res, runtime } = sqlRunner({
                    sql, 
                    runparams,
                    fastify,
                    returnRows: 'many'
                });

                result.facets[facet] = res;

                if (config.isDebug) {
                    debug.facets[facet] = { 
                        query: sql, runparams, 
                        runtime 
                    }
                }
            }
        }

        if (queries.stats) {
            const stats = {};
            result.stats = {};
            debug.stats = {};

            for (let [entity, sql] of Object.entries(queries.stats.charts)) {
                const { res, runtime } = sqlRunner({
                    sql, 
                    runparams,
                    fastify,
                    returnRows: 'many'
                });

                stats[entity] = res;

                if (config.isDebug) {
                    debug.stats[entity] = { 
                        query: sql, 
                        runtime 
                    }
                }
            }

            const { categories, values } = res2data(stats);
            result.stats.categories = categories;
            result.stats.values = values;

            const locSql = queries.stats.locations;
            const { res, runtime } = sqlRunner({
                sql: locSql, 
                runparams,
                fastify,
                returnRows: 'many'
            });
            
            result.stats.locations = res;

            if (config.isDebug) {
                debug.stats.locations = { 
                    query: locSql, 
                    runtime 
                };
            }
        }

        debug.runparams = runparams;
    }

    return { result, debug };
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

export { sqlRunner, getDataFromZenodeo, res2data }