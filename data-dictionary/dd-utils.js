'use strict'

import process from 'node:process';
import minimist from 'minimist';

import { commonparams } from './resources/commonparams.js';
import { resources } from './resources.js';

/**
 * Detect if this program is called as a module or 
 * directly from the command line
 * 
 * https://stackoverflow.com/a/66309132/183692
 */
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * A simple cache for data-dictionary queries.
 * The cache is used only for methods whose arg is 'resource' 
 */ 
const D = {};

/**
 * @function tableFromResource
 * @returns {array} fully qualified table name
 */
const tableFromResource = (resource) => {

    // check the cache for resource or initialize it
    if (!(resource in D)) D[resource] = {};
    if (!D[resource].table) {
        const table = resource === 'materialCitations'
                ? 'materialsCitations'
                : resource;
        
        const alias = resources
            .filter(r => r.name === resource)[0]
            .alias;

        D[resource].table = `${alias}.${table}`;
    }

    return D[resource].table;
}

/**
 * @function getResources
 * @returns {array} resource names
 */
const getResources = () => resources.map(r => r.name);

/**
 * @function getSourceOfResource 
 * @returns {string} source ('zenodeo' or 'zenodo') of a given resource
 */
const getSourceOfResource = (resource) => {

    // check the cache for resource or initialize it
    if (!(resource in D)) D[resource] = {};
    if (!D[resource].sourceOfResource) {
        D[resource].sourceOfResource = resources
            .filter(r => r.name === resource)[0].source;
    }

    return D[resource].sourceOfResource;
}

/**
 * @function getResourcesFromSource 
 * @returns {array} resources from a given source ('zenodeo' or 'zenodo')
 */
const getResourcesFromSource = (source) => resources
    .filter(r => r.source === source)
    .map(r => r.name);

/**
 * @function getParams  
 * @returns {array} all paramaters for a given resource
 */
const getParams = (resource) => {

    // check the cache for resource or initialize it
    if (!(resource in D)) D[resource] = {};
    if (!D[resource].params) {
        
        // first, get all the params from the dictionary
        const params = resources
            .filter(r => r.name === resource)[0]
            .dictionary;

        // then, add the common params to the list
        params.push(...commonparams);

        // now, find out the alias of the resource to use 
        // for the attached database
        const alias = resources.filter(r => r.name === resource)[0].alias;

        // then, fix the selname by adding the alias to the name
        params.forEach(p => {
            p.selname = p.sqltype 
                ? `${alias}.${p.name}` 
                : p.name;
        })

        // finally, store a deep clone of the params
        D[resource].params = structuredClone(params);
    }

    return D[resource].params;
}


/**
 * @function getResourceId  
 * @returns {string} name of resourceId of a resource
 */
const getResourceId = (resource) => {

    // check the cache for resource or initialize it
    if (!(resource in D)) D[resource] = {};
    if (!D[resource].resourceId) {
        const table = tableFromResource(resource);
        const resourceIdName = getParams(resource)
            .filter(p => p.isResourceId)[0]
            .name;

        D[resource].resourceId = `${table}.${resourceIdName}`;
        D[resource].resourceIdName = resourceIdName;
    }

    return { 
        resourceId: D[resource].resourceId, 
        resourceIdName: D[resource].resourceIdName 
    }
}

// // const getSelname = (resource, param) => {
// //     let selname = param.name;

// //     if (param.alias) {
// //         if (param.alias.select) {
// //             selname = param.alias.select;
// //         }
// //     }

// //     return selname;
// // }

// // const getParamsNameAndSelname = (resource) => getParams(resource)
// //     .map(p => {
// //         return { name: p.name, selname: getSelname(p) } 
// //     })

// // queryableParams: dd entries that are allowed in a REST query
const getQueryableParams = (resource) => {

    // check the cache for resource or initialize it
    if (!(resource in D)) D[resource] = {};
    if (!D[resource].getQueryableParams) {
        D[resource].getQueryableParams = getParams(resource)
            .filter(p => !('notQueryable' in p));
    }

    return D[resource].getQueryableParams;
}

// // All queryable params of a resource with default values
// // const getQueryableParamsWithDefaul`ts = function(resource) {
// //     const resourceId = getResourceId(resource)
// //     const params = getQueryableParams(resource)
    
// //     const p = params
// //         .filter(p => 'default' in p.schema)
// //         .map(p => {
// //             if (typeof p.schema.default === 'string') {
// //                 p.schema.default = p.schema.default.replace(/resourceId/, getSelname(p))
// //             }

// //             return p
// //         })

// //     return p
// // }

// // cols: columns suitable to make a SQL query. Columns in the 
// // SELECT clause can be different from those in the JOIN or  
// // the WHERE clauses
const getCols = (resource) => {

    // check the cache for resource or initialize it
    if (!(resource in D)) D[resource] = {};
    if (!D[resource].cols) {
        D[resource].cols = getParams(resource)
            .map(p => {
                return {
                    name: p.name, 
                    sqltype: p.sqltype,
                    zqltype: p.zqltype || 'text',
                    facet: p.facet || false
                }
            });
    }

    return D[resource].cols;
}

// // defaultCols: columns that are returned if no columns are 
// // specified in a REST query via 'cols'
const getDefaultCols = (resource) => {
    
    // check the cache for resource or initialize it
    if (!(resource in D)) D[resource] = {};
    if (!D[resource].defaultCols) {
        D[resource].defaultCols = getParams(resource)
            .filter(p => !('notDefaultCol' in p));
    }

    return D[resource].defaultCols;
}


