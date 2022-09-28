'use strict'

import { commonparams } from './resources/commonparams.js';
import { resources } from './resources.js';

const tableFromResource = (resource) => {
    let table = resource;

    if (resource === 'materialCitations') {
        table = 'materialsCitations';
    }

    return table;
}

// resources: REST resources that map 1 -> 1 to SQL tables
// returns an array of resource names
const getResources = () => resources.map(r => r.name);

// returns the source ('zenodeo' or 'zenodo') of a given resource
const getSourceOfResource = (resource) => resources
    .filter(r => r.name === resource)[0].source;

// // returns the resources from a given source ('zenodeo' or 'zenodo')
const getResourcesFromSource = (source) => resources
    .filter(r => r.source === source)
    .map(r => r.name);

// params: all entries in the data dictionary for a given resource
const getParams = (resource) => {
    let params = resources
        .filter(r => r.name === resource)[0]
        .dictionary;

    const sourceOfResource = getSourceOfResource(resource);
    if (sourceOfResource === 'zenodo' || sourceOfResource === 'zenodeo') {
        params = params.concat(...commonparams);
    }

    const table = tableFromResource(resource);

    params.forEach(p => {
        p.selname = p.sqltype ? `${table}.${p.name}` : p.name;
    })

    return params;
}

// resourceId of a resource
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
            schema: p.schema,
            selname: getSelect(resource, p.name), 
            isResourceId: p.schema.isResourceId || false,
            wherename: getWhere(resource, p.name), 
            join: p.join || '',
            sqltype: p.sqltype,
            zqltype: p.zqltype || 'text',
            isDefaultCol: 'notDefaultCol' in p ? true : false,
            facet: p.facet || false
        }
    })

// // defaultCols: columns that are returned if no columns are 
// // specified in a REST query via 'cols'
const getDefaultCols = (resource) => getParams(resource)
    .filter(p => !('notDefaultCol' in p))

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
    const resourcesFromZenodeo = getResourcesFromSource('zenodeo');

    const schema = {};
    
    params.forEach(p => {
        if (p.name === 'sortby') {
            const resourceId = getResourceid(resource);
            p.schema.default = p.schema.default.replace(
                /resourceId/, 
                resourceId
            );
        }

        if (resourcesFromZenodeo.includes(resource)) {
            if (p.schema.type === 'array') {
                if (p.name === 'cols') {
                    
                    p.schema.items.enum = getCols(resource).map(c => c.name);

                    // allow empty col as in "cols=''"
                    p.schema.items.enum.push('');

                    p.schema.default = getDefaultCols(resource)
                        .map(c => c.name);

                    // p.schema.errorMessage = {
                    //     properties: {
                    //         enum: 'should be one of: ' + p.schema.default.join(', ') + '. Provided value is ${/enum}'
                    //     }
                    // }
                }
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

const dispatch = {
    getResources,
    getSourceOfResource,
    // getResourcesFromSource,
    // getParams,
    getQueryableParams,
    // getCols,
    // getDefaultCols,
    getFacetCols,
    getSqlCols,
    getSelect,
    getWhere,
    getZqltype,
    getSqltype,
    getQueryStringSchema,
    getResourceid,
    getJoin,
    getNotCols,
    // getSqlDefs
    tableFromResource
}

const test = () => {
    if (process.argv.length <= 2) {
        console.log('available functions are:');
        console.log('- ' + Object.keys(dispatch).join('\n- '));
    }
    else {
        const [one, two, fn, ...args] = process.argv;
        console.log(fn, ...args);
        console.log('-'.repeat(50));
        console.log(dispatch[fn](...args));
        //console.log(util.inspect(dispatch[fn](...args), false, 4, true));
        //console.log('bar')
    }
}

// https://stackoverflow.com/a/66309132/183692
import path from 'path';
import { fileURLToPath } from 'url';

const path1 = path.resolve(process.argv[1]);
const path2 = path.resolve(fileURLToPath(import.meta.url));
const nodePath = path1.split('/').pop().split('.')[0];
const modulePath = path2.split('/').pop().split('.')[0];

if (nodePath === modulePath) {
    test();
}

export { dispatch }