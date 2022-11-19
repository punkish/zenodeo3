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
**/
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * @function tableFromResource
 * @returns {array} fully qualified table name
 */
const tableFromResource = (resource) => {
    const table = resource === 'materialCitations'
        ? 'materialsCitations'
        : resource;

    const alias = resources.filter(r => r.name === resource)[0].alias;
    return `${alias}.${table}`;
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
const getSourceOfResource = (resource) => resources
    .filter(r => r.name === resource)[0].source;

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
    const params = resources
        .filter(r => r.name === resource)[0]
        .dictionary;

    //const sourceOfResource = getSourceOfResource(resource);

    //if (sourceOfResource === 'zenodo' || sourceOfResource === 'zenodeo') {
        params.push(...commonparams);
    //}

    //const table = tableFromResource(resource);
    const alias = resources.filter(r => r.name === resource)[0].alias;

    params.forEach(p => {
        p.selname = p.sqltype 
            ? `${alias}.${p.name}` 
            : p.name;
    })

    return params;
}


/**
 * @function getResourceid  
 * @returns {string} name of resourceId of a resource
 */
const getResourceid = (resource) => {
    const table = tableFromResource(resource);

    let resourceIdName = getParams(resource)
        .filter(p => p.isResourceId)[0]
        .name;

    return `${table}.${resourceIdName}`;
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
const getQueryableParams = (resource) => getParams(resource)
    .filter(p => !('notQueryable' in p));

// // All queryable params of a resource with default values
// // const getQueryableParamsWithDefaul`ts = function(resource) {
// //     const resourceId = getResourceid(resource)
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
const getCols = (resource) => getParams(resource)
    .map(p => {
        return {
            name: p.name, 
            // schema: p.schema,
            // selname: getSelect(resource, p.name), 
            // isResourceId: p.schema.isResourceId || false,
            // wherename: getWhere(resource, p.name), 
            // join: p.join || '',
            sqltype: p.sqltype,
            zqltype: p.zqltype || 'text',
            // isDefaultCol: 'notDefaultCol' in p ? true : false,
            facet: p.facet || false
        }
    });

// // defaultCols: columns that are returned if no columns are 
// // specified in a REST query via 'cols'
const getDefaultCols = (resource) => getParams(resource)
    .filter(p => !('notDefaultCol' in p));

// // facetCols: all cols that can be used in facet queries
const getFacetCols = (resource) => getCols(resource)
    .filter(p => p.facet)
    .map(p => {
        return { name: p.name, facet: p.facet }
    });

const getSqlCols = (resource) => getParams(resource)
    .map(p => {
        return {
            name: p.name, 
            isResourceId: p.schema.isResourceId || false,
            cheerio: p.cheerio
        }
    })
    

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
    const col = getParams(resource).filter(p => p.name === column)[0];
    return _getName(resource, col, 'select');
}

// // where: the column name used in the WHERE clause of a SQL query
const getWhere = (resource, column) => {
    const col = getParams(resource).filter(p => p.name === column)[0];
    return _getName(resource, col, 'where');
}

const getJoin = (resource, column, type) => {
    const col = getParams(resource).filter(c => c.name === column)[0];
    return col.joins ? col.joins[type] : '';
}

const getZqltype = (resource, column) => getCols(resource)
    .filter(c => c.name === column)[0].zqltype;
    
const getSqltype = (resource, column) => getCols(resource)
    .filter(c => c.name === column)[0].sqltype;

// // schema: we use the schema to validate the query params
const getQueryStringSchema = function(resource) {

    // make a deep copy of params because they[*] will be modified
    // [*] specifically, 'sortby' will be modified
    const params = JSON.parse(JSON.stringify(getParams(resource)));
    const enumvals = params.map(p => p.name);

    // allow empty col as in "cols=''"
    enumvals.push('');

    const resourcesFromZenodeo = getResourcesFromSource('zenodeo');
    const resourcesMetadata = getResourcesFromSource('metadata');
    const validResources = [ ...resourcesFromZenodeo, ...resourcesMetadata ];

    const schema = {};
    
    params.forEach(p => {
        
        if (p.name === 'sortby') {
            const resourceId = getResourceid(resource);
            p.schema.default = p.schema.default.replace(
                /resourceId/, 
                resourceId
            );
        }
        else if (p.name === 'cols') {
            if (validResources.includes(resource) && p.schema.type === 'array') {
                p.schema.items.enum = enumvals;
                p.schema.default = getDefaultCols(resource).map(c => c.name);
            }
        }

        schema[p.name] = p.schema;
    });

    return schema;
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
    { getResourceid         , args: "resource" },
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

const dispatch = {};
functions.forEach(f => dispatch[Object.keys(f)[0]] = Object.values(f)[0]);

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
            console.log('ddUtils');
            console.log('*'.repeat(79));
            console.log('available functions are:\n');
            functions.forEach(f => {
                const func = Object.keys(f)[0];
                const args = Object.values(f)[1]
                console.log(`- ${func}(${args})`);
            });
        }
        else {
            console.log(`function: ${argv.fn}("${argv._.join(',')}")\n`);
            const result = dispatch[argv.fn](...argv._);
            console.log(JSON.stringify(result, null, 4));
        }
    }
}

init();

export { dispatch }