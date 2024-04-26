'use strict';

import process from 'node:process';
import util from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
    getResourceProperties,
    getResources,
    getResource,
    getParams,
    getParam,
    getDefaultCols,
    getDefaultParams,
    getFacetParams,
    getQueryStringSchema,
    getResourceId,
    getPk
} from './resourceUtils.js';

import { 
    getTableSchemas,
    getTables,
    getTable,
    getCols,
    getCol,
    getNotCols,
    getXmlCols,
    getDOM,
    createTable,
    createIndexes
} from './tableUtils.js';

const functions = [
    { getResources          , args: '<property>'                            },
    { getResource           , args: '[resourceName], <property>'            },
    { getTableSchemas       , args: ''                                      },
    { getTables             , args: '<property>'                            },
    { getTable              , args: '[tableName], <property>'               },
    { createTable           , args: '[resourceName]'                        },
    { createIndexes         , args: '[resourceName]'                        },
    { getParams             , args: '[resourceName]'                        },
    { getParam              , args: '[resourceName], <keyname>, <property>' },
    { getResourceId         , args: '[resourceName]'                        },
    { getDefaultCols        , args: '[resourceName]'                        },
    { getCols               , args: '[tableName]'                           },
    { getCol                , args: '[tableName], [colname], <property>'    },
    { getXmlCols            , args: '[tableName]'                           },
    { getDOM                , args: '[tableName]'                           },
    { getDefaultParams      , args: '[resourceName]'                        },
    { getFacetParams        , args: '[resourceName]'                        },
    { getQueryStringSchema  , args: "resourceName"                          },
    { getResourceId         , args: "resourceName"                          },
    { getPk                 , args: "resourceName"                          },
    { getNotCols            , args: ""         },
    //{ createFtsTable, args: '[resourceName]' },
    // { getSourceOfResource   , args: "resource" },
    // { getResourcesFromSource, args: "source"   },
    // { getQueryableParams    , args: "resource" },
    // { getSqlCols, args: '[resourceName]' },
    // { getSqlCol, args: '[resourceName, column, clause]' },
    //{ addExternalDef, args: 'externalParam, params' }
    // { tableFromResource     , args: "resource" },
    // { getSelect             , args: "resource, column" },
    // { getWhere              , args: "resource, column" },
    // { getZqltype            , args: "resource, column" },
    // { getSqltype            , args: "resource, column" },
    // { getJoin               , args: "resource, column, type" }
]

//
// a simple cache to speed up lookups
const D = { stack: ['index'] };
const ddutils = {};
functions.forEach(f => ddutils[Object.keys(f)[0]] = Object.values(f)[0]);

// 
// Detect if this program is called as a module or 
// directly from the command line
// 
// https://stackoverflow.com/a/66309132/183692
const nodePath = path.resolve(process.argv[1]);
const modulePath = path.resolve(fileURLToPath(import.meta.url))

if (nodePath === modulePath) {

    // this program was called from the command line
    const [ fn, ...args ] = process.argv.slice(2);
    
    if (!fn) {
        console.log(`
dd utils
${'*'.repeat(79)}
            
USAGE: node data-dictionary/utils/index.js func args
${'-'.repeat(79)}
choose a function (or its number) from the following:
        `);

        const f = functions.map((f, i) => {
            const funcName = Object.keys(f)[0];
            const args = f.args;
            return `${String(i + 1).padStart(2, ' ')}. ${funcName}(${args})`;
        }).join('\n');

        const resources = getResources('name').join("\n\t- ");
        const tables = getTables('name').join("\n\t- ");
        const properties = getResourceProperties();
        console.log(`
${f}

[params] in square brackets are required
<params> in angle brackets are optional
[resourceName] choose one from the following:
\t- ${resources}
[tableName] choose one from the following:
\t- ${tables}
<property> choose from one of the following: 
\t- ${properties}
[column: see getSqlCols([resourceName])]
[clause: 'select'|'where']
        `)
    }
    else {
        const f = Number.isInteger(Number.parseInt(fn))
            ? Object.keys(functions[fn - 1])[0]
            : fn;

        const result = ddutils[f](...args);
        //const result = '';
        //util.inspect(result, false, null, true)
        console.log(`
function: ${f}(${args.join(',')})
${'-'.repeat(50)}
${typeof(result) === 'object' ? util.inspect(result, false, null, true): result}
${'-'.repeat(50)}
        `);
    }
}

export { ddutils, D }