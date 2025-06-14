import { ddutils } from '../data-dictionary/utils/index.js';
import { resources } from '../data-dictionary/resources/index.js';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;
import { getDataFromZenodeo } from './dataFromZenodeo.js';
import { askZai } from './zai/index.js';
import Chance from 'chance';

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

    return async function (request, reply) {
        const { query, isSemantic } = getQueryForCache(request);
        
        const obj = { 
            fastify, 
            request, 
            resource: resourceName, 
            query, 
            isSemantic 
        };

        let response;

        // if cache is on…
        if (config.cache.on) {

            // If `refreshCache` is true…
            if (request.query.refreshCache) {

                // Delete result from cache 
                await fastify.cache.rm({ 
                    segment: resourceName, 
                    query, 
                    isSemantic 
                });

                // and get from datastore, store in cache and return
                response = await getResult(obj);
            }
            else {

                // Check if the result is in the cache
                response = await fastify.cache.get({ 
                    segment: resourceName, 
                    query, 
                    isSemantic 
                });

                if (!response) {
                    response = await getResult(obj);
                }
            }

        }

        // if there is no cache, return results and be done with it
        else {

            // Get the result from the datastore
            response = getResult(obj);
        }

        return response;
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
async function getResult({ fastify, request, resource, query, isSemantic }) {
    let dataToCache;
    let debug;

    if (request.query.heyzai) {
        const question = request.query.heyzai;
        const qords = question.split(' ');

        if (qords[0].toLowerCase() === 'describe') {
            const [genus, species] = qords.slice(1);
            delete request.query.heyzai;
            request.query.genus = `eq(${genus})`;
            request.query.species = `eq(${species})`;
            request.query.summary = `ne(NULL)`;
            request.query.cols = [
                //'id',
                'treatmentId',
                'zenodoDep',
                'treatmentTitle', 
                'articleTitle',
                'articleAuthor',
                'articleDOI',
                'publicationDate',
                'status',
                'summary'
            ];
            const res = getDataFromZenodeo({ 
                request, 
                resource, 
                fastify 
            });

            debug = res.debug;

            const records = res.result.records;
            const i = records.findIndex(r => r.status === 'sp. nov.');
            const source = i > -1 ? records[i] : records[0];
            res.result.answer = source.summary;

            records.forEach(r => {
                r.images = fastify.betterSqlite3.prepare(`
                    SELECT httpUri, captionText
                    FROM images
                    WHERE treatments_id = @treatmentId`).all({ 
                        treatmentId: r.treatments_id 
                })
            });

            dataToCache = res.result;
            // const answer = `${binomen} is ${Chance().paragraph({ words: 10 })}.`;

            // return { 
            //     query: question, 
            //     response: {
            //         fts: {
            //             count: Chance().integer({ min: 1, max: 100 }),
            //             sources: [{
            //                 treatments_id: 1,
            //                 treatmentId: '12345',
            //                 zenodoDep: 'zenodo12345',
            //                 treatmentTitle: 'A Study on ' + binomen,
            //                 articleTitle: 'An Article on ' + binomen,
            //                 articleAuthor: 'John Doe',
            //                 fulltext: answer
            //             }]
            //         },
            //         answer
            //     }, 
            //     stored: new Date().getTime(), 
            //     ttl: 864000, 
            //     isSemantic: true,
            //     cacheHit: true
            // } 
        }
        else {
            const model = request.query.model || 'llama1b';
            dataToCache = await askZai({ fastify, question, model });
        }
        
    }
    else if (request.query.cachedQueries) {
        const cachedQueries = await fastify.cache.queries({
            segment: resource,
            isSemantic: true
        });

        return {
            query: 'cachedQueries=true',
            response: {
                count: cachedQueries.length,
                records: cachedQueries,
                search: {
                    cachedQueries: true,
                }
            }
        }
    }
    else {
        const res = getDataFromZenodeo({ request, resource, fastify });
        debug = res.debug;

        dataToCache = res.result;
        dataToCache.search = getSearch(request);
        dataToCache._links = makeLinks(request);
    }

    // Store the results in the cache
    const cachedData = await fastify.cache.set({
        segment: resource,
        query, 
        response: dataToCache, 
        isSemantic
    });

    if (config.isDebug && debug) {
        cachedData.debug = debug;
    }

    return cachedData;
}

/**
 * Takes a request and returns a its search params standardized for 
 * converting to a cache key. 
 * @param {object} request - the request object.
 */
function getQueryForCache(request) {
    const searchParams = new URLSearchParams(request.query);
    
    let query;
    let isSemantic = false;

    if (searchParams.has('heyzai')) {
        query = searchParams.get('heyzai');
        isSemantic = true;
    }
    else {
        [ 'facets', 'relatedRecords' ].forEach(p => {
            if (searchParams.get(p) === 'false') {
                searchParams.delete(p);
            }
        });
    
        [ 'deleted', 'refreshCache', 'cacheDuration' ].forEach(p => {
            if (searchParams.has(p)) {
                searchParams.delete(p);
            }
        });

        searchParams.sort();
        query = searchParams.toString();
    }

    return { query, isSemantic }
}

const getDataFromMetaStore = ({ request, resource }) => {
    return getDataFromZenodeo({ request, resource });
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

export { routeFactory, routeOptions, coerceToArray, getQueryForCache }