'use strict'

const util = require('util')
const commonparams = require('./commonparams')
const JSON5 = require('json5')
const resources = require('./index')
const inquirer = require('inquirer')

/*
elements are extracted from articles (-> 'cheerio')
and stored in a db (-> 'sqltype' ) table (-> 'resource').

rest query is made of params that can be directly mapped to 
a sql column (-> 'name') or a sql expression (-> 'selname').
In some cases, the sql expression has to be calculated 
based on the values of the param submitted in the query.

every param has an enry in the data-dictionary. The entry 
includes a schema (-> 'schema') that describes the data type 
of the param


query: ?q=foo
param: q
selname: snippet(vtreatments, 1, '<b>', '</b>', '…', 25) snippet

    {
        name: 'q',
        schema: {
            type: 'string',
            description: 'A snippet extracted from the full text of the treatment'
        },
        selname: "snippet(vtreatments, 1, '<b>', '</b>', '…', 25) snippet",
        sqltype: 'TEXT',
        cheerio: '',
        defaultCols: false,
        defaultOp: 'match',
        where: 'vtreatments',
        queryable: true,
        join: [ 'JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId'  ],
        facet: ''
    }
*/

// resources: REST resources that map 1 -> 1 to SQL tables
const getResources = () => resources.map(r => r.name)

// sourceOfResource: [ 'zenodeo', 'zenodo' ] 
const getSourceOfResource = (resource) => resources
    .filter(r => r.name === resource)[0].source

// params: all entries in the data dictionary for a given resource
const getParams = (resource) => resources
    .filter(r => r.name === resource)[0].dictionary
    .concat(...commonparams)

// All params that can be used in a REST query for a resource
// const getAllParams = function(resource) {
//     // return JSON5.parse(
//     //     JSON5.stringify(
//     //         resources
//     //             .filter(r => r.name === resource)[0].dictionary
//     //             .concat(...commonparams)
//     //     )
//     // )


//     return resources
//         .filter(r => r.name === resource)[0].dictionary
//         .concat(...commonparams)
// }

// queryableParams: dd entries that can exist in a REST query
const getQueryableParams = (resource) =>  getParams(resource)
    .filter(p => p.queryable !== false)

// cols: all entries in a SQL table
const getCols = (resource) => getParams(resource)
    .filter(p => p.sqltype)
    .map(p => {
        return {
            name: p.name, 
            selname: p.selname || p.name, 
            where: p.where || '', 
            join: p.join || '',
            sqltype: p.sqltype,
            zqltype: p.zqltype || 'text'
        }
    })

// defaultCols: a defaultCol is returned if no columns are 
// specified in a REST query via $cols
const getDefaultCols = (resource) => getCols(resource)
    .filter(p => p.defaultCols === true)

// facetCols: all cols that can be used in facet queries
const getFacetCols = (resource) => getCols(resource)
    .filter(p => p.facet)

// All queryable params of a resource.
// All params are queryable unless 'false'
// const getQueryableParams = function(resource) {
//     const allParams = getAllParams(resource)
//     //console.log(allParams)
//     return allParams
//         .filter(p => p.queryable !== false)
//         .map(p => {
//             return {
//                 name: p.name, 
//                 selname: p.selname || p.name, 
//                 cheerio: p.cheerio,
//                 where: p.where || '', 
//                 join: p.join || '',
//                 sqltype: p.sqltype,
//                 zqltype: p.zqltype ? p.zqltype : 'text',
//                 schema: p.schema
//             }
//         })
// }

// selname: the column name or expression used in a SQL query
const getSelname = (resource, column) => getCols(resource)
    .filter(c => c.name === column)[0].selname

const getZqltype = (resource, column) => getQueryableParams(resource)
    .filter(c => c.name === column)[0].zqltype

