import { ddutils } from '../data-dictionary/utils/index-ng.js';
import { resources } from '../data-dictionary/resources/index.js';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;
// import { zql } from './zql/index.js';
//import { Cache } from '@punkish/zcache';
import { Cache } from './@punkish/zcache/index.js';
import crypto from 'crypto';
import * as utils from './utils.js';
import https from 'https';
import process from 'node:process';
import { getDataFromZenodeo } from './dataFromZenodeo.js';


/**
 * Takes a resourceName and returns a route.
 * @param {string} resourceName - name of the resource.
 */
const routeFactory = (resourceName) => {
    const resource = resources.filter(r => r.name === resourceName)[0];
    
    return async function route(fastify) {
        const options = routeOptions(resource, fastify);
        fastify.route(options);
    }
}

/**
 * This is the guts of a route where the method, the url, the schema and the
 * handler are described
 * @param {string} resource - name of the resource.
 * @param {object} fastify - an instance of fastify
 */
const routeOptions = (resource, fastify) => {
    const queryStringSchema = ddutils.getQueryStringSchema(resource.name);

    return {
        method: 'GET',
        url: `/${resource.name.toLowerCase()}`,
        schema: {
            "$schema": "http://json-schema.org/draft-07/schema",
            "$id": `https://example.com/${resource.name}.schema.json`,
            title: resource.title,
            summary: resource.summary,
            description: resource.description,
            response: {},
            querystring: {
                type: 'object',
                additionalProperties: false,
                properties: queryStringSchema
            },
            tags: resource.tags
        },
        handler: routeHandler(resource.name, fastify)
    }
}

/**
 * Runs the query via the cache, returning cached value if found, otherwise
 * querying the datasource, caching and then returning the results 
 * @param {object} request - request object.
 * @param {string} resourceName - name of the resource.
 * @param {object} fastify - an instance of fastify.
 * @param {object} cache - an instance of the cache; defaults to 'null'.
 * @param {string} cacheKey - a key in the cache.
 */
const queryViaCache = async (request, resourceName, fastify, cache=null, cacheKey) => {

    const { result, debug } = await queryDataStore({ 
        request, 
        resource: resourceName,
        fastify
    });

    const _links = makeLinks(request);
    const search = getSearch(request);

    const response = {};
  
    if (cache) {
        const res = await cache.set(
            cacheKey, { search, result, _links }
        );

        response.item = res.item;
        response.stored = res.stored;
        response.ttl = res.ttl;
    }
    else {
        response.item.search = getSearch(request);
        response.item.result = result;
        response.item._links = makeLinks(request);
    }
    
    if (config.isDebug) {
        response.debug = debug;
    }

    return response;
}

/**
 * The handler runs when the route is called. 
 * @param {string} resourceName - name of the resource.
 * @param {object} fastify - an instance of fastify.
 */
const routeHandler = (resourceName, fastify) => async (request) => {

    if (config.cache.on) {
        request.log.info("cache is on");

        //  
        // get a reference to the cache
        //
        const cache = getCache({ 
            dir: config.cache.base, 
            namespace: resourceName, 
            duration: request.query.cacheDuration
                ? request.query.cacheDuration * 24 * 60 * 60 * 1000
                : config.cache.ttl
        })

        const cacheKey = getCacheKey(request);

        if (request.query.refreshCache) {
            request.log.info("delete cache");
            await cache.delete(cacheKey);
            const response = queryViaCache(request, resourceName, fastify, cache, cacheKey);
            return response;
        }
        else {
            let res = await cache.get(cacheKey);

            if (res) {
                const response = {
                    item: res.item,
                    stored: res.stored,
                    ttl: res.ttl
                };

                response.cacheHit = true;
                return response;
            }
            else {
                const response = queryViaCache(request, resourceName, fastify, cache, cacheKey);
                return response;
            }
        }
    }

    //
    // cache is off (likely for testing the general response of the app),
    // so we get the result, stuff it in response{} and send it off
    //
    else {
        cache = null;
        const response = queryViaCache(request, resourceName, fastify, cache, cacheKey);
        return response;
    }

}

/**
 * Takes a request and returns a unique cacheKey. 
 * @param {object} request - the request object.
 */
