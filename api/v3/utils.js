'use strict';

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

const isDebug = config.get('isDebug');
const sqlFormatter = require('sql-formatter-plus');
const importCache = async ({ dir, namespace, ttl, sync }) => {
    const { Cache } = await import('@punkish/zcache');
    return new Cache({ 
        dir,
        namespace, 
        ttl,
        sync 
    });
}

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

        const reqres = { request, resource };
        updateStats(reqres);
        let response;

        if (resource === 'root') {
            response = getRoot(reqres);
        }
        else if (resource === 'etlstats') {
            response = getEtlStats(reqres);
        }
        else {
            if (config.get('v3.cache.on')) {
                log.info("handler() -> cache is on");
                
                /* 
                 * create a reference to the cache
                 */
                const cache = await importCache({ 
                    dir: config.get('v3.cache.base'), 
                    namespace: resource, 
                    ttl: config.get('v3.cache.ttl'), 
                    sync: false
                });
 
                const _links = makeLinks(reqres);
                const cacheKey = crypto
                    .createHash('md5')
                    .update(_links._self)
                    .digest('hex');

                if (request.query.refreshCache) {
                    log.info("handler() -> forcing refresh cache");

                    await cache.delete(cacheKey);
                    const { result, debug } = await queryDataStore(reqres);

                    response = addLinksAndSearch(result);
                    response = await cache.set(cacheKey, response);

                    if (isDebug) response.debug = debug;
                }
                else {
                    log.info("handler() -> checking cache")
                    response = await cache.get(cacheKey);

                    if (response) {
                        log.info("handler() -> found result in cache");
                        response.cacheHit = true;
                    }
                    else {
                        log.info("handler() -> no result in cache");
                        const { result, debug } = await queryDataStore(reqres);
                        response = addLinksAndSearch(result);
                        response = await cache.set(cacheKey, response);

                        if (isDebug) response.debug = debug;
                    }
                }
            }
            else {
                log.info("handler() -> cache is off");
                const { result, debug } = await queryDataStore(reqres);
                response = result;

                if (isDebug) response.debug = debug;
            }
        }

        return response;
    }
}

const addLinksAndSearch = (result) => {

    /*
     * add _links
     */
    const h = `${request.protocol}://${request.hostname}${request.routerPath}`;
    _links._self = `${h}?${_links._self}`;
    _links._prev = `${h}?${_links._prev}`;
    _links._next = `${h}?${_links._next}`;

    /*
     * add search
     */
    const search = getSearch(request);

    return { search, result, _links }
}

const updateStats = ({ request, resource }) => {
    const sql = `INSERT INTO webqueries (q) 
VALUES (@q) 
ON CONFLICT(q) 
DO UPDATE SET count = count + 1`;

    const _links = makeLinks({ request, resource });
    const q = _links._self;

    try {
        db.prepare(sql).run({ q });
    }
    catch(error) {
        log.error(sql);
        throw error;
    }
}

const getSearch = function({ request, resource }) {
    log.info("getSearch() -> getting search criteria");

    const originalSearchParams = new URLSearchParams(request.url.split('?')[1]);
    
    if (originalSearchParams.has('refreshCache')) {
        originalSearchParams.delete('refreshCache');
    }

    const search = {};
    originalSearchParams.forEach((value, name) => {
        search[name] = value;
    })

    return search;
}

const _sqlRunner = function(sql, runparams) {
    try {
        let t = process.hrtime();
        const res = db.prepare(sql).all(runparams);
        t = process.hrtime(t);

        return {
            res,

            /* 
             * 't' is an array of seconds and nanoseconds.
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
    //if (isDebug) {
        const params = {};

        for (let [k, v] of Object.entries(runparams)) {
            params[k] = typeof(v) === 'string' ? `'${v}'` : v;
        }

        let query = sqlFormatter.format(sql, { params });
        query = query.replace(/\n\s*/g, ' ');
        debug[queryType] = { query, runtime };
    //}
}

const getDataFromZenodeo = async ({ request, resource }) => {
    log.info('getDataFromZenodeo() -> getting data from Zenodeo');
    const params = request.query;
    const { queries, runparams } = zql({ resource, params });
    const { res, runtime } = _sqlRunner(queries.main.count, runparams);
    const result = {};
    const debug = {};

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
            result['related-records'] = {};
            debug['related-records'] = {};

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
            result.facets = {};
            debug.facets = {};

            for (let [facet, sql] of Object.entries(queries.facets)) {
                const { res, runtime } = _sqlRunner(sql, runparams);
                result.facets[facet] = res;
                formatDebug(debug.facets, facet, sql, runparams, runtime);
            }
        }
    }

    return { result, debug };
}

const getDataFromZenodo = async ({ request, resource }) => {
    const params = request.query;

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

    /* 
     * add duplicate keys, as needed… see above for communities, 
     * subtypes and keywords
     */
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

    const result = {};
    const debug = {};

    try {
        let t = process.hrtime();
        const res = await fetch(uriRemote);

        /* 
         * if HTTP-status is 200-299
         */
        if (res.ok) {
            const payload = await res.text();
            const json = JSON.parse(payload);
            t = process.hrtime(t);

            result.count = json.hits.total;
            result.records = json.hits.hits;

            if (isDebug) {
                const runtime = Math.round((t[0] * 1000) + (t[1] / 1000000));
                debug.countQuery = '';
                debug.fullQuery = { sql: params, runtime };
            }
        } 
        else {
            request.log.info("HTTP-Error: " + response.status);
            return {};
        }
    }
    catch (error) {
        log.error(error);
        return {};
    }

    return { result, debug };
}

const getRoot = ({ request, resource }) => {
    const resources = require('./resources.js');

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

const getEtlStats = ({ request, resource }) => {
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

    const params = request.query;
    const runparams = {};

    if (params.typeOfArchive) {
        query += ` AND typeOfArchive = @typeOfArchive`;
        runparams.typeOfArchive = params.typeOfArchive;
    }
    
    const { res, runtime } = _sqlRunner(query, runparams);
    const response = {};
    const debug = {};

    response.count = 1;
    response.records = res;
    formatDebug(debug, 'fullQuery', query, runparams, runtime);

    return { response, debug };
}

/*
 * queries the datastore and returns { result, debug }
 */
const queryDataStore = async function({ request, resource }) {
    log.info("queryDataStore() -> querying the data store");

    /*
     * A resource on Zenodo is queried using `fetch`
     * as opposed to a resource on Zenodeo that uses SQL
     */
    const sourceOfResource = getSourceOfResource(resource);
    return await sourceOfResource === 'zenodeo'
        ? getDataFromZenodeo({ request, resource })
        : getDataFromZenodo({ request, resource });
}

const pruneQuery = function(query) {
    const searchParams = new URLSearchParams(query);
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

    return searchParams;
}

const makeLinks = function({ request, resource }) {
    const originalRequest = new URLSearchParams(request.url.split('?')[1]);
    const self = pruneQuery(originalRequest);
    self.sort();
    
    const prev = pruneQuery(originalRequest);
    let newval = prev.get('page') > 1 ? prev.get('page') - 1 : 1;
    prev.set('page', newval);
    prev.sort();

    const next = pruneQuery(originalRequest);
    newval = next.get('page') > 1 ? Number(next.get('page')) + 1 : 2;
    next.set('page', newval);
    next.sort();

    return {
        "_self": self.toString(),
        "_prev": prev.toString(),
        "_next": next.toString()
    }
}

module.exports = { handlerFactory };