// const getSqlTypes = function(resource) {
//     return getAllCols(resource)
//         .map(p => {
//             const sqltype = {}
//             sqltype[ p.name ] = p.sqltype
//             return sqltype
//         })
// }

// const getSourceOfResource = function(resource) {
//     return resources
//         .filter(r => r.name === resource)[0].source
// }

const getResourcesFromSpecifiedSource = function(source) {
    return resources
        .filter(r => r.source === source)
}

// All queryable params of a resource with default values
const getQueryableParamsWithDefaults = function(resource) {
    const resourceId = getResourceId(resource)
    const params = getQueryableParams(resource)
    
    const p = params
        .filter(p => 'default' in p.schema)
        .map(p => {
            if (typeof p.schema.default === 'string') {
                p.schema.default = p.schema.default.replace(/resourceId/, resourceId.selname)
            }

            return p
        })

    return p
}

const getNamesOfQueryableParams = function(resource) {
    return getQueryableParams(resource)
        .map(p => p.name)
}

// A param is a col if sqltype is present
// const getAllCols = function(resource) {
//     return getAllParams(resource)
//         //.filter(p => p.sqltype)
//         .map(p => {
//             return {
//                 name: p.name, 
//                 selname: p.selname || p.name, 
//                 cheerio: p.cheerio,
//                 where: p.where || '', 
//                 join: p.join || '',
//                 sqltype: p.sqltype,
//                 getConstraint: p.getConstraint
//             }
//         })
// }

const getNamesOfAllCols = function(resource) {
    return getAllCols(resource)
        .map(p => p.name)
}

// A param is a part of the set of default columns 
// if 'defaultCols' is true
// const getDefaultCols = function(resource) {
//     return getAllParams(resource)
//         .filter(p => p.defaultCols === true)
//         .map(p => { 
//             return {
//                 name: p.name, 
//                 selname: p.selname || p.name,
//                 join: p.join
//             }
//         })
// }

const getSchema = function(resource) {
    const queryableParams = getQueryableParams(resource)
    //console.log(queryableParams)
    const resourceId = getResourceId(resource)
    const resourcesFromZenodeo = getResourcesFromSpecifiedSource('zenodeo')
        .map(r => r.name)

    const schema = {
        type: 'object',
        properties: {},
        additionalProperties: false
    }
    
    queryableParams.forEach(p => {
        if (p.schema.default && typeof(p.schema.default) === 'string') {
            p.schema.default = p.schema.default.replace(/resourceId/, resourceId.selname)
        }

        if (resourcesFromZenodeo.includes(resource)) {
            if (p.schema.type === 'array') {
                if (p.name === '$cols') {
                    p.schema.items.enum = getAllCols(resource).map(c => c.name)
                    p.schema.default = getDefaultCols(resource).map(c => c.name)
                    p.schema.errorMessage = {
                        properties: {
                            enum: 'should be one of: ' + p.schema.default.join(', ') + '. Provided value is ${/enum}'
                        }
                    }
                }
                // else {
                //     p.schema.errorMessage = `should be one of: ${p.schema.default.join(', ')}`
                // }
            }
        }

        schema.properties[p.name] = p.schema
    })

    return schema
}

const getResourceId = function(resource) {
    const col = getAllParams(resource)
        .filter(c => c.schema.isResourceId)[0]

    return { 
        name: col.name, 
        selname: col.selname || col.name 
    }
}

const getForeignKey = function(resource) {
    const cols = columns[resource]
    const fk = cols.filter(c => c.type === 'fk')
    if (fk.length) {
        return fk[0].name
    }
}

const getRequiredParams = function(resource) {
    const rp = {}

    getAllParams(resource)
        .filter(c => c.required === true)
        .forEach(c => {rp[c.name] = {default: c.default}})

    return rp
}



const getConstraint = function(resource, column) {
    const c = getAllCols(resource)
        .filter(c => c.name === column)
        
    //console.log(c)
    return c[0].getConstraint

}