const getCacheKey = (request) => {
    //const searchParams = new URLSearchParams(request.origQuery);
    const searchParams = new URLSearchParams(request.query);
    const paramsToRemove1 = [
        'facets',
        'relatedRecords'
    ];

    const paramsToRemove2 = [
        'deleted',
        'refreshCache',
        'cacheDuration'
    ];

    paramsToRemove1.forEach(p => {
        if (searchParams.get(p) === 'false') {
            searchParams.delete(p);
        }
    });

    paramsToRemove2.forEach(p => {
        if (searchParams.has(p)) {
            searchParams.delete(p);
        }
    });

    // searchParams.delete('deleted');

    // if (searchParams.get('facets') === 'false') {
    //     searchParams.delete('facets');
    // }

    // if (searchParams.get('relatedRecords') === 'false') {
    //     searchParams.delete('relatedRecords');
    // }

    // if (searchParams.has('refreshCache')) {
    //     searchParams.delete('refreshCache');
    // }

    // if (searchParams.has('cacheDuration')) {
    //     searchParams.delete('cacheDuration');
    // }

    searchParams.sort();
    
    return crypto
        .createHash('md5')
        .update(searchParams.toString())
        .digest('hex')
}

/**
 * Queries the datastore. 
 * @param {object} request - request object.
 * @param {string} resource - name of the resource.
 * @param {object} fastify - an instance of fastify.
 */
const queryDataStore = async ({ request, resource, fastify }) => {

    const sourceOfResource = ddutils.getTable(resource, 'source');
     
    let data;

    if (sourceOfResource === 'zenodeo') {
        data = await getDataFromZenodeo({ request, resource, fastify });
    }
    else if (sourceOfResource === 'metadata') {
        data = await getDataFromMetaStore({ request, resource });
    }

    return data;
}

/**
 * Runs the sql query. 
 * @param {string} sql - SQL statement.
 * @param {object} runparams - an object of params to bind to the SQL.
 * @param {object} fastify - an instance of fastify.
 * @param {string} returnRows - specifies whether the query returns rows or not
 */
// const _sqlRunner = function({sql, runparams, fastify, returnRows = 'none'}) {
//     try {
//         let t = process.hrtime();
//         let res;

//         if (returnRows === 'none') {
//             res = runparams
//                 ? fastify.betterSqlite3.prepare(sql).run(runparams)
//                 : fastify.betterSqlite3.prepare(sql).run();
//         }
//         else if (returnRows === 'one') {
//             res = runparams
//                 ? fastify.betterSqlite3.prepare(sql).get(runparams)
//                 : fastify.betterSqlite3.prepare(sql).get();
//         }
//         else if (returnRows === 'many') {
//             res = runparams
//                 ? fastify.betterSqlite3.prepare(sql).all(runparams)
//                 : fastify.betterSqlite3.prepare(sql).all();
//         }
        
//         t = process.hrtime(t);
        
//         return { res, runtime: utils.timerFormat(t) }
//     }
//     catch(error) {
//         console.log(sql);
//         console.log(runparams);
//         throw error;
//     }
// }

/**
 * Retrieve data from Zenodeo. 
 * @param {object} request - the request object.
 * @param {string} resource - name of the resource.
 * @param {object} fastify - an instance of fastify.
 */
// const getDataFromZenodeo = async ({ request, resource, fastify }) => {

//     // Grab the params from the request and get the SQL queries from zql()
//     //
//     const params = request.query;
//     const { queries, runparams } = zql({ 
//         resource, 
//         params
//     });

//     // A couple of objects to store the result and, optionally, the debug info
//     //
//     const result = {};
//     const debug = {};

//     // If there is a dropTmp query, we run that first. And, if there is a 
//     // dropTmp query, there will also be createTmp and createIndex queries.
//     //
//     if (queries.dropTmp) {
        
//         _sqlRunner({
//             sql: queries.dropTmp, 
//             runparams: null, 
//             fastify, 
//             returnRows: 'none'
//         });

//         // if dropTmp existed, createTmp has to exist, so let's run that
//         //
//         const res1 = _sqlRunner({
//             sql: queries.createTmp, 
//             runparams, 
//             fastify, 
//             returnRows: 'none'
//         });

