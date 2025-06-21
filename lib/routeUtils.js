import { ddutils } from '../data-dictionary/utils/index.js';
import { resources } from '../data-dictionary/resources/index.js';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;
import { getDataFromZenodeo } from './dataFromZenodeo.js';
import { askZai } from './zai/index.js';
import { getQueryType } from './zql/z-utils/index.js';
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
 * The handler runs when the route is called. 
 * @param {string} resourceName - name of the resource.
 * @param {object} fastify - an instance of fastify.
 */
function routeHandler(resourceName, fastify) {

    return async function(request, reply) {
        const query = request.queryForCache;
        fastify.zlog.info(fastify.zlog.prefix(), query);
        const queryType = getQueryType({ 
            request, 
            resource: resourceName,
            params: request.query,
            fastify 
        });
        
        const resource = resourceName;
        const queryObj = { fastify, request, resource, query, queryType };
        const { response, debugInfo } = queryType.usesCache
            ? await getResultViaCache(queryObj)
            : await getResult(queryObj);

        makeLinks(request, response, queryType, fastify);
        addDebugInfo(response, debugInfo, queryType)

        if (queryType.usesCache) {
            fastify.zlog.info(fastify.zlog.prefix(), 'returning cached response');
            return response;
        }
        else {
            fastify.zlog.info(fastify.zlog.prefix(), 'returning uncached response');
            return { query, response };
        }
    }

}

/**
 * Runs the query via the cache, returning cached value if found, otherwise
 * querying the datasource, caching and then returning the results 
 * @param {object} fastify - an instance of fastify.
 * @param {object} request - request object.
 * @param {string} resource - name of the resource.
 * @param {object} query - search params suitable for converting to cacheKey.
 * @param {boolean} isSemantic - whether or not query is semantic'.
 */
async function getResult({ fastify, request, resource, queryType }) {

    if (request.query.heyzai) {
        fastify.zlog.info(fastify.zlog.prefix(), 'querying Zai');
        return await askZai({ request, fastify, queryType });
    }
    else if (request.query.cachedQueries) {
        return await getCachedQueries({ fastify, resource });
    }
    else {
        fastify.zlog.info(fastify.zlog.prefix(), 'querying datastore');
        return getDataFromZenodeo({ 
            request, 
            resource, 
            fastify,
            queryType
        });
    }

}

async function getResultViaCache({
    fastify, request, resource, query, queryType
}) {

    if (config.cache.on) {
        let response;
        let debugInfo;
        const segment = resource;
        const isSemantic = queryType.isSemantic;
        const queryObj = { segment, query, isSemantic };
        
        if (request.query.refreshCache) {
            fastify.zlog.info(fastify.zlog.prefix(), 'deleting cache');

            // delete result from cache 
            await fastify.cache.rm(queryObj);
        }
        else {
            fastify.zlog.info(fastify.zlog.prefix(), 'querying cache');

            // Check if the result is in the cache
            response = await fastify.cache.get(queryObj);
        }

        if (!response) {
            fastify.zlog.info(fastify.zlog.prefix(), 'no result in cache');

            // get the result from datastore
            const result = await getResult({ fastify, request, resource, queryType });
            queryObj.response = result.response;
            debugInfo = result.debugInfo;

            // Store the results in the cache
            response = await fastify.cache.set(queryObj);
            
        }

        return { response, debugInfo };
        
    }
    else {
        fastify.zlog.info(fastify.zlog.prefix(), 'cache is off');
        return await getResult({ fastify, request, resource, queryType });
    }
}


/**
 * Extract search object from the request. 
 * @param {object} request - the request object.
 */
const getSearch = (request) => {
    const search = new URLSearchParams(request.query);
    
    search.delete('refreshCache');
    return groupParamsByKey(search);
}

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

        // get the key and value from each tuple 
        //  
        const [key, val] = tuple;
        
        if (Object.prototype.hasOwnProperty.call(acc, key)) {
    
            // if the current key is already an array, 
            // we'll add the value to it
            // 
            if(Array.isArray(acc[key])) {
                acc[key] = [...acc[key], val]
            }
    
            // if it's not an array, but contains a value, 
            // we'll convert it into an array and add the current 
            // value to it
            // 
            else {
                acc[key] = [acc[key], val];
            }
        } 
        else {
    
            // plain assignment if no special case is present
            // 
            acc[key] = val;
        }
       
       return acc;
    }

    return [...params.entries()].reduce(reduceFn, {});
}

