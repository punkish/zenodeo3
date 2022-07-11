import { dispatch as ddutils } from '../data-dictionary/dd-utils.js';
import { config } from '../zconf/index.js';

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
    const [ url, search ] = request.url.substring(1).split('?');
    const sp = new URLSearchParams(search);

    const _links = { 
        _self: `${config.url.zenodeo}/${url}?${search}` 
    };

    if (sp.has('page')) {
        const page = sp.get('page');
        sp.set('page', page - 1);
        _links._prev = `${config.url.zenodeo}/${url}?${sp.toString()}`;

        sp.set('page', parseInt(page) + 1);
        _links._next = `${config.url.zenodeo}/${url}?${sp.toString()}`;
    }
    else {
        sp.set('page', 1);
        _links._prev = `${config.url.zenodeo}/${url}?${sp.toString()}`;

        sp.set('page', 2);
        _links._next = `${config.url.zenodeo}/${url}?${sp.toString()}`;
    }

    return _links;
}

export { routeOptions }