//         if (config.isDebug) {
//             debug.createTmp = { 
//                 query: queries.createTmp, 
//                 runtime: res1.runtime 
//             }
//         }

//         // if createTmp existed, createIndex has to exist
//         const res2 = _sqlRunner({
//             sql: queries.createIndex, 
//             runparams: null, 
//             fastify, 
//             returnRows: 'none'
//         });

//         if (config.isDebug) {
//             debug.createTmp = { 
//                 query: queries.createTmp, 
//                 runtime: res2.runtime 
//             }
//         }
//     }

//     if (queries.count) {

//         // We run the count SQL query to see if there are any 
//         // records for the given REST query
//         // 
//         const { res, runtime } = _sqlRunner({
//             sql: queries.count, 
//             runparams, 
//             fastify,
//             returnRows: 'one'
//         });
        
//         result.count = res[0].num_of_records;

//         if (config.isDebug) {
//             debug.runparams = runparams;
//             debug.count = { query: queries.count, runtime }
//         }
//     }
    
//     // There are records in the table for the REST query, 
//     // so we perform the remaining queries
//     // 
//     if (result.count) {
//         if (queries.full) {
//             const { res, runtime } = _sqlRunner({
//                 sql: queries.full, 
//                 runparams, 
//                 fastify,
//                 returnRows: 'many'
//             });
            
//             result.records = res;

//             if (config.isDebug) {
//                 debug.full = { query: queries.full, runtime }
//             }
//         }

//         if (queries.termFreq) {

//             if (runparams.q) {
//                 const { res, runtime } = _sqlRunner({
//                     sql: queries.termFreq, 
//                     runparams, 
//                     fastify,
//                     returnRows: 'many'
//                 });

//                 result.termFreq = res;
    
//                 if (config.isDebug) {
//                     debug.termFreq = { query: queries.termFreq, runtime }
//                 }
//             }

//         }

//         if (queries.yearlyCounts) {

//             const { res, runtime } = _sqlRunner({
//                 sql: queries.yearlyCounts, 
//                 runparams, 
//                 fastify,
//                 returnRows: 'many'
//             });

//             result.yearlyCounts = res;

//             if (config.isDebug) {
//                 debug.yearlyCounts = { 
//                     query: queries.yearlyCounts, 
//                     runtime 
//                 }
//             }
            
//         }

//         if (queries.related) {
//             result.relatedRecords = {};
//             debug.relatedRecords = {};

//             for (let [relatedRecord, sql] of Object.entries(queries.related)) { 
//                 const { res, runtime } = _sqlRunner({
//                     sql: sql.full, 
//                     runparams,
//                     fastify,
//                     returnRows: 'many'
//                 });

//                 result.relatedRecords[relatedRecord] = res;

//                 if (config.isDebug) {
//                     debug.related[relatedRecord] = { 
//                         query: sql.full, 
//                         runtime 
//                     }
//                 }
//             }
//         }

//         if (queries.facets) {
//             result.facets = {};
//             debug.facets = {};

//             for (let [facet, sql] of Object.entries(queries.facets)) {
//                 const { res, runtime } = _sqlRunner({
//                     sql, 
//                     runparams,
//                     fastify,
//                     returnRows: 'many'
//                 });

//                 result.facets[facet] = res;

//                 if (config.isDebug) {
//                     debug.facets[facet] = { 
//                         query: sql, runparams, 
//                         runtime 
//                     }
//                 }
//             }
//         }

//         if (queries.stats) {
//             const stats = {};
//             result.stats = {};
//             debug.stats = {};

//             for (let [entity, sql] of Object.entries(queries.stats.charts)) {
//                 const { res, runtime } = _sqlRunner({
//                     sql, 
//                     runparams,
//                     fastify,
//                     returnRows: 'many'
//                 });

//                 stats[entity] = res;

//                 if (config.isDebug) {
//                     debug.stats[entity] = { 
//                         query: sql, 
//                         runtime 
//                     }
//                 }
//             }

//             const { categories, values } = res2data(stats);
//             result.stats.categories = categories;
//             result.stats.values = values;

//             const locSql = queries.stats.locations;
//             const { res, runtime } = _sqlRunner({
//                 sql: locSql, 
//                 runparams,
//                 fastify,
//                 returnRows: 'many'
//             });

//             result.stats.locations = res;