function addDebugInfo(response, debugInfo, queryType) {
    if (queryType.hasDebugInfo) {

        // add debugInfo
        response.debugInfo = debugInfo;
    }
}

/**
 * Construct _prev, _next and _self links. 
 * @param {object} request - the request object.
 */
const makeLinks = (request, response, queryType, fastify) => {
    if (queryType.hasLinks) {

        // _links are added only for non-zai requests
        fastify.zlog.info(fastify.zlog.prefix(), 'Adding links');

        const decode = (sp) => decodeURIComponent(sp.toString());
        let [ url, search ] = request.url.substring(1).split('?');
        const sp = new URLSearchParams(search);

        if (sp.has('refreshCache')) {
            sp.delete('refreshCache');
        }

        const _links = { 
            _self: `${config.url.zenodeo}/${url}?${decode(sp)}` 
        };

        let prev;
        let next;

        if (sp.has('page')) {
            const page = sp.get('page');
            sp.set('page', page - 1);
            prev = decode(sp);

            sp.set('page', parseInt(page) + 1);
            next = decode(sp);
        }
        else {
            sp.set('page', 1);
            prev = decode(sp);

            sp.set('page', 2);
            next = decode(sp);
        }

        _links._prev = `${config.url.zenodeo}/${url}?${prev}`;
        _links._next = `${config.url.zenodeo}/${url}?${next}`;
        response._links = _links;
    }
}

// We want to categorize queries depending on whether they bypass
// caching completely, whether or not debugInfo is appended,  
// if they are adorned with _links or not, and, whether or not they 
// are 'semantic'
//
// Never cached
// - cachedQueries
// - zai describe queries
//
// Cached
//      non-semantic queries
//      - normal db queries
//      Semantic queries
//      - zai llm queries
//
// never add _links
// - cachedQueries
// - zai describe queries
// - zai llm queries
// add links
// - db queries
//
// never add debugInfo
// - cachedQueries
// add debugInfo
// - db queries
function getQueryTypeOrig(request, fastify) {
    const queryType = {};

    if (request.query.heyzai) {

        // never add _links
        queryType.noLinks = true;

        // add debug info
        queryType.noDebugInfo = false;

        const qords = request.query.heyzai.split(' ');

        if (qords[0].toLowerCase() === 'describe') {

            // don't use cache
            queryType.noCache = true;
            queryType.isSemantic = false;
        }
        else {

            // use cache
            queryType.noCache = false;

            // are semantic
            queryType.isSemantic = true;
        }

    }
    else if (request.query.cachedQueries) {

        // never add _links
        queryType.noLinks = true;

        // don't cache the result
        queryType.noCache = true;

        // the query itself is not semantic 
        // (even though only semantic queries are retrieved)
        queryType.isSemantic = false;

        // don't add debugInfo
        queryType.noDebugInfo = true;
    }
    else {

        // db queries have _links, are cached, and have debugInfo
        queryType.noLinks = false;
        queryType.noCache = false;
        queryType.noDebugInfo = false;
        queryType.isSemantic = false;
    }

    fastify.zlog.info(fastify.zlog.prefix(), queryType);
    return queryType
}

async function getCachedQueries({ fastify, resource }) {
    fastify.zlog.info(fastify.zlog.prefix(), 'querying cachedQueries');

    const cachedQueries = await fastify.cache.queries({
        segment: resource,
        isSemantic: true
    });

    const response = {
        count: 0,
        records: null
    };

    if (cachedQueries) {
        response.count = cachedQueries.length;
        response.records = cachedQueries.map(c => c.response.question);
    }

    return { response, debugInfo: null }
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

export { routeFactory, routeOptions, coerceToArray }