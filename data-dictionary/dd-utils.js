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

const getResourcesFromSpecifiedSource = (source) => resources
    .filter(r => r.source === source)
    .map(r => r.name)

const getResourceid = (resource) => {
    const col = getCols(resource)
        .filter(c => c.isResourceId)[0]

    return { 
        name: col.name, 
        selname: col.selname || col.name 
    }
}

// params: all entries in the data dictionary for a given resource
const getParams = (resource) => resources
    .filter(r => r.name === resource)[0].dictionary
    .concat(...commonparams)

// queryableParams: dd entries that are allowed in a REST query
const getQueryableParams = (resource) => {
    const p = getParams(resource)
    .filter(p => p.queryable !== false)
    //console.log(util.inspect(p, {showHidden: false, depth: null, colors: true}))
    return p
}

// All queryable params of a resource with default values
const getQueryableParamsWithDefaults = function(resource) {
    const resourceId = getResourceid(resource)
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

// cols: columns suitable to make a SQL query. Columns in the 
// SELECT clause can be different from those in the JOIN or  
// the WHERE clauses
const getCols = (resource) => getParams(resource)
    .map(p => {
        return {
            name: p.name, 
            selname: p.selname || p.name, 
            isResourceId: p.schema.isResourceId || false,
            where: p.where || p.selname || p.name, 
            join: p.join || '',
            sqltype: p.sqltype,
            zqltype: p.zqltype || 'text',
            isDefaultCol: p.defaultCols || false,
            facet: p.facet || false
        }
    })

// defaultCols: columns that are returned if no columns are 
// specified in a REST query via $cols
const getDefaultCols = (resource) => getCols(resource)
    .filter(p => p.isDefaultCol === true)

// facetCols: all cols that can be used in facet queries
const getFacetCols = (resource) => getCols(resource)
    .filter(p => p.facet)

const getSqlCols = (resource) => getParams(resource)
    .map(p => {
        return {
            name: p.name, 
            isResourceId: p.schema.isResourceId || false,
        }
    })

// selname: the column name or expression used in a SQL query
const getSelname = (resource, column) => getCols(resource)
    .filter(c => c.name === column)[0].selname

// where: the column name used in the WHERE clause of a SQL query
const getWhere = (resource, column) => getCols(resource)
    .filter(c => c.name === column)[0].where

const getZqltype = (resource, column) => getCols(resource)
    .filter(c => c.name === column)[0].zqltype

// schema: we use the schema to validate the query params
const getSchema = function(resource) {
    const queryableParams = JSON.parse(JSON.stringify(getQueryableParams(resource)))
    const resourceId = getResourceid(resource)
    const resourcesFromZenodeo = getResourcesFromSpecifiedSource('zenodeo')
        //.map(r => r.name)

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
                    p.schema.items.enum = getCols(resource).map(c => c.name)
                    p.schema.default = getDefaultCols(resource).map(c => c.name)
                    p.schema.errorMessage = {
                        properties: {
                            enum: 'should be one of: ' + p.schema.default.join(', ') + '. Provided value is ${/enum}'
                        }
                    }
                }
            }
        }

        schema.properties[p.name] = p.schema
    })

    return schema
}

const getJoin = (resource, column, joinType) => {
    const col = getParams(resource)
        .filter(c => c.name === column)[0]

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
    getSourceOfResource,
    getResourcesFromSpecifiedSource,
    getParams,
    getQueryableParams,
    getQueryableParamsWithDefaults,
    getCols,
    getDefaultCols,
    getFacetCols,
    getSqlCols,
    getSelname,
    getWhere,
    getZqltype,
    getSchema,
    getResourceid,
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
    
    /*
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
    */
}

// https://stackoverflow.com/questions/6398196/detect-if-called-through-require-or-directly-by-command-line?rq=1
// if (require.main === module) {
//     test()
// }
// else {
    module.exports = dispatch
// }