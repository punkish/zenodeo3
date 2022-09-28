import { dispatch as ddutils } from '../data-dictionary/dd-utils.js';
import { resources } from '../data-dictionary/resources.js';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;
import { zql } from './zql/index.js';
import { Cache } from '@punkish/zcache';
import crypto from 'crypto';
import * as utils from './utils.js';
import https from 'https';
import process from 'node:process';

/** 
 * connect to the database and ATTACH external databases
 * https://github.com/JoshuaWise/better-sqlite3/issues/102#issuecomment-369468174
 * 
**/
import Database from 'better-sqlite3';
const db = new Database(config.db.treatments);

const gbifcollections = config.db.gbifcollections;
db.prepare(`ATTACH DATABASE '${gbifcollections}' AS gbifcollections`).run();

const facets = config.db.facets;
db.prepare(`ATTACH DATABASE '${facets}' AS facets`).run();

const stats = config.db.stats;
db.prepare(`ATTACH DATABASE '${stats}' AS stats`).run();

const routeFactory = (resourceName) => {
    const resource = resources.filter(r => r.name === resourceName)[0];
    const options = routeOptions(resource);

    return async function route(fastify) {
        fastify.route(options);
    }
}

const routeOptions = (resource) => {
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
                properties: ddutils.getQueryStringSchema(resource.name)
            },
            tags: resource.tags
        },
        handler: routeHandler(resource.name)
    }
}

const routeHandler = (resourceName) => async (request) => {

    /**
     * by declaring the structure of the response object upfront,
     * we ensure that the order of the keys is predictable and 
     * sensible
    **/
    const response = {
        item: {},
        stored: 0,
        ttl: 0
    };

    let res;
    if (config.cache.on) {
        request.log.info("cache is on");

        /** 
         * get a reference to the cache
        **/
        const cache = await new Cache({ 
            dir: config.cache.base, 
            namespace: resourceName, 
            duration: config.cache.ttl, 
            sync: false
        });

        const cacheKey = getCacheKey(request);

        if (request.query.refreshCache) {
            request.log.info("delete cache");
            await cache.delete(cacheKey);
            const { result, debug } = await queryDataStore({ request, resource: resourceName });

            const _links = makeLinks(request);
            const search = getSearch(request);
            res = await cache.set(cacheKey, { search, result, _links });

            if (config.isDebug) {
                response.debug = debug;
            }

            response.item = res.item;
            response.stored = res.stored;
            response.ttl = res.ttl;
        }
        else {
            let res = await cache.get(cacheKey);

            if (res) {
                response.cacheHit = true;
            }
            else {
                const { result, debug } = await queryDataStore({ request, resource: resourceName });
                const _links = makeLinks(request);
                const search = getSearch(request);
                res = await cache.set(cacheKey, { search, result, _links }); 

                if (config.isDebug) {
                    response.debug = debug;
                }
            }

            response.item = res.item;
            response.stored = res.stored;
            response.ttl = res.ttl;
        }
    }
    else {
        const { result, debug } = await queryDataStore({ request, resource: resourceName });

        /** 
         * cache is off so let's remove 'stored' and 'ttl' from response
        **/
        delete(response.stored);
        delete(response.ttl);

        response.item.search = getSearch(request);
        response.item.result = result;
        response.item._links = makeLinks(request);

        if (config.isDebug) {
            response.debug = debug;
        }
    }

    return response;
}

const getCacheKey = (request) => {
    const searchParams = new URLSearchParams(request.origQuery);
    searchParams.delete('deleted');

    if (searchParams.get('facets') === 'false') {
        searchParams.delete('facets');
    }

    if (searchParams.get('relatedRecords') === 'false') {
        searchParams.delete('relatedRecords');
    }

    if (searchParams.has('refreshCache')) {
        searchParams.delete('refreshCache');
    }

    searchParams.sort();
    
    return crypto
        .createHash('md5')
        .update(searchParams.toString())
        .digest('hex')
}

const queryDataStore = async ({ request, resource }) => {

    /**
     * A resource on Zenodo is queried using `fetch`
     * as opposed to a resource on Zenodeo that uses SQL
    **/
    const sourceOfResource = ddutils.getSourceOfResource(resource);
    if (sourceOfResource === 'zenodeo') {
        return await getDataFromZenodeo({ request, resource });
    }
    else {
        return await getDataFromZenodo({ request, resource });
    }
}

