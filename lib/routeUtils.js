import { ddutils } from '../data-dictionary/utils/index.js';
import { resources } from '../data-dictionary/resources/index.js';
import { getDataFromZenodeo } from './dataFromZenodeo.js';
import { askZai } from './zai/index.js';
import { getQueryType } from './utils.js';

/**
 * Takes a resourceName and returns a route.
 * @param {string} resourceName - name of the resource.
 */
function routeFactory(resourceName) {
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
function routeOptions(resource, fastify) {
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
        fastify.zlog.info(query);
        const queryType = getQueryType({ 
            resource: resourceName,
            params: request.query,
            zlog: fastify.zlog 
        });
        
        const resource = resourceName;
        const queryObj = { fastify, request, resource, query, queryType };
        const { response, debugInfo } = queryType.usesCache
            ? await getResultViaCache(queryObj)
            : await getResult(queryObj);

        makeLinks(request, response, queryType, fastify);
        addDebugInfo(response, debugInfo, queryType);

        if (queryType.usesCache) {
            fastify.zlog.info('caching the response before sending it');
            return response;
        }
        else {
            fastify.zlog.info('sending the response without caching it');
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
        fastify.zlog.info('querying Zai');
        return await askZai({ request, fastify, queryType });
    }

    // 'cachedQueries' is literally a request for a list of queries that 
    // have been cached. This list is used to populate the quick-link
    // examples on the askzai website
    else if (request.query.cachedQueries) {
        fastify.zlog.info('returning cached queries');
        return await getCachedQueries({ fastify, resource });
    }
    else {
        fastify.zlog.info('querying datastore');
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

    if (fastify.zconfig.cache.on) {
        let response;
        let debugInfo;
        const segment = resource;
        const isSemantic = queryType.isSemantic;
        const queryObj = { 
            segment, 
            query, 
            isSemantic
        };

        // For semantic queries, make the cache last forever by 
        // setting the ttl to -1
        if (isSemantic) {
            queryObj.ttl = -1;
        }
        
        if (request.query.refreshCache) {
            fastify.zlog.info('deleting cache');

            // delete result from cache 
            await fastify.cache.rm(queryObj);
        }
        else {
            fastify.zlog.info('querying cache');

            // Check if the result is in the cache
            response = await fastify.cache.get(queryObj);
        }

        if (!response) {
            fastify.zlog.info('no result in cache');

            // get the result from datastore
            const result = await getResult({ 
                fastify, request, resource, queryType 
            });
            queryObj.response = result.response;
            debugInfo = result.debugInfo;

            // Store the results in the cache
            response = await fastify.cache.set(queryObj);
        }

        return { response, debugInfo };
        
    }
    else {
        fastify.zlog.info('cache is off');
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
            if(Array.isArray(acc[key])) {
                acc[key] = [...acc[key], val]
            }
    
            // if it's not an array, but contains a value, 
            // we'll convert it into an array and add the current 
            // value to it
            else {
                acc[key] = [acc[key], val];
            }
        } 
        else {
    
            // plain assignment if no special case is present
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
function makeLinks(request, response, queryType, fastify) {
    if (queryType.hasLinks) {

        // _links are added only for non-zai requests
        fastify.zlog.info('Adding links');

        const decode = (sp) => decodeURIComponent(sp.toString());
        let [ url, search ] = request.url.substring(1).split('?');
        const sp = new URLSearchParams(search);

        if (sp.has('refreshCache')) {
            sp.delete('refreshCache');
        }

        const _links = { 
            _self: `${fastify.zconfig.url.zenodeo}/${url}?${decode(sp)}` 
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

        _links._prev = `${fastify.zconfig.url.zenodeo}/${url}?${prev}`;
        _links._next = `${fastify.zconfig.url.zenodeo}/${url}?${next}`;
        response._links = _links;
    }
}

async function getCachedQueries({ fastify, resource }) {
    fastify.zlog.info('getting cached queries');

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
        response.records = cachedQueries.map(c => c.query);
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