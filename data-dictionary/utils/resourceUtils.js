import { resources } from '../resources/index.js';
import { commonparams } from '../resources/commonparams.js';
import clonedeep from 'lodash.clonedeep';
import { D } from './index.js';

const getResourceProperties = () => Object.keys(resources[0]).join("\n\t- ");

const getResources = (property = 'name') => {
    if (property === 'name') {
        return resources.map(r => r[property]);
    }
    else {
        const obj = {};
        resources.forEach(r => obj[r.name] = r[property]);
        return obj;
    }
}

const getResource = (resourceName, property) => {
    if (!resourceName) {
        console.error('Error: required argument "resourceName" missing');
        return;
    }

    const resource = resources.filter(r => r.name === resourceName)[0];

    if (!resource) {
        throw(new Error(`alleged resource "${resourceName}" does not exist`));
    }

    if (property) {

        const cacheKey = `res_${resourceName}`;

        // check the cache for resource or initialize it
        if (!(cacheKey in D)) D[cacheKey] = {};

        if (!D[cacheKey][property]) {
            D[cacheKey][property] = resource[property];
        }

        return D[cacheKey][property];
    }
    else {
        return resource;
    }
}

/**
 * @function getResourceId  
 * @returns {string} name of resourceId of a resource
 */
const getResourceId = (resourceName) => {
    if (!resourceName) {
        console.error('required argument "resourceName" missing');
        return;
    }

    const cacheKey = `res_${resourceName}`;

    // check the cache for resource or initialize it
    if (!(cacheKey in D)) D[cacheKey] = {};
    if (!D[cacheKey].resourceId) {
        D[cacheKey].resourceId = getParams(resourceName)
            .filter(col => col.isResourceId)[0];
    }

    return D[cacheKey].resourceId;
}


/**
 * @function getDefaultCols  
 * @returns {array} columns that are returned if no columns are specified in a REST query via 'cols'
 */
const getDefaultCols = (resourceName) => {
    if (!resourceName) {
        console.error('required argument "resourceName" missing');
        return;
    }
    
    const cacheKey = `res_${resourceName}`;

    // check the cache for resource or initialize it
    if (!(cacheKey in D)) D[cacheKey] = {};
    if (!D[cacheKey].defaultCols) {
        D[cacheKey].defaultCols = getParams(resourceName)
            .filter(p => !('notDefaultCol' in p));
    }

    return D[cacheKey].defaultCols;
}

/**
 * @function getParams  
 * @returns {array} all paramaters for a given resource
 */
const getParams = (resourceName) => {
    if (!resourceName) {
        console.error('required argument "resourceName" missing');
        return;
    }

    const cacheKey = `res_${resourceName}`;

    // check the cache for resource or initialize it
    if (!(cacheKey in D)) D[cacheKey] = {};

    if (!D[cacheKey].params) {

        // first, deep clone the params
        const parm = clonedeep(getResource(resourceName, 'params'))
        
        const params = parm
            .filter(p => {

                // remove params that start with '_' such as 
                // _uniq and _pk
                return p.name.substring(0, 1) !== '_';
            })
            .map(p => {

                // add a fully-qualified name
                if (!p.selname) {
                    p.selname = `${resourceName}."${p.name}"`;
                }

                // add a where name
                if (!p.where) {
                    p.where = `${resourceName}."${p.name}"`;
                }

                return p;
            });

        // add commonparams
        params.push(...commonparams);

        // finally, store a copy the params
        D[cacheKey].params = params;
    }

    return D[cacheKey].params;
}

const getParam = (resourceName, keyname, property) => {
    if (!resourceName) {
        console.error('required argument "resourceName" missing');
        return;
    }
 
    const cacheKey = `res_${resourceName}`;

    // check the cache for resource or initialize it
    if (!(cacheKey in D)) D[cacheKey] = {};

    if (!D[cacheKey].key) {
        D[cacheKey].key = getParams(resourceName)
            .filter(key => key.name === keyname)[0];

    }

    return property
        ? D[cacheKey].key[property]
        : D[cacheKey].key;
}

/**
 * @function getDefaultParams  
 * @returns {array} all paramaters for a given resource that 
 * are returned by default if no params are specified in a 
 * REST query via 'cols'
 */
const getDefaultParams = (resourceName) => {
    if (!resourceName) {
        console.error('required argument "resourceName" missing');
        return;
    }
    
    const cacheKey = `res_${resourceName}`;

    // check the cache for resource or initialize it
    if (!(cacheKey in D)) D[cacheKey] = {};
    if (!D[cacheKey].defaultParams) {
        D[cacheKey].defaultParams = getParams(resourceName)
            .filter(p => p.defaultCol);

    }

    return D[cacheKey].defaultParams;
}

/**
 * @function getFacetParams  
 * @returns {array} all params that can be used in facet queries
 */
const getFacetParams = (resourceName) => {
    if (!resourceName) {
        console.error('required argument "resourceName" missing');
        return;
    }

    const cacheKey = `res_${resourceName}`;

    // check the cache for resource or initialize it
    if (!(cacheKey in D)) D[cacheKey] = {};
    if (!D[cacheKey].facetParams) {
        D[cacheKey].facetParams = getParams(resourceName)
            .filter(p => p.facet);

    }

    return D[cacheKey].facetParams;
}

/**
 * @function tableFromResource
 * @returns {array} fully qualified table name
 */
// const tableFromResource = (resourceName) => {
//     if (!resourceName) {
//         console.error('required argument "resourceName" missing');
//         return;
//     }

//     const cacheKey = `res_${resourceName}`;

//     // check the cache for resource or initialize it
//     if (!(cacheKey in D)) D[cacheKey] = {};
//     if (!D[cacheKey].table) {
//         D[cacheKey].table = `${alias}.${resourceName}`;

//     }

//     return D[cacheKey].table;
// }

// schema: we use the schema to validate the query params
const getQueryStringSchema = function(resourceName) {
    if (!resourceName) {
        console.error('required argument "resourceName" missing');
        return;
    }

    const cacheKey = `res_${resourceName}`;

    // check the cache for resource or initialize it
    if (!(cacheKey in D)) D[cacheKey] = {};
    if (!D[cacheKey].queryStringSchema) {

        // we will create the queryStringSchema and cache it
        const resourceId = getResourceId(resourceName);
        const defaultCols = getDefaultCols(resourceName)
            .map(c => c.name);
        defaultCols.push('');
        const queryStringSchema = {};
        const params = getParams(resourceName);
        params
            .filter(p => p.name !== 'id')
            .filter(p => p.schema)
            .forEach(p => {
                const schema = clonedeep(p.schema);

                // fix the 'sortby' column definition
                if (p.name === 'sortby') {
                    schema.default = schema.default.replace(
                        /resourceId/, 
                        resourceId.selname
                    );
                }
                else if (p.name === 'cols') {
                    const enumvals = params.map(p => p.name);

                    // allow empty col as in "cols=''"
                    enumvals.push('');
                    
                    schema.items.enum = enumvals;
                    schema.default = defaultCols;
                }

                // fix the description
                if (p.sql && p.sql.desc) {
                    schema.description = `${p.sql.desc}. ${schema.description}`;
                }

                queryStringSchema[p.name] = schema;
            });

        D[cacheKey].getQueryStringSchema = queryStringSchema;

    }

    return D[cacheKey].getQueryStringSchema;
}

export { 
    getResourceProperties,
    getResources,
    getResource,
    getParams,
    getParam,
    getDefaultParams,
    getFacetParams,
    getQueryStringSchema,
    getResourceId
}