// // facetCols: all cols that can be used in facet queries
const getFacetCols = (resource) => {

    // check the cache for resource or initialize it
    if (!(resource in D)) D[resource] = {};
    if (!D[resource].facetCols) {
        D[resource].facetCols = getCols(resource)
            .filter(p => p.facet)
            .map(p => {
                return { name: p.name, facet: p.facet }
            });
    }

    return D[resource].facetCols;
}

const getSqlCols = (resource) => {

    // check the cache for resource or initialize it
    if (!(resource in D)) D[resource] = {};
    if (!D[resource].sqlCols) {
        D[resource].sqlCols = getParams(resource)
            .map(p => {
                return {
                    name: p.name, 
                    isResourceId: p.schema.isResourceId || false,
                    cheerio: p.cheerio
                }
            });
    }

    return D[resource].sqlCols;
}
    

// const getSqlDefs = (resource) => getParams(resource)
//     .filter(p => p.sqltype)
//     .map(p => {
//         return p.alias && p.alias.create ? 
//             `${p.alias.create} ${p.sqltype}` :
//             `${p.name} ${p.sqltype}`
//     })

const _getName = (resource, col, type) => {
    const table = tableFromResource(resource);

    return col.alias && col.alias[type] 
        ? col.alias[type] 
        : `${table}.${col.name}`
}

// // getSelect: the column name or expression used in a SQL query
const getSelect = (resource, column) => {
    const col = getParams(resource)
        .filter(p => p.name === column)[0];
    return _getName(resource, col, 'select');
}

// // where: the column name used in the WHERE clause of a SQL query
const getWhere = (resource, column) => {
    const col = getParams(resource)
        .filter(p => p.name === column)[0];
    return _getName(resource, col, 'where');
}

const getJoin = (resource, column, type) => {
    const col = getParams(resource)
        .filter(c => c.name === column)[0];

    return col.joins ? col.joins[type] : '';
}

const getZqltype = (resource, column) => getCols(resource)
    .filter(c => c.name === column)[0].zqltype;
    
const getSqltype = (resource, column) => getCols(resource)
    .filter(c => c.name === column)[0].sqltype;

// schema: we use the schema to validate the query params
const getQueryStringSchema = function(resource) {

    // check the cache for resource or initialize it
    if (!(resource in D)) D[resource] = {};
    if (!D[resource].queryStringSchema) {
        const params = getParams(resource);
        const resourcesFromZenodeo = getResourcesFromSource('zenodeo');
        const resourcesMetadata = getResourcesFromSource('metadata');
        const validResources = [ 
            ...resourcesFromZenodeo, 
            ...resourcesMetadata 
        ];

        const queryStringSchema = {};
        
        params.forEach(p => {
            if (p.name === 'sortby') {
                const { resourceId, resourceIdName } = getResourceId(resource);
                p.schema.default = p.schema.default.replace(
                    /resourceId/, 
                    resourceId
                );
            }
            else if (p.name === 'cols') {
                if (validResources.includes(resource)) {
                    
                    const enumvals = params.map(p => p.name);

                    // allow empty col as in "cols=''"
                    enumvals.push('');
                    
                    p.schema.items.enum = enumvals;
                    p.schema.default = getDefaultCols(resource)
                        .map(c => c.name);
                }
            }

            queryStringSchema[p.name] = p.schema;
        });

        D[resource].queryStringSchema = queryStringSchema;
    }

    return D[resource].queryStringSchema;
}

const getNotCols = () => commonparams.map(c => c.name);

// Finding the number of function parameters in JavaScript
// https://stackoverflow.com/a/6293830/183692
// const getArgs = (f) => {
//     let args = f.toString()
//     args = args.split('\n').join('')
//     args = args.replace(/^function\((.*?)\).*/,'$1').split(', ')
//     return args
// }

const functions = [
    { getResources          , args: ""         },
    { getNotCols            , args: ""         },
    { getSourceOfResource   , args: "resource" },
    { getResourcesFromSource, args: "source"   },
    { getParams             , args: "resource" },
    { getResourceId         , args: "resource" },
    { getQueryableParams    , args: "resource" },
    { getCols               , args: "resource" },
    { getDefaultCols        , args: "resource" },
    { getFacetCols          , args: "resource" },
    { getSqlCols            , args: "resource" },
    { getQueryStringSchema  , args: "resource" },
    { tableFromResource     , args: "resource" },
    { getSelect             , args: "resource, column" },
    { getWhere              , args: "resource, column" },
    { getZqltype            , args: "resource, column" },
    { getSqltype            , args: "resource, column" },
    { getJoin               , args: "resource, column, type" }
]

const ddu = {};
functions.forEach(f => ddu[Object.keys(f)[0]] = Object.values(f)[0]);

const init = () => {
    const path1 = path.resolve(process.argv[1]);
    const path2 = path.resolve(fileURLToPath(import.meta.url));
    const nodePath = path1.split('/').pop().split('.')[0];
    const modulePath = path2.split('/').pop().split('.')[0];

    if (nodePath === modulePath) {
        const argv = minimist(process.argv.slice(2));
        
        if (argv.help) {
            console.log(`
ddUtils USAGE:
${'*'.repeat(79)}

node data-dictionary/dd-utils.js --fn=<fn> args
node data-dictionary/dd-utils.js --list=true
            `);
            return;
        }
        
        if (argv.list) {
            console.log(`
ddUtils
${'*'.repeat(79)}
available functions are:
            `);

            const f = functions.map(f => {
                const func = Object.keys(f)[0];
                const args = Object.values(f)[1]
                return `- ${func}(${args})`;
            }).join('\n')

            console.log(f);
        }
        else {
            console.log(`function: ${argv.fn}("${argv._.join(',')}")\n`);
            const result = ddu[argv.fn](...argv._);
            console.log(JSON.stringify(result, null, 4));
        }
    }
}

init();

export { ddu }