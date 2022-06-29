'use strict'

import util from 'node:util';
import { commonparams } from './resources/commonparams.js';
import * as resources from './resources/index.js'

/*
elements are extracted from articles (-> 'cheerio')
and stored in a db (-> 'sqltype' ) table (-> 'resource').

A REST query is made of params that can be directly mapped to 
a sql column (-> 'name') or a sql expression (-> 'selname').
In some cases, the sql expression has to be calculated 
based on the values of the param submitted in the query.

Every param has an entry in the data-dictionary. The entry 
includes a schema (-> 'schema') that describes the data type 
of the param


query string pattern
`<resource>/?<key> =<val>&<key> =<val>`

## Case 1

condition:  query key maps directly to a resource column
example  :  `treatments/?treatmentTitle=some text`
dd       :  {
                name: 'treatmentTitle'
            }
select   :  ${resource}.${key.name}
            treatments.treatmentTitle
operator :  =
where    :  ${resource}.${key.name} ${operator} ${val} 
            treatments.treatmentTitle = 'some text'

## Case 2

condition:  query param maps to an expression
example  :  `treatments/?q=some text`
dd       :  {
                name: 'q'
                alias: {
                    select: "snippet(vtreatments, 1, '<b>', '</b>', '…', 25) snippet",
                    where : 'vtreatments'
                }
            }
select   :  ${key.alias.select}
            snippet(vtreatments, 1, '<b>', '</b>', '…', 25) snippet
operator :  MATCH
where    :  ${key.alias.where} = ${val}
            vtreatments MATCH 'some text'

## Case 3

condition:  query param maps to a column from a different resource
example  :  `treatments/?httpUri=ne('')`
dd       :  {
                name: 'httpUri'
                alias: {
                    select: 'figureCitations.httpUri',
                    where : 'figureCitations.httpUri'
                }
            }
operator :  !=
select   :  ${key.alias.select}
            figureCitations.httpUri
where    :  ${key.alias.where} = ${val}
            figureCitations.httpUri != ''
*/

// resources: REST resources that map 1 -> 1 to SQL tables
// returns an array of resource names
const getResources = () => Object.keys(resources);

// returns the source ('zenodeo' or 'zenodo') of a given resource
const getSourceOfResource = (resource) => resources[resource];

// // returns the resources from a given source ('zenodeo' or 'zenodo')
// const getResourcesFromSource = (source) => resources
//     .filter(r => r.source === source)
//     .map(r => r.name);

// // params: all entries in the data dictionary for a given resource
// const getParams = (resource) => {
//     const params = resources
//         .filter(r => r.name === resource)[0].dictionary
//         .concat(...commonparams);

//     params.forEach(p => {
//         p.selname = p.sqltype ? `${resource}.${p.name}` : p.name;
//     })

//     return params;
// }

// // resourceId of a resource
// const getResourceid = (resource) => {
//     const resourceId = getParams(resource)
//         .filter(p => p.isResourceId)[0];
    
//     // return {
//     //     name: resourceId.name,
//     //     selname: resourceId.selname
//     // }
//     return resourceId.name;
// }

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
// const getQueryableParams = (resource) => getParams(resource)
//     .filter(p => !('notQueryable' in p));

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
// const getCols = (resource) => getParams(resource)
//     .map(p => {
//         return {
//             name: p.name, 
//             schema: p.schema,
//             selname: getSelect(resource, p.name), 
//             isResourceId: p.schema.isResourceId || false,
//             wherename: getWhere(resource, p.name), 
//             join: p.join || '',
//             sqltype: p.sqltype,
//             zqltype: p.zqltype || 'text',
//             isDefaultCol: 'notDefaultCol' in p ? true : false,
//             facet: p.facet || false
//         }
//     })

// // defaultCols: columns that are returned if no columns are 
// // specified in a REST query via 'cols'
// const getDefaultCols = (resource) => getParams(resource)
//     .filter(p => !('notDefaultCol' in p))

// // facetCols: all cols that can be used in facet queries
// const getFacetCols = (resource) => getCols(resource)
//     .filter(p => p.facet)

// const getSqlCols = (resource) => getParams(resource)
//     .map(p => {
//         return {
//             name: p.name, 
//             isResourceId: p.schema.isResourceId || false,
//             cheerio: p.cheerio
//         }
//     })

// const getSqlDefs = (resource) => getParams(resource)
//     .filter(p => p.sqltype)
//     .map(p => {
//         return p.alias && p.alias.create ? 
//             `${p.alias.create} ${p.sqltype}` :
//             `${p.name} ${p.sqltype}`
//     })

// const _getName = (resource, col, type) => {
//     return col.alias && col.alias[type] ? 
//         col.alias[type] : 
//         `${resource}.${col.name}`
// }

// // getSelect: the column name or expression used in a SQL query
// const getSelect = (resource, column) => {
//     const col = getParams(resource).filter(p => p.name === column)[0];
//     return _getName(resource, col, 'select');
// }

// // where: the column name used in the WHERE clause of a SQL query
// const getWhere = (resource, column) => {
//     const col = getParams(resource).filter(p => p.name === column)[0];
//     return _getName(resource, col, 'where');
// }

// const getJoin = (resource, column, type) => {
//     const col = getParams(resource).filter(c => c.name === column)[0];
//     return col.joins ? col.joins[type] : '';
// }

// const getZqltype = (resource, column) => getCols(resource)
//     .filter(c => c.name === column)[0].zqltype;

// // schema: we use the schema to validate the query params
// const getSchema = function(resource) {

//     // make a deep copy of params because they[*] will be modified
//     // [*] specifically, 'sortyby' will be modified
//     const params = JSON.parse(JSON.stringify(getParams(resource)));
//     const resourcesFromZenodeo = getResourcesFromSource('zenodeo');

//     const schema = {
//         type: 'object',
//         properties: {},
//         additionalProperties: false
//     };
    
//     params.forEach(p => {
//         if (p.name === 'sortby') {
//             const resourceId = getResourceid(resource);
//             p.schema.default = p.schema.default.replace(
//                 /resourceId/, 
//                 `${resource}.${resourceId}`
//             );
//         }

//         if (resourcesFromZenodeo.includes(resource)) {
//             if (p.schema.type === 'array') {
//                 if (p.name === 'cols') {
                    
//                     p.schema.items.enum = getCols(resource).map(c => c.name);

//                     // allow empty col as in "cols=''"
//                     p.schema.items.enum.push('');

//                     p.schema.default = getDefaultCols(resource).map(c => c.name);
//                     p.schema.errorMessage = {
//                         properties: {
//                             enum: 'should be one of: ' + p.schema.default.join(', ') + '. Provided value is ${/enum}'
//                         }
//                     }
//                 }
//             }
//         }

//         schema.properties[p.name] = p.schema;
//     })

//     return schema
// }

// const getNotCols = () => commonparams.map(c => c.name);

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
    // getQueryableParams,
    // getCols,
    // getDefaultCols,
    // getFacetCols,
    // getSqlCols,
    // getSelect,
    // getWhere,
    // getZqltype,
    // getSchema,
    // getResourceid,
    // getJoin,
    // getNotCols,
    // getSqlDefs
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

const nodePath = path.resolve(process.argv[1]).split('/').pop();
const modulePath = path.resolve(fileURLToPath(import.meta.url)).split('/').pop().split('.')[0];
//const calledViaCLI = nodePath === modulePath;
// console.log(`foo: ${nodePath}`)
// console.log(`foo: ${modulePath}`)
// console.log(`foo: ${isRunningDirectlyViaCLI}`)
if (nodePath === modulePath) {
    test();
    //console.log('foo')
}