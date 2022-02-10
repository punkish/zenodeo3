'use strict'

const util = require('util');
const config = require('config');

/* 
 * prepare and connect to the database
 *
 * ATTACH external databases
 * https://github.com/JoshuaWise/better-sqlite3/issues/102#issuecomment-369468174
 * 
 */
const Database = require('better-sqlite3');
const db = new Database(config.get('db.treatments'));
db.prepare(`ATTACH DATABASE '${config.get('db.gbifcollections')}' AS gbifcollections`).run();
db.prepare(`ATTACH DATABASE '${config.get('db.facets')}' AS facets`).run();

const { logger } = require('../../lib/utils');
const log = logger('API:V3:UTILS');

const uriZenodo = config.get('url.zenodo');
const uriZenodeo = config.get('url.zenodeo');

const fetch = require('node-fetch');
const {zql} = require('../../lib/zql/');
const crypto = require('crypto');

const JSON5 = require('json5');

const isDebug = config.get('isDebug');
const sqlFormatter = require('sql-formatter-plus');
const cacheOn = config.get('v3.cache.on');
const cacheDuration = config.get('v3.cache.duration');
const cacheBase = config.get('v3.cache.base');
const acf = require('../../lib/abstract-cache-file');

const { getSourceOfResource } = require('../../data-dictionary/dd-utils');

// resource: the resource being requested; maps to a SQL table
const handlerFactory = (resource) => {

    /*
     * request: the request object from a client
     * reply: a fastify object
     * result: the output of querying the datastore
     * response: packaged result that is sent back
     */
    return async function(request, reply) {
        log.info(`handler() -> fetching ${resource} from "${request.url}"`)

        const params = request.query
        let response

        if (cacheOn) {
            log.info("handler() -> cache is on")
            
            // a reference to the cache
            const cache = acf({
                base: cacheBase,
                segment: resource,
                duration: cacheDuration
            })

            const cacheKey = getCacheKey(request, resource)
        
            if ('refreshCache' in params && params.refreshCache) {
                log.info("handler() -> forcing refresh cache");
                removeFromCache(cacheKey, cache);
                response = await queryDataStoreAndCacheResult(request, resource, params, cacheKey, cache);
            }
            else {
                response = await checkCache(cacheKey, cache);
                
                if (response) {
                    log.info("handler() -> found result in cache");
                }
                else {
                    log.info("handler() -> no result in cache");
                    response =  await queryDataStoreAndCacheResult(request, resource, params, cacheKey, cache);
                }
            }
        }
        else {
            log.info("handler() -> cache is off");
            response = await queryDataStore(request, resource, params);
        }

        return response;
    }
}

const getOriginalSearchParams = function(request) {
    const p = request.context.config.url;
    const u = request.url;
    const originalSearchParams = new URLSearchParams(u.replace(`${p}?`, ''));
    if (originalSearchParams.has('refreshCache')) {
        originalSearchParams.delete('refreshCache');
    }

    return originalSearchParams;
}

// const _sort = function(url) {
//     const dollar = {}
//     const plain = {}
//     url.forEach((value, name) => {
//         if (name.substring(0) === '$') {
//             dollar[name] = value
//         }
//         else {
//             plain[name] = value
//         }
//     })

//     const obj = {}
//     Object.keys(plain).sort().reverse().forEach(k => obj[k] = plain[k])
//     Object.keys(dollar).sort().reverse().forEach(k => obj[k] = plain[k])

//     return new URLSearchParams(obj)
// }

const getCacheKey = function(request, resource) {
    const self = _pruneLink(request.query);
    self.sort();
    const _self = `${resource}/${self.toString()}`;

    log.info(`getCacheKey() -> creating key for ${_self}`)

    const cacheKey = crypto
        .createHash('md5')
        .update(_self)
        .digest('hex')

    log.info(`getCacheKey() -> sending key ${cacheKey}`)
    return cacheKey
}

