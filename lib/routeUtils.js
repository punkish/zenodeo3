import { dispatch as ddutils } from '../data-dictionary/dd-utils.js';
import { resources } from '../data-dictionary/resources.js';
import { config } from '../zconf/index.js';

const routeOptions = (resource) => {
    return {
        method: 'GET',
        url: `/${resource.name.replace(/ /g, '').toLowerCase()}`,
        schema: {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": `https://example.com/${resource.name}.schema.json`,
            title: resource.title,
            summary: resource.summary,
            description: resource.description,
            response: {},
            querystring: {
                type: 'object',
                additionalProperties: false
            },
            tags: resource.tags
        }
    };
}

const routeHandler = (resourceName) => async (request, reply) => {
    let response;

    if (config.cacheOn) {
        request.log.info("cache is enabled");

        if (request.query.refreshCache) {
            request.log.info("delete cache");
        }

        response = queryDataStore(request);
    }
    else {
        request.log.info("there is no cache");
        response = queryDataStore(request);
    }

    return response;
}

const queryDataStore = (request) => {
    return {
        item: {
            search: getSearch(request),
            validated: request.query,
            result: {
                count: 5,
                records: [],
                relatedRecords: {},
                facets: {}
            },
            _links: makeLinks(request)
        },
        stored: 1,
        ttl: 1,
        debug: {
            countQuery: {
                query: '',
                runtime: 3
            },
            fullQuery: {
                query: '',
                runtime: 4
            }
        }
    }
}

const getSearch = (request) => {
    const search = new URLSearchParams(request.origQuery);
    
    search.delete('refreshCache');
    return groupParamsByKey(search);
}

const groupParamsByKey = (params) => [...params.entries()].reduce((acc, tuple) => {
    // getting the key and value from each tuple
    const [key, val] = tuple;
    if(acc.hasOwnProperty(key)) {

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
   }, {});

const makeLinks = (request) => {
    return {
        _self: `${request.hostname}${request.url}`,
        _prev: `${request.hostname}${request.url}&page=1`,
        _next: `${request.hostname}${request.url}&page=2`
    }
}

export { routeOptions, routeHandler }