//             if (config.isDebug) {
//                 debug.stats.locations = { 
//                     query: locSql, 
//                     runtime 
//                 };
//             }
//         }

//         debug.runparams = runparams;
//     }

//     return { result, debug };
// }

/**
 * Convert results to data. 
 * @param {object} result - the result object.
 */
// const res2data = (result) => {
//     const categories = [];
//     const values = {};

//     const cats = {};

//     for (let [tb, res] of Object.entries(result)) {
//         res.forEach(r => cats[r.checkInYear] = 1);
//         values[tb] = [];
//     }

//     categories.push(...Object.keys(cats).map(e => Number(e)));

//     for (let [tb, res] of Object.entries(result)) {
//         categories.forEach(year => {
//             const r = res.filter(r => Number(r.checkInYear) === year)[0];

//             if (r) {
//                 values[tb].push(r.num);
//             }
//             else {
//                 values[tb].push('');
//             }
//         })
//     }

//     return { categories, values }
// }

const getDataFromZenodo = async ({ request, resource }) => {
    const params = request.query;

    // 
    // add type by removing the last 's' from resource name
    // images -> image
    // publications -> publication
    // 
    params.type = resource.slice(0, -1);

    // 
    // the following params can have duplicate k,v pairs,
    // but come in as arrays in params. So we save them, 
    // and later add them back as duplicated keys. These 
    // vars will be created *only* if they exist in params
    // 
    const communities = params.communities;
    const subtypes = params.subtype;
    const keywords = params.keywords;
    
    const remove = [ 
        'refreshCache', 
        'facets', 
        'relatedRecords',
        'stats', 
        'sortby', 
        'communities', 
        'subtype',
        'keywords'
    ];

    remove.forEach(p => {
        if (p in params) {
            delete params[p];
        }
    })

    const qs = new URLSearchParams(params);

    //  
    // add duplicate keys, as needed… see above for communities, 
    // subtypes and keywords
    // 
    if (communities) {
        communities.forEach(v => qs.append('communities', v));
    }
    
    if (subtypes) {
        subtypes.forEach(v => qs.append('subtype', v));
    }

    if (keywords) {
        keywords.forEach(v => qs.append('keywords', v));
    }
    
    //  
    // examples of uriRemote 
    //     // https://zenodo.org/api/records/?
    //      communities=biosyslit&
    //      communities=belgiumherbarium&
    //      page=1&
    //      size=30&
    //      type=image
    // 
    // https://zenodo.org/api/records/?
    //      sort=mostrecent&
    //      subtype=figure&
    //      subtype=photo&
    //      subtype=drawing&
    //      subtype=diagram&
    //      subtype=plot&
    //      subtype=other&
    //      communities=biosyslit&
    //      communities=belgiumherbarium&
    //      type=image&
    //      page=1&
    //      size=30
    // 
    const uriRemote = qs 
        ? `${config.url.zenodo}?${qs}` 
        : config.url.zenodo;

    const result = {};
    const debug = {};

    try {
        let t = process.hrtime();

        // const json = config.useGot 
        //     ? JSON.parse((await got(uriRemote)).body)
        //     : await getRequest(qs);
        const json = await getRequest(qs);

        t = process.hrtime(t);
        const runtime = utils.timerFormat(t);

        result.count = json.hits.total;
        result.records = json.hits.hits;

        if (config.isDebug) {
            //debug.count= '';
            //debug.full = { query: uriRemote, runtime };
            debug.query = uriRemote;
            debug.runtime = runtime;
        }
    }
    catch (error) {
        console.error(error);
        return {};
    }

    return { result, debug };
}

const getDataFromMetaStore = async ({ request, resource }) => {
    return await getDataFromZenodeo({ request, resource });
}

