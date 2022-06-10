'use strict'

const config = require('config');

/* 
 * prepare and connect to the database
 */
const Database = require('better-sqlite3');
const db = new Database(config.get('db.treatments'));

/* 
 * ATTACH external databases
 * https://github.com/JoshuaWise/better-sqlite3/issues/102#issuecomment-369468174
 * 
 */
const gbifcollections = config.get('db.gbifcollections');
db.prepare(`ATTACH DATABASE '${gbifcollections}' AS gbifcollections`).run();

const facets = config.get('db.facets');
db.prepare(`ATTACH DATABASE '${facets}' AS facets`).run();

const stats = config.get('db.stats');
db.prepare(`ATTACH DATABASE '${stats}' AS stats`).run();

const { logger } = require('../../lib/utils');
const log = logger('API:V3:UTILS');

const uriZenodo = config.get('url.zenodo');
const uriZenodeo = config.get('url.zenodeo');

const fetch = require('node-fetch');
const { zql } = require('../../lib/zql/');
const crypto = require('crypto');

//const JSON5 = require('json5');

const isDebug = config.get('isDebug');
const sqlFormatter = require('sql-formatter-plus');
const cacheOn = config.get('v3.cache.on');
const ttl = config.get('v3.cache.ttl');
const cacheBase = config.get('v3.cache.base');
const acf = require('../../lib/abstract-cache-file');

const resources = require('./resources.js');
const { getSourceOfResource } = require('../../data-dictionary/dd-utils');

/*
 * handlerFactory takes a resource and returns a handler
 * function for that resource. This handler function is 
 * used in the route to handle a request and send a response
 */
const handlerFactory = (resource) => {

    /*
     * request: the request object from a client
     * reply: a fastify object
     * result: the output from querying the datastore
     * response: packaged result that is sent back
     */
    return async function(request, reply) {
        log.info(`handler() -> fetching ${resource} from "${request.url}"`);

        const params = request.query;
        const _links = makeLinks(request);
        updateStats(_links._self);

        let res;

        if (resource === 'root') {
            res = getRoot();
        }
        else if (resource === 'etlstats') {
            res = getEtlStats(request, params);
        }
        else {
            const obj = { request, resource, params, _links };

            if (cacheOn) {
                log.info("handler() -> cache is on")
                
                /* 
                 * create a reference to the cache
                 */
                const cache = acf({
                    base: cacheBase,
                    segment: resource
                })
 
                const cacheKey = getCacheKey(_links._self);

                if ('refreshCache' in params && params.refreshCache) {
                    log.info("handler() -> forcing refresh cache");

                    removeFromCache(cacheKey, cache);
                    res = await queryDataStore(obj);

                    if (res.response) {
                        storeInCache(res.response, cacheKey, cache);
                        addDebug(res.response, res.debug);
                    }
                }
                else {
                    res = await checkCache(cacheKey, cache);
                    
                    if (res.response) {
                        log.info("handler() -> found result in cache");
                        res.response.cacheHit = true;
                    }
                    else {
                        log.info("handler() -> no result in cache");
                        res = await queryDataStore(obj);

                        if (res.response) {
                            storeInCache(res.response, cacheKey, cache);
                            addDebug(res.response, res.debug);
                        }
                    }
                }
            }
            else {
                log.info("handler() -> cache is off");
                res = await queryDataStore(obj);
            }
        }

        return res.response;
    }
}

const updateStats = (_self) => {
    const sql = `INSERT INTO webqueries (q) 
VALUES (@q) 
ON CONFLICT(q) 
DO UPDATE SET count = count + 1`;

    try {
        db.prepare(sql).run({ q: _self });
    }
    catch(error) {
        log.error(sql);
        throw error;
    }
}

const getCacheKey = function(_self) {
    log.info(`getCacheKey() -> creating key for ${_self}`);

    const cacheKey = crypto
        .createHash('md5')
        .update(_self)
        .digest('hex');

    log.info(`getCacheKey() -> generated key ${cacheKey}`);
    
    return cacheKey;
}

const getSearch = function(request) {
    log.info("getSearch() -> getting search criteria")

    const originalSearchParams = new URLSearchParams(request.url)
    if (originalSearchParams.has('refreshCache')) {
        originalSearchParams.delete('refreshCache');
    }

    const search = {}
    originalSearchParams.forEach((value, name) => {
        search[name] = value
    })

    return search
}

