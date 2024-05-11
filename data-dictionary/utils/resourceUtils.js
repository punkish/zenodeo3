import { resources } from '../resources/index.js';
import { commonparams } from '../resources/commonparams.js';
import clonedeep from 'lodash.clonedeep';


/**
 * @function getParams  
 * @returns {array} all paramaters for a given resource
 */
const getParams = (resourceName) => {

    // We are going to modify the parameter values, so to not change the 
    // original definitions, we first deep clone the params
    const resource = resources.filter(r => r.name === resourceName)[0];
    const paramsCopy = clonedeep(resource.params);

    const params = paramsCopy

        // param names should not start with '_' such as _uniq and _pk
        .filter(p => p.name.substring(0, 1) !== '_')

        // should have a schema as params without a schema are not usable 
        // in the REST queries
        .filter(p => p.schema)
        .map(p => {
            
            // add a fully-qualified SELECT name if it doesn't already
            // exist
            if (!p.selname) {
                p.selname = `${resourceName}.${p.name}`;
            }

            // add a fully-qualified WHERE name if it doesn't already
            // exist
            if (!p.where) {
                p.where = `${resourceName}.${p.name}`;
            }

            // add a defaultOp if it doesn't already exist
            if (!p.defaultOp) {
                p.defaultOp = '=';
            }
            
            return p;
        });

    // add commonparams
    params.push(...commonparams);

    return params;
    
}

const getResourceProperties = () => `"    - "${Object.keys(resources[0]).join("\n    - ")}`;

const getResources = (property) => {
    if (!property) property = 'name';

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
    const resource = resources.filter(r => r.name === resourceName)[0];
    
    if (property) {
        return resource[property];
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
    return getParams(resourceName)
            .filter(col => col.isResourceId)[0];
}

/**
 * @function getPk  
 * @returns {string} name of Primary Key of the resource table
 */
// const getPk = (resourceName) => {
//     if (!resourceName) {
//         console.error('required argument "resourceName" missing');
//         return;
//     }

//     const cacheKey = `res_${resourceName}`;

//     // check the cache for resource or initialize it
//     if (!(cacheKey in D)) D[cacheKey] = {};
//     if (!D[cacheKey].pk) {
//         D[cacheKey].pk = getParams(resourceName)
//             .filter(col => {
//                 if (col.sql && col.sql.type) {
//                     return col.sql.type = 'INTEGER PRIMARY KEY'
//                 }
//             })[0];
//     }

//     console.log(D[cacheKey].pk)
//     return D[cacheKey].pk;
// }


/**
 * @function getDefaultCols  
 * @returns {array} columns that are returned if no columns are specified in a REST query via 'cols'
 */
// const getDefaultCols = (resourceName) => {
//     if (!resourceName) {
//         console.error('required argument "resourceName" missing');
//         return;
//     }
    
//     const cacheKey = `res_${resourceName}`;

//     // check the cache for resource or initialize it
//     if (!(cacheKey in D)) D[cacheKey] = {};
//     if (!D[cacheKey].defaultCols) {
//         D[cacheKey].defaultCols = getParams(resourceName)
//             .filter(p => {
                
//                 if ('defaultCol' in p) {
//                     return p.defaultCol === true
//                         ? true
//                         : false;
//                 }
                
//                 return true;
//             });
//     }

//     return D[cacheKey].defaultCols;
// }

// const getParam = (resourceName, keyname, property) => {
//     if (!resourceName) {
//         console.error('required argument "resourceName" missing');
//         return;
//     }
 
//     const cacheKey = `res_${resourceName}`;

//     // check the cache for resource or initialize it
//     if (!(cacheKey in D)) D[cacheKey] = {};

//     if (!D[cacheKey].key) {
//         D[cacheKey].key = getParams(resourceName)
//             .filter(key => key.name === keyname)[0];

//     }

//     return property
//         ? D[cacheKey].key[property]
//         : D[cacheKey].key;
// }

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
const getQueryStringSchema = function(resourceName, resourceParams) {
    if (!resourceParams) {
        resourceParams = getParams(resourceName);
    }

    const pk = resourceParams.filter(col => {
        if (col.sql && col.sql.type) {
            return col.sql.type = 'INTEGER PRIMARY KEY'
        }
    })[0];

    const sortby = pk.selname.indexOf('.id') > -1
        ? pk.selname.replace(/\.id/, '_id')
        : pk.selname;

    const defaultCols = resourceParams
        .filter(param => {
            return 'defaultCol' in param
                ? param.defaultCol
                : true;
        });

    const queryStringSchema = {};

    resourceParams
        //.filter(p => p.name !== 'id')
        .filter(p => p.schema)
        .forEach(p => {
            const schema = clonedeep(p.schema);
            
            // fix the 'sortby' column definition
            if (p.name === 'sortby') {
                schema.default = schema.default.replace(/resourceId/, sortby);
            }
            else if (p.name === 'cols') {
                const enumvals = resourceParams.map(p => p.name);

                // allow empty col as in "cols=''"
                enumvals.push('');
                
                schema.items.enum = enumvals;
                schema.default = defaultCols.map(c => c.name);
            }

            // fix the description
            if (p.sql && p.sql.desc) {
                schema.description = `${p.sql.desc}. ${schema.description}`;
            }

            queryStringSchema[p.name] = schema;
        });

    return queryStringSchema;
}

export { 
    getParams,
    getResourceProperties,
    getResources,
    getResource,
    //getParam,
    //getDefaultCols,
    getDefaultParams,
    getFacetParams,
    getQueryStringSchema,
    getResourceId,
    //getPk
}