const getRequest = async (qs) => {
    return new Promise((resolve) => {
        const uri = `/api/records/?${qs}`;
        const options = {
            hostname: 'zenodo.org',
            port: 443,
            path: uri,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        https.get(options, (res) => {
            const { statusCode } = res;
            const contentType = res.headers['content-type'];
            let error;

            // 
            // Any 2xx status code signals a successful response but
            // here we're only checking for 200.
            // 
            if (statusCode !== 200) {
                const msg = [
                    '='.repeat(50),
                    'ERROR',
                    '-'.repeat(50),
                    'Request Failed.',
                    `URI: ${uri}`,
                    `Status Code: ${statusCode}`,
                    '-'.repeat(50)
                ];

                error = new Error(msg.join('\n'));
            } 
            else if (!/^application\/json/.test(contentType)) {
                const msg = [
                    '='.repeat(50),
                    'ERROR',
                    '-'.repeat(50),
                    'Invalid content-type.',
                    `Expected application/json but received ${contentType}`,
                    '-'.repeat(50)
                ];

                error = new Error(msg.join('\n'));
            }

            if (error) {
                console.error(error.message);

                // 
                // Consume response data to free up memory
                // 
                res.resume();
                return;
            }

            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    resolve(parsedData);
                } 
                catch (e) {
                    console.error(e.message);
                }
            });
        }).on('error', (e) => {
            console.error(`Got error: ${e.message}`);
        });
    });
}

/**
 * Extract search object from the request. 
 * @param {object} request - the request object.
 */
const getSearch = (request) => {
    //const search = new URLSearchParams(request.origQuery);
    const search = new URLSearchParams(request.query);
    
    search.delete('refreshCache');
    return groupParamsByKey(search);
}

// 
// How to convert URL parameters to a JavaScript object?
// https://stackoverflow.com/a/52539264/183692
// 
// Multiple same keys
// 
/**
 * Group the parameters by key. 
 * @param {object} params - the params object.
 */
 const groupParamsByKey = (params) => {

    const reduceFn = (acc, tuple) => {

        // 
        // get the key and value from each tuple 
        //  
        const [key, val] = tuple;
        //if (acc.hasOwnProperty(key)) {
        if (Object.prototype.hasOwnProperty.call(acc, key)) {
    
            //  
            // if the current key is already an array, 
            // we'll add the value to it
            // 
            if(Array.isArray(acc[key])) {
                acc[key] = [...acc[key], val]
            }
    
            // 
            // if it's not an array, but contains a value, 
            // we'll convert it into an array and add the current 
            // value to it
            // 
            else {
                acc[key] = [acc[key], val];
            }
        } 
        else {
    
            // 
            // plain assignment if no special case is present
            // 
            acc[key] = val;
        }
       
       return acc;
    }

    return [...params.entries()].reduce(reduceFn, {});
}

/**
 * Construct _prev, _next and _self links. 
 * @param {object} request - the request object.
 */
const makeLinks = (request) => {
    let [ url, search ] = request.url.substring(1).split('?');
    const sp = new URLSearchParams(search);

    if (sp.has('refreshCache')) {
        sp.delete('refreshCache');
    }

    //const safeURIComponent = (uri) => decodeURIComponent(uri);

    const _links = { 
        _self: `${config.url.zenodeo}/${url}?${decodeURIComponent(sp.toString())}` 
    };

    let prev;
    let next;
    if (sp.has('page')) {
        const page = sp.get('page');
        sp.set('page', page - 1);
        prev = decodeURIComponent(sp.toString());

        sp.set('page', parseInt(page) + 1);
        next = decodeURIComponent(sp.toString());
    }
    else {
        sp.set('page', 1);
        prev = decodeURIComponent(sp.toString());

        sp.set('page', 2);
        next = decodeURIComponent(sp.toString());
    }

    _links._prev = `${config.url.zenodeo}/${url}?${prev}`;
    _links._next = `${config.url.zenodeo}/${url}?${next}`;
    return _links;
}

/**
 * Coerce repeating keys into an array. 
 * @param {object} request - the request object.
 * @param {object} param - the param object.
 */
const coerceToArray = (request, param) => {

    if (typeof request.query[param] === 'string') {
        const arr = request.query[param].split(',');
        request.query[param] = arr;
    }
    
}

/**
 * Return a cache object. 
 * @param {string} dir - the cache directory.
 * @param {string} namespace - the cache namespace.
 * @param {number} duration - the cache duration.
 * @param {boolean} sync - the cache type, sync or async.
 */
const getCache = ({ dir, namespace, duration, sync=false }) => {
    return new Cache({ 
        dir, 
        namespace, 
        duration, 
        sync
    });
}

export { routeFactory, routeOptions, getCache, getCacheKey, coerceToArray }