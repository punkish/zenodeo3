import { dispatch as ddutils } from '../data-dictionary/dd-utils.js';
import { config } from '../zconf/index.js';
import { zql } from './zql/index.js';
import { Cache } from '@punkish/zcache';
import crypto from 'crypto';
import got from 'got';
import { format } from 'sql-formatter';
import * as utils from './utils.js';

/** 
 * prepare and connect to the database
 */
import Database from 'better-sqlite3';
const db = new Database(config.db.treatments);

/** 
 * ATTACH external databases
 * https://github.com/JoshuaWise/better-sqlite3/issues/102#issuecomment-369468174
 * 
 */
const gbifcollections = config.db.gbifcollections;
db.prepare(`ATTACH DATABASE '${gbifcollections}' AS gbifcollections`).run();

const facets = config.db.facets;
db.prepare(`ATTACH DATABASE '${facets}' AS facets`).run();

const stats = config.db.stats;
db.prepare(`ATTACH DATABASE '${stats}' AS stats`).run();

const routeOptions = (resource) => {
    return {
        method: 'GET',
        url: `/${resource.name.toLowerCase()}`,
        schema: {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
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

const routeHandler = (resourceName) => async (request, reply) => {

    /**
     * by declaring the structure of the response object upfront,
     * we ensure that the order of the keys is predictable and 
     * sensible
     */
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
         */
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
         */
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
     */
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
        console.error(sql);
        throw error;
    }
}

const getDataFromZenodeo = async ({ request, resource }) => {
    const params = request.query;
    const { queries, runparams } = zql({ resource, params });
    const { res, runtime } = _sqlRunner(queries.main.count, runparams);
    const result = {};
    const debug = {};

    result.count = res[0].num_of_records;
    
    debug.countQuery = { query: queries.main.count, runtime }

    if (result.count) {
        if (queries.main.full) {
            const { res, runtime } = _sqlRunner(queries.main.full, runparams);
            
            result.records = res;
            debug.fullQuery = { query: queries.main.full, runtime }
        }

        if (queries.related) {
            result['related-records'] = {};
            debug['related-records'] = {};

            for (let [relatedRecord, sql] of Object.entries(queries.related)) {            
                const { res, runtime } = _sqlRunner(sql.full, runparams);
                result['related-records'][relatedRecord] = res;
                debug.relatedRecords = { query: sql.full, runtime }
            }
        }

        if (queries.facets) {
            result.facets = {};
            debug.facets = {};

            for (let [facet, sql] of Object.entries(queries.facets)) {
                const { res, runtime } = _sqlRunner(sql, runparams);
                result.facets[facet] = res;
                debug.facet = { query: sql, runtime }
            }
        }
    }

    return { result, debug };
}

const getDataFromZenodo = async ({ request, resource }) => {
    const params = request.query;

    /**
     * add type by removing the last 's' from resource name
     * images -> image
     * publications -> publication
     */
    params.type = resource.slice(0, -1);

    /**
     * the following params can have duplicate k,v pairs,
     * but come in as arrays in params. So we save them, 
     * and later add them back as duplicated keys. These 
     * vars will be created *only* if they exist in params
     */
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
    
    /** 
     * examples of uriRemote 
     *
     * https://zenodo.org/api/records/?communities=biosyslit&communities=belgiumherbarium&page=1&size=30&type=image
     * https://zenodo.org/api/records/?sort=mostrecent&subtype=figure&subtype=photo&subtype=drawing&subtype=diagram&subtype=plot&subtype=other&communities=biosyslit&communities=belgiumherbarium&type=image&page=1&size=30
     *
     */
    const uriRemote = qs 
        ? `${config.url.zenodo}?${qs}` 
        : config.url.zenodo;

    const result = {};
    const debug = {};

    try {
        let t = process.hrtime();
        const res = await got(uriRemote);
        
        const json = JSON.parse(res.body);
        t = process.hrtime(t);
        const runtime = utils.timerFormat(t);

        result.count = json.hits.total;
        result.records = json.hits.hits;

        if (config.isDebug) {
            debug.countQuery = '';
            debug.fullQuery = { query: uriRemote, runtime };
        }
    }
    catch (error) {
        console.error(error);
        return {};
    }

    return { result, debug };
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
 */
const groupParamsByKey = (params) => [...params.entries()].reduce((acc, tuple) => {

    /**
     * get the key and value from each tuple 
     */ 
    const [key, val] = tuple;
    if(acc.hasOwnProperty(key)) {

        /** 
         * if the current key is already an array, 
         * we'll add the value to it
         */
        if(Array.isArray(acc[key])) {
            acc[key] = [...acc[key], val]
        }

        /**
         * if it's not an array, but contains a value, 
         * we'll convert it into an array and add the current 
         * value to it
         */
        else {
            acc[key] = [acc[key], val];
        }
    } 
    else {

        /**
         * plain assignment if no special case is present
         */
        acc[key] = val;
    }
   
   return acc;
   }, {});

const makeLinks = (request) => {
    let [ url, search ] = request.url.substring(1).split('?');
    const sp = new URLSearchParams(search);

    const safeURIComponent = (uri) => {
        return decodeURIComponent(uri)
    }

    const _links = { 
        _self: `${config.url.zenodeo}/${url}?${safeURIComponent(search)}` 
    };

    let prev;
    let next;
    if (sp.has('page')) {
        const page = sp.get('page');
        sp.set('page', page - 1);
        prev = safeURIComponent(sp.toString());

        sp.set('page', parseInt(page) + 1);
        next = safeURIComponent(sp.toString());
    }
    else {
        sp.set('page', 1);
        prev = safeURIComponent(sp.toString());

        sp.set('page', 2);
        next = safeURIComponent(sp.toString());
    }

    _links._prev = `${config.url.zenodeo}/${url}?${prev}`;
    _links._next = `${config.url.zenodeo}/${url}?${next}`;
    return _links;
}

export { routeOptions }