const getWhere = function(resource, column) {
    return getAllCols(resource)
        .filter(c => c.name === column)[0].where
}

const getJoin = function(resource, column, joinType) {
    const col = getAllParams(resource).filter(c => c.name === column)[0]
    if (joinType) {
        return col.joins ? col.joins[joinType] : null
    }
    else {
        return col.joins ? true : false 
    }
}

// Finding the number of function parameters in JavaScript
// https://stackoverflow.com/a/6293830/183692
const getArgs = (f) => {
    let args = f.toString()
    args = args.split('\n').join('')
    args = args.replace(/^function\((.*?)\).*/,'$1').split(', ')
    return args
}

const dispatch = {
    getResources,
    getAllParams,
    getAllCols,
    getAllFacetColumns,
    getQueryableParams,
    getSqlTypes,
    getSourceOfResource,
    getResourcesFromSpecifiedSource,
    getQueryableParamsWithDefaults,
    getNamesOfQueryableParams,
    getNamesOfAllCols,
    getDefaultCols,
    getSchema,
    getResourceId,
    getForeignKey,
    getRequiredParams,
    getSelName,
    getZQLType,
    getWhere,
    getConstraint,
    getJoin
}

const test = () => {
    const a = {
        type: 'list',
        name: 'fn',
        message: 'Please choose a function:',
        choices: Object.keys(dispatch)
    }

    const b = {
        type: 'list',
        name: 'in',
        message: 'Please choose a resource:',
        choices: dispatch.getResources()
    }

    const d = {
        type: 'list',
        name: 'in',
        message: 'Please choose a join type:',
        choices: ['query', 'select']
    }

    const inputs = [ a ]
      
    inquirer.prompt(inputs).then((answers) => {
        const func = answers.fn
        const args = getArgs(dispatch[func])

        if (args) {
            if (args.length == 1) {
                const inputs = [ b ]

                inquirer.prompt(inputs).then((answers) => {
                    const resource = answers.in
                    const res = dispatch[func](resource)
                    console.log(util.inspect(res, {showHidden: false, depth: null, colors: true}))
                })
            }
            else if (args.length == 2) {
                const inputs = [ b ]

                inquirer.prompt(inputs).then((answers) => {
                    const resource = answers.in
                    const inputs = [ 
                        {
                            type: 'list',
                            name: 'in',
                            message: 'Please choose a column:',
                            choices: dispatch.getAllCols(resource)
                        }
                    ]

                    inquirer.prompt(inputs).then((answers) => {
                        const column = answers.in
                        const res = dispatch[func](resource, column)
                        console.log(util.inspect(res, {showHidden: false, depth: null, colors: true}))
                    })
                })
            }
            else if (args.length == 3) {
                const inputs = [ b ]

                inquirer.prompt(inputs).then((answers) => {
                    const resource = answers.in
                    const inputs = [ 
                        {
                            type: 'list',
                            name: 'in',
                            message: 'Please choose a column:',
                            choices: dispatch.getAllCols(resource)
                        }
                    ]

                    inquirer.prompt(inputs).then((answers) => {
                        const column = answers.in
                        const res = dispatch[func](resource, column)
                        if (res) {
                            const inputs = [ d ]

                            inquirer.prompt(inputs).then((answers) => {
                                const joinType = answers.in
                                const res = dispatch[func](resource, column, joinType)
                                console.log(util.inspect(res, {showHidden: false, depth: null, colors: true}))
                            })
                        }
                        else {
                            console.log('This column has no JOINs')
                        }
                        
                    })
                })
            }
        }
        else {
            const res = dispatch[func]()
            console.log(util.inspect(res, {showHidden: false, depth: null, colors: true}))
        }
    })
}

// https://stackoverflow.com/questions/6398196/detect-if-called-through-require-or-directly-by-command-line?rq=1
if (require.main === module) {
    test()
}
else {
    module.exports = dispatch
}