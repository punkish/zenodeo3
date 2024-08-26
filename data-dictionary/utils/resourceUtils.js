import { resources } from '../resources/index.js';
import { commonparams } from '../resources/commonparams.js';
import { checkCache, fillCache } from './index.js';

/**
 * @function getParams - Return params of a resource
 * @returns {array} params - An array of params of the resource
 * @param {string} resourceName - Name of the resource
 */
function getParams(resourceName) {
    const segment = resourceName;
    const key = 'params';
    const res = checkCache({ segment, key });

    if (res) {
        return res;
    }

    const resource = resources.filter(r => r.name === resourceName)[0];

    // We are going to modify the parameter values, so we first deep clone the 
    // params so the original definitions are left alone
    const paramsCopy = JSON.parse(JSON.stringify(resource.params));

    
    //const resourceId = paramsCopy.filter(col => col.isResourceId)[0];
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

            // add a fully-qualified WHERE name if it doesn't already exist
            if (!p.where) {
                p.where = `${resourceName}.${p.name}`;
            }

            // add a defaultOp if it doesn't already exist
            if (!p.defaultOp) {
                p.defaultOp = '=';
            }
            
            return p;
        });

    // Finally, we add the commonparams
    params.push(...commonparams);
    fillCache({ segment, key, val: params });
    return params;

}

const getResourceProperties = () => {
    return `"    - "${Object.keys(resources[0]).join("\n    - ")}`;
}

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
    
    return property
        ? resource[property]
        : resource;
}

/**
 * @function getResourceId  
 * @returns {string} name of resourceId of a resource
 */
const getResourceId = (resourceName) => {
    const segment = resourceName;
    const key = 'resourceId';
    const res = checkCache({ segment, key });

    if (res) {
        return res;
    }

    const resourceId = getParams(resourceName)
        .filter(col => col.isResourceId)[0];
    fillCache({ segment, key, val: resourceId });
    return resourceId;
}

/**
 * @function getPk  
 * @returns {string} name of Primary Key of the resource table
 */
const getPk = (resourceName) => {
    const segment = resourceName;
    const key = 'pk';
    const res = checkCache({ segment, key });

    if (res) {
        return res;
    }

    const pk = getParams(resourceName)
        .filter(col => {
            if (col.sql && col.sql.type) {
                return col.sql.type = 'INTEGER PRIMARY KEY'
            }
        })[0];

    fillCache({ segment, key, val: pk });
    return pk;
}


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
    const segment = resourceName;
    const key = 'defaultParams';
    const res = checkCache({ segment, key });

    if (res) {
        return res;
    }

    const defaultParams = getParams(resourceName)
        .filter(p => p.defaultCol);
    fillCache({ segment, key, val: defaultParams });
    return defaultParams;
}

/**
 * @function getFacetParams  
 * @returns {array} all params that can be used in facet queries
 */
const getFacetParams = (resourceName) => {
    const segment = resourceName;
    const key = 'facetParams';
    const res = checkCache({ segment, key });

    if (res) {
        return res;
    }

    const facetParams = getParams(resourceName)
        .filter(p => p.facet);
    fillCache({ segment, key, val: facetParams });
    return facetParams;
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

/**
 * @function getQueryStringSchema - schema for the queryString
 * @returns {Object} - queryStringSchema
 * @param {string} - resourceName
 */
function getQueryStringSchema(resourceName) {
    const segment = resourceName;
    const key = 'queryStringSchema';
    const res = checkCache({ segment, key });

    if (res) {
        return res;
    }

    const resourceParams = getParams(resourceName);
    const pk = getPk(resourceName);

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
            const schema = JSON.parse(JSON.stringify(p.schema));
            
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

    fillCache({ segment, key, val: queryStringSchema });
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
    getPk
}