const getSearch = function(request) {
    log.info("getSearch() -> getting search criteria")
    const originalSearchParams = getOriginalSearchParams(request)

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

            // 't' is an array of seconds and nanoseconds
            // convert 't' into ms 
            runtime: Math.round((t[0] * 1000) + (t[1] / 1000000))
        }

    }
    catch(error) {
        console.log(sql);
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

const getDataFromZenodeo = async function(resource, params) {
    log.info('getDataFromZenodeo() -> getting data from Zenodeo');
    const { queries, runparams } = zql({ resource, params });
    //console.log(queries)
    const { res, runtime } = _sqlRunner(queries.main.count, runparams);
    const result = {}
    const debug = {}

    result.count = res[0].num_of_records;
    
    formatDebug(debug, 'countQuery', queries.main.count, runparams, runtime);

    if (result.count) {
        if (queries.main.full) {
            const { res, runtime } = _sqlRunner(queries.main.full, runparams);
            
            result.records = res;
            formatDebug(debug, 'fullQuery', queries.main.full, runparams, runtime);
        }

        if (queries.related) {
            result['related-records'] = {}
            debug['related-records'] = {}

            for (let [relatedRecord, sql] of Object.entries(queries.related)) {            
                const { res, runtime } = _sqlRunner(sql.full, runparams);
                result['related-records'][relatedRecord] = res;
                formatDebug(debug['related-records'], relatedRecord, sql.full, runparams, runtime);
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
    log.info('getDataFromZenodo() -> getting data from Zenodo')

    // clean up request.query
    const qp = JSON5.parse(JSON5.stringify(params));

    // add type by removing the last 's' from resource name
    // images -> image
    // publications -> publication
    qp.type = resource.slice(0, -1);
    qp.communities = 'biosyslit';
    
    // remove the following params
    const remove = [ 'refreshCache', 'facets', 'stats', 'sortby' ];
    remove.forEach(p => {
        if (p in qp) {
            delete qp[p]
        }
    })

    // remove '$' from the following params
    // const remove$ = [ '$page', '$size' ]
    // remove$.forEach(p => {
    //     if (p in qp) {
    //         qp[ p.substring(1) ] = qp[p]
    //         delete qp[p]
    //     }
    // })

    const qs = new URLSearchParams(qp)
    const uriRemote = qs ? `${uriZenodo}?${qs}` : uriZenodo

    // uriRemote should be
    // https://zenodo.org/api/records/?communities=biosyslit&page=1&size=30&type=image&communities=belgiumherbarium

    // https://zenodo.org/api/records/?sort=mostrecent&subtype=figure&subtype=photo&subtype=drawing&subtype=diagram&subtype=plot&subtype=other&communities=biosyslit&communities=belgiumherbarium&type=image&page=1&size=30

    log.info(`getDataFromZenodo() -> getting ${resource} from <${uriRemote}>`)

    const result = {}
    const debug = {}

    try {
        let t = process.hrtime()
        const res = await fetch(uriRemote)

        // if HTTP-status is 200-299
        if (res.ok) {
            const payload = await res.text()
            const json = JSON5.parse(payload)
            t = process.hrtime(t)

            result.count = json.hits.total
            result.records = json.hits.hits

            if (isDebug) {
                const runtime = Math.round((t[0] * 1000) + (t[1] / 1000000))
                debug.countQuery = '',
                debug.fullQuery = { sql: qp, runtime }
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

// A resource on Zenodo is queried differntly (using `fetch`)
// as opposed to a resource on Zenodeo (using `SQL`)
const dispatch = {
    zenodeo: getDataFromZenodeo,
    zenodo: getDataFromZenodo
}

const queryDataStore = async function(request, resource, params) {
    log.info("queryDataStore() -> querying the data store")

    const sourceOfResource = getSourceOfResource(resource)
    const { result, debug } = await dispatch[ sourceOfResource ](resource, params)
    const response = packageResult(request, result)
    return { response, debug }
}

const queryDataStoreAndCacheResult = async function(request, resource, params, cacheKey, cache) {
    const { response, debug } =  await queryDataStore(request, resource, params)
    if (response) {
        storeInCache(response, cacheKey, cache)
        addDebug(response, debug)
        return response
    }
    else {
        return false
    }
}

const checkCache = async function(cacheKey, cache) {
    log.info(`checkCache() -> checking cache for key ${cacheKey}`)
    return await cache.get(cacheKey)
}

const storeInCache = function(response, cacheKey, cache) {
    log.info(`storeInCache() -> storing result in cache under key ${cacheKey}`)
    cache.set(cacheKey, response)
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
    prev.set('page', prev.get('page') > 1 ? prev.get('page') - 1 : 1);
    prev.sort();

    const next = _pruneLink(request.query);
    next.set('page', next.get('page') > 1 ? Number(next.get('page')) + 1 : 2);
    next.sort();

    const host = `${request.protocol}://${request.hostname}${request.routerPath}`;
    return {
        "_self": `${host}?${self.toString()}`,
        "_prev": `${host}?${prev.toString()}`,
        "_next": `${host}?${next.toString()}`
    }
}

// This is where the result becomes a response
const packageResult = function(request, result) {
    log.info('packageResult() -> packaging results for delivery') 

    const item = {
        search: getSearch(request),
        result,
        _links: makeLinks(request)
    }

    const response = {
        item,
        stored: Date.now(),
        ttl: cacheDuration
    }

    return response
}

const addDebug = function(response, debug) {
    if (isDebug && debug) {
        log.info('addDebug() -> adding debug info') 
        response.debug = debug
    }
}

// const request = {
//     context: {
//         config: {
//             url: '/v3/families'
//         }
//     },
//     url: "/v3/families?q=for",
//     query: {
//         q: 'for',
//         //'$refreshCache': true,
//         //'$facets': false,
//         // '$page': 2,
//         // '$size': 30,
//         //'$sortby': 'id:ASC',
//         //'$cols': [ 'treatmentTitle' ]
//     }
// }

// const reply = null
// const handler = handlerFactory('families');
// (async function () {
//     const response = await handler(request, reply)
//     console.log(util.inspect(response, {showHidden: false, depth: null, colors: true}))
//     //console.log(response)
// })()

module.exports = { handlerFactory }