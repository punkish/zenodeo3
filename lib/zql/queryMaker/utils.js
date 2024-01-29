import { Config } from '@punkish/zconfig';
const config = new Config().settings;
import { ddutils } from "../../../data-dictionary/utils/index.js";

// see https://ajv.js.org/packages/ajv-errors.html
import Ajv from 'ajv';
const ajv = new Ajv(config.ajv.opts);

/**
 * Check if the submitted params conform to the schema.
 * @param {string} resource - name of the resource.
 * @param {object} params - query parameters
 */
const validate = function({ resource, params }) {
    const schema = {
        type: 'object',
        additionalProperties: false,
        properties: ddutils.getQueryStringSchema(resource)
    };
    const validator = ajv.compile(schema);
    const valid = validator(params);

    if (valid) {
        if (params.cols && params.cols.length === 1 && params.cols[0] === '') {
            delete params.cols;
        }

        return params;
    }
    
    //
    // validation failed
    //
    console.error('😩 validation failed')
    console.error(validator.errors);
    return false;
}

// 
// the following params can be a part of the queryString but are not used in 
// making the SQL query so they need to be excluded when creating the SQL
// 
// const nonSqlQueryable = [
//     'cols', 'refreshCache', 'cacheDuration', 'facets', 'termFreq', 
//     'yearlyCounts', 'relatedRecords', 'stats', 
//     'page', 'size', 'sortby', 'groupby'
// ];

const CACHE = {};

/**
 * Query the cache for _defaultOps.
 * @param {string} resource - name of the resource.
 */
const queryCache = (resource) => {
    
    if (!('_defaultOps' in CACHE)) {
        CACHE._defaultOps = {};
    }

    if (!(resource in CACHE._defaultOps)) {
        
        const queryableParams = ddutils.getParams(resource)
                .filter(p => !('notQueryable' in p));

        // https://stackoverflow.com/questions/19874555/how-do-i-convert-array-of-objects-into-one-object-in-javascript
        const _defaultOps = queryableParams
            .reduce((o, i) => Object.assign(
                o, 
                { [i.name]: i.defaultOp || 'eq' }
            ), {});
        
        CACHE._defaultOps[resource] = _defaultOps;
    }

    return CACHE._defaultOps[resource];
}

/**
 * mapping of ZQL ops to actual SQL ops
 */
const _zops = {

    //
    // numeric and string operators
    //
    eq          : '=',
    ne          : '!=',

    //
    // numeric operators
    //
    gte         : '>=',
    lte         : '<=',
    gt          : '>',
    lt          : '<',

    //
    // string operators
    //
    like        : 'LIKE',
    starts_with : 'LIKE',
    ends_with   : 'LIKE',
    contains    : 'LIKE',
    not_like    : 'NOT LIKE',

    //
    // date operators
    //
    between     : 'BETWEEN',
    since       : '>=',
    until       : '<=',

    // spatial operator
    within      : 'BETWEEN',
    bbox        : 'BETWEEN',

    //
    // fts5
    //
    match       : 'MATCH'
};

export { 
    validate,
     //nonSqlQueryable, 
     queryCache, 
     _zops 
    }