const _sqlRunner = function(sql, runparams) {
    try {
        let t = process.hrtime()
        
        const res = db.prepare(sql).all(runparams)
        t = process.hrtime(t)

        return {
            res,

            /* 
             * 't' is an array of seconds and nanoseconds
             * convert 't' into ms 
             */
            runtime: Math.round((t[0] * 1000) + (t[1] / 1000000))
        }

    }
    catch(error) {
        log.error(sql);
        throw error;
    }
}

const formatDebug = (debug, queryType, sql, runparams, runtime) => {
    if (isDebug) {
        const params = {}
        for (let [k, v] of Object.entries(runparams)) {
            if (typeof(v) === 'string') {
                params[k] = "'" + v + "'";
            }
            else {
                params[k] = v;
            }
        }

        let formattedSql = sqlFormatter.format(sql, { params });
        formattedSql = formattedSql.replace(/\n\s*/g, ' ');
        debug[queryType] = { 
            query: formattedSql, 
            runtime
        }
    }
}

const getDataFromZenodeo = async (resource, params) => {
    log.info('getDataFromZenodeo() -> getting data from Zenodeo');
    const { queries, runparams } = zql({ resource, params });
    const { res, runtime } = _sqlRunner(queries.main.count, runparams);
    const result = {}
    const debug = {}

    result.count = res[0].num_of_records;
    
    formatDebug(debug, 'countQuery', queries.main.count, runparams, runtime);

    if (result.count) {
        if (queries.main.full) {
            const { res, runtime } = _sqlRunner(queries.main.full, runparams);
            
            result.records = res;
            formatDebug(
                debug, 
                'fullQuery', 
                queries.main.full, 
                runparams, 
                runtime
            );
        }

        if (queries.related) {
            result['related-records'] = {}
            debug['related-records'] = {}

            for (let [relatedRecord, sql] of Object.entries(queries.related)) {            
                const { res, runtime } = _sqlRunner(sql.full, runparams);
                result['related-records'][relatedRecord] = res;
                formatDebug(
                    debug['related-records'], 
                    relatedRecord, 
                    sql.full, 
                    runparams, 
                    runtime
                );
            }
        }

        if (queries.facets) {
            result.facets = {}
            debug.facets = {}

            for (let [facet, sql] of Object.entries(queries.facets)) {
                const { res, runtime } = _sqlRunner(sql, runparams)
                result.facets[facet] = res
                formatDebug(debug.facets, facet, sql, runparams, runtime);
            }
        }
    }

    return { result, debug }
}

