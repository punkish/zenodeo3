import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const logOpts = JSON.parse(JSON.stringify(config.zlogger));
logOpts.name = 'LIB:ZQL:Z-UTILS:INDEX';
import Zlogger from '@punkish/zlogger';
const log = new Zlogger(logOpts);

// see https://ajv.js.org/packages/ajv-errors.html
import Ajv from 'ajv';
const ajv = new Ajv(config.ajv.opts);

import { ddutils } from '../../../data-dictionary/utils/index.js';

export { _zops } from './lib/index.js';

// check if the submitted params conform to the schema
const validate = function({ resource, params }) {
    const schema = {
        type: 'object',
        additionalProperties: false,
        properties: ddutils.getQueryStringSchema(resource)
    };
    
    const validator = ajv.compile(schema);
    const valid = validator(params);

    if (valid) {
        // if (params.cols && params.cols.length === 1 && params.cols[0] === '') {
        //     delete params.cols;
        // }

        return params;
    }
    else {
        
        // validation failed
        console.error('😩 validation failed')
        console.error(validator.errors);
        return false;
    }
}

const formatDate = (date) => {
    let yyyy;
    let mm;
    let dd;

    if (date === 'yesterday') {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        yyyy = date.getUTCFullYear();
        mm = date.getUTCMonth() + 1;
        dd = date.getUTCDate();
    }
    else {
        [ yyyy, mm, dd ] = date.split('-');
    }

    if (parseInt(mm) < 10) {
        mm = mm.toString().padStart(2, '0');
    }

    if (parseInt(dd) < 10) {
        dd = dd.toString().padStart(2, '0');
    }

    return `${yyyy}-${mm}-${dd}`;
}

function getQueryType({ resource, params, zlog }) {
    //  queryType = {
    //      db: [ bare, count, resourceId, normal ] | false,
    //      hasLinks: true | false,
    //      hasDebugInfo: true | false,
    //      usesCache: true | false,
    //      isSemantic: true | false
    //  }
    const queryType = {};

    function isResourceIdQuery(resource) {
        const resourceId = ddutils.getResourceId(resource);

        if (resourceId && resourceId !== 'none') {
            const resourceIdName = resourceId.name;

            if (resourceIdName in params) {
                return true;
            }

        }

        return false;
    }

    function isBareQuery(params) {

        // A query is a bare query if only non-sql cols are 
        // present in the params.
        const nonSqlCols = ddutils.getNotCols();
        const paramKeys = Object.keys(params);

        if (paramKeys.every(p => nonSqlCols.indexOf(p) > -1)) {
            return true;
        }

        return false;
    }

    if (params.cols) {

        // It is a db query, but what kind of db? Let's find out
        if (params.cols.length === 1 && params.cols[0] === '') {
            delete params.cols;
            queryType.isDb = 'count';
        }
        else if (isResourceIdQuery(resource)) {
            queryType.isDb = 'resourceId';
        }
        else if (isBareQuery(params)) {
            queryType.isDb = 'bare';
        }
        else {
            queryType.isDb = 'normal';
        }
    }
    else {
        queryType.isDb = false;
    }

    // Not a db query, so let's figure out other types
    if (params.heyzai) {

        // never add _links because the response is not 
        // page-able
        queryType.hasLinks = false;

        // add debug info that will result from the ftsSearch
        // and the associated images searches
        queryType.hasDebugInfo = true;

        // Now, determine what kind of zai query is it
        const qords = request.query.heyzai.split(' ');

        if (qords[0].toLowerCase() === 'describe') {

            // doesn't use cache and is not semantic
            queryType.usesCache = false;
            queryType.isSemantic = false;
        }
        else {

            // uses cache and is semantic
            queryType.usesCache = true;
            queryType.isSemantic = true;
        }

    }
    else if (params.cachedQueries) {

        // never add _links
        queryType.hasLinks = false;

        // doesn't cache the result
        queryType.usesCache = false;

        // the query itself is not semantic 
        // (even though only semantic queries are retrieved)
        queryType.isSemantic = false;

        // doesn't have any associated debugInfo
        queryType.hasDebugInfo = false;
    }
    else {

        // db queries have _links, are cached, and have debugInfo
        queryType.hasLinks = true;
        queryType.usesCache = true;
        queryType.hasDebugInfo = true;
        queryType.isSemantic = false;
    }
    
    //zlog.info(queryType);
    
    return queryType
}

export {
    validate,
    formatDate,
    getQueryType
}