const _sqlRunner = function(sql, runparams) {
    try {
        let t = process.hrtime();
        const res = db.prepare(sql).all(runparams);
        t = process.hrtime(t);
        return { res, runtime: utils.timerFormat(t) }
    }
    catch(error) {
        console.log(sql);
        throw error;
    }
}

const getDataFromZenodeo = async ({ request, resource }) => {
    const params = request.query;
    const { queries, runparams } = zql({ resource, params });

    /**
     * first, we run the count SQL query to see if there are any 
     * records for the given REST query
    **/
    const { res, runtime } = _sqlRunner(queries.count, runparams);
    const result = {};
    const debug = {};

    result.count = res[0].num_of_records;

    if (config.isDebug) {
        debug.runparams = runparams;
        debug.count = { query: queries.count, runtime }
    }
    
    /**
     * There are records in the table for the REST query, 
     * so we perform the remaining queries
    **/
    if (result.count) {
        if (queries.full) {
            const { res, runtime } = _sqlRunner(queries.full, runparams);
            
            result.records = res;

            if (config.isDebug) {
                debug.full = { query: queries.full, runtime }
            }
        }

        if (queries.related) {
            result.relatedRecords = {};
            debug.relatedRecords = {};

            for (let [relatedRecord, sql] of Object.entries(queries.related)) { 
                const { res, runtime } = _sqlRunner(sql.full, runparams);
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
                const { res, runtime } = _sqlRunner(sql, runparams);
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
                const { res, runtime } = _sqlRunner(sql, runparams);
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
            const { res, runtime } = _sqlRunner(locSql, runparams);
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

const res2data = (result) => {
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

const getDataFromZenodo = async ({ request, resource }) => {
    const params = request.query;

    /**
     * add type by removing the last 's' from resource name
     * images -> image
     * publications -> publication
    **/
    params.type = resource.slice(0, -1);

    /**
     * the following params can have duplicate k,v pairs,
     * but come in as arrays in params. So we save them, 
     * and later add them back as duplicated keys. These 
     * vars will be created *only* if they exist in params
    **/
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

    /** 
     * add duplicate keys, as needed… see above for communities, 
     * subtypes and keywords
    **/
    if (communities) {
        communities.forEach(v => qs.append('communities', v));
    }
    
    if (subtypes) {
        subtypes.forEach(v => qs.append('subtype', v));
    }

    if (keywords) {
        keywords.forEach(v => qs.append('keywords', v));
    }
    
    /** 
     * examples of uriRemote 
     *
     * https://zenodo.org/api/records/?
     *      communities=biosyslit&
     *      communities=belgiumherbarium&
     *      page=1&
     *      size=30&
     *      type=image
     * 
     * https://zenodo.org/api/records/?
     *      sort=mostrecent&
     *      subtype=figure&
     *      subtype=photo&
     *      subtype=drawing&
     *      subtype=diagram&
     *      subtype=plot&
     *      subtype=other&
     *      communities=biosyslit&
     *      communities=belgiumherbarium&
     *      type=image&
     *      page=1&
     *      size=30
     *
    **/
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

            /**
             * Any 2xx status code signals a successful response but
             * here we're only checking for 200.
            **/
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

                /**
                 * Consume response data to free up memory
                **/
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

const getSearch = (request) => {
    const search = new URLSearchParams(request.origQuery);
    
    search.delete('refreshCache');
    return groupParamsByKey(search);
}

/**
 * How to convert URL parameters to a JavaScript object?
 * https://stackoverflow.com/a/52539264/183692
 * 
 * Multiple same keys
**/
 const groupParamsByKey = (params) => {

    const reduceFn = (acc, tuple) => {

        /**
         * get the key and value from each tuple 
        **/ 
        const [key, val] = tuple;
        //if (acc.hasOwnProperty(key)) {
        if (Object.prototype.hasOwnProperty.call(acc, key)) {
    
            /** 
             * if the current key is already an array, 
             * we'll add the value to it
            **/
            if(Array.isArray(acc[key])) {
                acc[key] = [...acc[key], val]
            }
    
            /**
             * if it's not an array, but contains a value, 
             * we'll convert it into an array and add the current 
             * value to it
            **/
            else {
                acc[key] = [acc[key], val];
            }
        } 
        else {
    
            /**
             * plain assignment if no special case is present
            **/
            acc[key] = val;
        }
       
       return acc;
    }

    return [...params.entries()].reduce(reduceFn, {});
}

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

export { routeFactory, routeOptions }