const getDataFromZenodo = async (resource, params) => {

    /*
     * add type by removing the last 's' from resource name
     * images -> image
     * publications -> publication
     */
    params.type = resource.slice(0, -1);

    /*
     * the following params can have duplicate k,v pairs,
     * but come in as arrays in params. So we save them, 
     * and later add them back as duplicated keys. These 
     * vars will be created *only* if they exist in params
     */
    const communities = params.communities;
    const subtypes = params.subtype;
    const keywords = params.keywords;
    
    // remove the following params
    const remove = [ 
        'refreshCache', 
        'facets', 
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

    // add duplicate keys, if needed
    if (communities) {
        communities.forEach(v => qs.append('communities', v));
    }
    
    if (subtypes) {
        subtypes.forEach(v => qs.append('subtype', v));
    }

    if (keywords) {
        keywords.forEach(v => qs.append('keywords', v));
    }
    
    const uriRemote = qs ? `${uriZenodo}?${qs}` : uriZenodo;

    /* 
     * examples of uriRemote 
     *
     * https://zenodo.org/api/records/?communities=biosyslit&communities=belgiumherbarium&page=1&size=30&type=image
     * https://zenodo.org/api/records/?sort=mostrecent&subtype=figure&subtype=photo&subtype=drawing&subtype=diagram&subtype=plot&subtype=other&communities=biosyslit&communities=belgiumherbarium&type=image&page=1&size=30
     *
     */

    log.info(`getDataFromZenodo() -> getting ${resource} from ${uriRemote}`)

    const result = {}
    const debug = {}

    try {
        let t = process.hrtime()
        const res = await fetch(uriRemote)

        // if HTTP-status is 200-299
        if (res.ok) {
            const payload = await res.text()
            const json = JSON.parse(payload)
            t = process.hrtime(t)

            result.count = json.hits.total
            result.records = json.hits.hits

            if (isDebug) {
                const runtime = Math.round((t[0] * 1000) + (t[1] / 1000000))
                debug.countQuery = '',
                debug.fullQuery = { sql: params, runtime }
            }
        } 
        else {
            request.log.info("HTTP-Error: " + response.status)
            return {}
        }
    }
    catch (error) {
        log.error(error)
        return {}
    }

    return { result, debug }
}

const getRoot = () => {
    const response = {
        item: {
            'search-criteria': {},
            'num-of-records': resources.length,
            _links: { _self: { href: `${uriZenodeo}/` }},
            records: resources
                .map(el => {
                    return {
                        name: el.name,
                        description: el.description,
                        url: `${uriZenodeo}/${el.url}`
                    }
                })
        },
        stored: null,
        ttl: null
    };

    const debug = {};
    return { response, debug };
}

const getEtlStats = (request, params) => {
    log.info('getEtlStats() -> getting etl stats from Zenodeo');

    let query = `SELECT
    typeOfArchive,
    datetime(timeOfArchive/1000, 'unixepoch') AS timeOfArchive, 
    datetime(Max(started)/1000, 'unixepoch') AS started, 
    datetime(ended/1000, 'unixepoch') AS ended, 
    (ended - started)/1000 AS duration,
    json_extract(result,'$.treatments') AS treatments,
    json_extract(result,'$.materialsCitations') AS materialsCitations,
    json_extract(result,'$.figureCitations') AS figureCitations,
    json_extract(result,'$.treatmentCitations') AS treatmentCitations,
    json_extract(result,'$.bibRefCitations') AS bibRefCitations
FROM
    etlstats
WHERE
    0=0`;

    const runparams = {};

    if (params.typeOfArchive) {
        query += ` AND typeOfArchive = @typeOfArchive`;
        runparams.typeOfArchive = params.typeOfArchive;
    }
    
    const { res, runtime } = _sqlRunner(query, runparams);
    const result = {}
    const debug = {}

    result.count = 1;
    result.records = res;
    formatDebug(debug, 'fullQuery', query, runparams, runtime);

    return { response: result, debug }
}

/*
 * A resource on Zenodo is queried using `fetch`
 * as opposed to a resource on Zenodeo that uses SQL
 */
const dispatch = {
    zenodeo: getDataFromZenodeo,
    zenodo: getDataFromZenodo
}

const queryDataStore = async function({ request, resource, params, _links }) {
    log.info("queryDataStore() -> querying the data store");

    const sourceOfResource = getSourceOfResource(resource);
    const fn = dispatch[sourceOfResource];
    const { result, debug } = await fn(resource, params);
    const response = packageResult(request, result, _links);
    return { response, debug };
}

const checkCache = async function(cacheKey, cache) {
    log.info(`checkCache() -> checking cache for key ${cacheKey}`);
    return await cache.get(cacheKey);
}

const storeInCache = function(response, cacheKey, cache) {
    log.info(`storeInCache() -> storing result in cache under key ${cacheKey}`)
    cache.set(cacheKey, response);
}

const removeFromCache = function(cacheKey, cache) {
    log.info(`removeFromCache() -> removing key ${cacheKey} from cache`);
    cache.delete(cacheKey);
}

const _pruneLink = function(query) {
    const searchParams = new URLSearchParams(query);
    searchParams.delete('deleted');

    if (searchParams.get('facets') === 'false') {
        searchParams.delete('facets');
    }

    if (searchParams.has('refreshCache')) {
        searchParams.delete('refreshCache');
    }

    return searchParams;
}

const makeLinks = function(request) {
    const self = _pruneLink(request.query);
    self.sort();
    
    const prev = _pruneLink(request.query);
    let newval = prev.get('page') > 1 ? prev.get('page') - 1 : 1;
    prev.set('page', newval);
    prev.sort();

    const next = _pruneLink(request.query);
    newval = next.get('page') > 1 ? Number(next.get('page')) + 1 : 2;
    next.set('page', newval);
    next.sort();

    return {
        "_self": self.toString(),
        "_prev": prev.toString(),
        "_next": next.toString()
    }
}

// This is where the result becomes a response
const packageResult = function(request, result, _links) {
    log.info('packageResult() -> packaging results for delivery') 

    const host = `${request.protocol}://${request.hostname}${request.routerPath}`;
    _links._self = `${host}?${_links._self}`;
    _links._prev = `${host}?${_links._prev}`;
    _links._next = `${host}?${_links._next}`;

    const item = {
        search: getSearch(request),
        result,
        _links
    }

    const response = {
        item,
        stored: Date.now(),
        ttl
    }

    return response
}

const addDebug = function(response, debug) {
    if (isDebug && debug) {
        log.info('addDebug() -> adding debug info') 
        response.debug = debug
    }
}

module.exports = { handlerFactory };