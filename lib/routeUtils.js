import { ddutils } from '../data-dictionary/utils/index.js';
import { resources } from '../data-dictionary/resources/index.js';
import { getDataFromZenodeo } from './dataFromZenodeo.js';
import { askZai  } from './zai/index.js';
import { 
    isAskZaiSomethingRequest, 
    handleAskZaiSomethingWithCache 
} from './zai/askZaiSomething/index.js';

/**
 * @function routeFactory - Creates a function that forms a route.
 * @param {string} resourceName - Name of the resource.
 * @returns {function} route - A function to create a fastify route.
 */
function routeFactory(resourceName) {

    // Retrieve the entire resource object by resourceName
    const resource = resources.filter(r => r.name === resourceName)[0];
    
    return  function route(fastify) {
        const options = routeOptions(fastify, resource);
        fastify.route(options);
    }
}

/**
 * @function routeOptions - Create options for a route.
 * @param {import('../app.js').fastify} fastify
 * @param {object} resource - Resource being queried.
 * @param {string} resource.name - Name of the resource.
 * @param {string} resource.title - Title of the resource.
 * @param {string} resource.summary - Summary of the resource.
 * @param {string} resource.description - Description of the resource.
 * @param {string[]} resource.tags - An array of tags.
 */
function routeOptions(fastify, resource) {

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
        handler: routeHandler(fastify, resource)
    };

}

// ─────────────────────────────────────────────────────────────────────────────
// routeHandler
//
// Before delegating to the normal cache machinery, we check whether this is an 
// `askZaiSomething` request (i.e. heyzai param is present AND it is not a 
// "describe <species>" query).  That path needs to hijack reply.raw
// for  Server-sent events (SSE), which is incompatible with how 
// getResultViaCache returns values.
//
// The new control flow is:
//
//   1. Is this an askZaiSomething request?
//      a. Is the result already in cache?  → send it as a plain JSON response
//         (no streaming needed — we have the answer right now).
//      b. Not in cache?  → set SSE headers, stream the answer, cache the full
//         result after the stream ends, return without touching reply further.
//   2. Everything else → original cache/no-cache path, completely unchanged.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @functon routeHandler - Runs when the route is called. 
 * @param {import('../app.js').Fastify} fastify
 * @param {object} resource - Resource being queried.
 */
function routeHandler(fastify, resource) {

    return async function(request, reply) {
        fastify.zlog.info(`query: ${request.queryForCache}`);

        // ── Early-exit: askZaiSomething SSE path ──────────────────────────────
        //
        // We intercept this before the cache machinery runs because:
        //   • getResultViaCache expects a return value it can cache/return;
        //     SSE writes directly to reply.raw and returns nothing.
        //   • If the answer IS cached we still want to serve it, just as plain
        //     JSON (no point streaming something we already have).
        //
        // "askZaiSomething" is identified by: heyzai param present AND the
        // question is not of the form "describe <genus> <species>".
        if (isAskZaiSomethingRequest(request)) {
            await handleAskZaiSomethingWithCache(
                fastify, resource, request, reply
            );

            // Return nothing — Fastify must not touch reply after SSE headers
            // have been sent, or after a plain JSON cache-hit response.
            return;
        }
        
        const { response, debugInfo } = request.queryType.usesCache
            ? await getResultViaCache(fastify, resource, request, reply)
            : await getResult(fastify, resource, request, reply);

        if (request.queryType.hasLinks) {
            makeLinks(fastify, request, response);
        }

        if (request.queryType.hasDebugInfo) {
            response.debugInfo = debugInfo;
        }

        if (request.queryType.usesCache) {
            return response;
        }
        else {
            return { 
                query: request.queryForCache, 
                response 
            };
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
async function getResult(fastify, resource, request, reply) {

    if (request.query.heyzai) {
        fastify.zlog.info('querying Zai');
        return await askZai(fastify, request, reply);
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
        return getDataFromZenodeo(fastify, resource, request);
    }

}

async function getResultViaCache(fastify, resource, request, reply) {
    fastify.zlog.info('getting the result via the cache');

    if (fastify.zconfig.cache.on) {
        let response;
        let debugInfo;
        const queryObj = { 
            segment: resource.name, 
            query: request.queryForCache, 
            isSemantic: request.queryType.isSemantic,
            omit: ['embedding', 'debug']
        };

        // For semantic queries, make the cache last forever by 
        // setting the ttl to -1
        if (request.queryType.isSemantic) {
            queryObj.ttl = -1;
        }
        
        if (request.query.refreshCache) {
            fastify.zlog.info('deleting cache');

            // delete result from cache 
            await fastify.cache.rm(queryObj);
        }

        // get the result from datastore
        const result = await getResult(fastify, resource, request, reply);
        queryObj.response = result.response;
        debugInfo = result.debugInfo;

        // Store the results in the cache
        response = await fastify.cache.set(queryObj);
        return { response, debugInfo };
    }
    else {
        fastify.zlog.info('cache is off');
        return await getResult(fastify, resource, request, reply);
    }
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

/**
 * Construct _prev, _next and _self links. 
 * @param {object} request - the request object.
 */
function makeLinks(fastify, request, response) {

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

async function getCachedQueries({ fastify, resource }) {
    fastify.zlog.info('getting cached queries');

    const cachedQueries = await fastify.cache.queries({
        segment: resource.name,
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

export { routeFactory }