'use strict'

const config = require('config')

const ajvOpts = config.get('v3.ajv.options.customOptions')
const Ajv = require('ajv')
const ajv = new Ajv(ajvOpts)
require("ajv-errors")(ajv)

const { getSchema, getResourceid, getSelname, getJoin, getZqltype, getFacetCols } = require('../../data-dictionary/dd-utils')
const zUtils = require('./z-utils')

// const Database = require('better-sqlite3')
// const db = new Database(config.get('data.treatments'))

// // https://github.com/JoshuaWise/better-sqlite3/issues/102#issuecomment-369468174
// db.prepare(`ATTACH DATABASE '${config.get('data.collections')}' AS z3collections`).run()
// db.prepare(`ATTACH DATABASE '${config.get('data.facets')}' AS z3facets`).run()

const sqlformatter = require('sql-formatter-plus')
const log = require('../../lib/utils').logger('ZQL')

/**********************************************************
** 
** A SQL SELECT statement is made up of following clauses
** 
** SELECT   [<cols>] 
** FROM     [<table or tables with JOINs>]
** WHERE    [<constraints>]
** ORDER BY [<col> <dir>, <col> <dir> …]
** LIMIT    <int>
** OFFSET   <int>
** 
** The first two clauses (SELECT and FROM) are mandatory.
** The remaining clauses are optional
************************************************************/
const getFullSql = (columns, tables, constraints, sortorder, limit, offset) => {
    const parts = [
        `SELECT ${columns.join(', ')}`,
        `FROM ${tables.join(' ')}`,
    ]

    if (constraints.length) parts.push(`WHERE ${constraints.join(' AND ')}`)
    if (sortorder && sortorder.length) parts.push(`ORDER BY ${sortorder.join(', ')}`)
    if (limit) parts.push(`LIMIT ${limit}`)
    if (offset !== undefined) parts.push(`OFFSET ${offset}`)

    return parts.join(' ')
}

const getCountSql = (columns, tables, constraints) => {
    const parts = [
        `SELECT Count(${columns[0]}) AS num_of_records`,
        `FROM ${tables.join(' ')}`,
    ]

    if (constraints.length) parts.push(`WHERE ${constraints.join(' AND ')}`)

    return parts.join(' ')
}

const getColumns = function(resource, params) {
    
    // The resourceId is always present in the SELECT clause
    // so we start with that as the first column
    const resourceId = getResourceid(resource)
    const columns = [ resourceId.selname ]

    // add the 'selname' of all other columns
    const cols = params.$cols.filter(c => c !== resourceId.name)
        .map(c => getSelname(resource, c))

    columns.push( ...cols )

    return columns
}

const getTables = function(resource, params) {

    // the resource table is always present in the SQL
    // so we start with that as the first table
    const tables = [ resource ]

    // for all the params, add table JOINs if they exist
    const resourceId = getResourceid(resource)
    Object.keys(params)
        .filter(p => p !== 'deleted')
        .filter(p => p.substring(0, 1) !== '$')
        .filter(p => p !== resourceId.name)
        .forEach(p => { const t = getJoin(resource, p, 'query'); if (t) tables.push(...t) })

    // The returned cols are also used to determine any table JOINs
    if (params.$cols.length) {
        params.$cols.forEach(c => {
            const t = getJoin(resource, c, 'select')
            if (t) tables.push(...t)
        })
    }
    
    // return uniq
    return [...new Set(tables)]
}

const calcConstraint = function(resource, param, value) {
    const zqltype = getZqltype(resource, param)
    return zUtils._calcConstraint(zqltype, resource, param, value)
}

const getConstraints = function(resource, params) {
    const constraints = []
    const runparams = {}

    Object.keys(params)
        .filter(p => p !== 'deleted')
        .filter(p => p.substring(0, 1) !== '$')
        .map(p => calcConstraint(resource, p, params[p]))
        .forEach(p => {
            constraints.push(p.constraint)

            for (let [key, val] of Object.entries(p.runparam)) {
                runparams[ key ] = val
            } 
        })

    return { constraints, runparams }
}

const getSortorder = function(resource, params) {
    if ('$sortby' in params) {
        return params.$sortby.split(',').map(o => {
            const arr = o.split(':')
            return [ `${arr[0]} ${arr[1].toUpperCase()}` ]
        })
    }
}

const getLimit = function(resource, params) {
    return params.$size
}

const getOffset = function(resource, params) {
    return params.$page - 1
}

const getFacetQueries = (resource, params) => {
    const facets = {}
    const columns = getFacetCols(resource)
    
    columns.forEach(c => {
        const tables = [ resource ]
        if (c.tables) {
            tables.push(c.tables)
        }

        facets[c.name] = `SELECT ${c.name}, count FROM (SELECT ${c.name}, Count(${c.name}) AS count FROM ${tables.join(' JOIN ')} WHERE ${c.name} != '' GROUP BY ${c.name} HAVING ${c.facet} ORDER BY count DESC LIMIT 50) AS t ORDER BY ${c.name} ASC`
    })

    return facets
}

// check if the submitted params conform to the schema
const validate = function(resource, params) {
    const schema = getSchema(resource)
    const validator = ajv.compile(schema)
    const valid = validator(params)

    if (valid) {
        return params
    }
    else {
        log.error(validator.errors)
        return false
    }
}

const zql = function({ resource, params }) {
    params = validate(resource, params)
    
    if (params) {
        const columns = getColumns(resource, params)
        const tables = getTables(resource, params)
        const { constraints, runparams } = getConstraints(resource, params)

        let fullSql = ''
        let facets

        const resourceId = getResourceid(resource)
        if (resourceId.name in params) {
            fullSql = getFullSql(columns, tables, constraints)
        }
        else {

            // we return fullSql **only** if $cols is not empty
            if (params.$cols.length) {
                const sortorder = getSortorder(resource, params)
                const limit = getLimit(resource, params)
                const offset = getOffset(resource, params)

                fullSql = getFullSql(columns, tables, constraints, sortorder, limit, offset)
            }
        }

        const countSql = getCountSql(columns, tables, constraints)

        if (params.$facets) {
            facets = getFacetQueries(resource, params)
        }

        return {
            queries: { fullSql, countSql, facets },
            runparams
        }
    }
}

const test = () => {
    const inputs = {
        q0: {
            resource: 'treatments',
            params: {
                $facets: true
            }
        },

        q1: {
            resource: 'treatments',
            params: {
                treatmentId: 'DFG3456SDFS342GHFD543245FDRGSTRE',
                $page: 3,
                $size: 25,
                $cols: [
                    'treatmentTitle',
                    'treatmentDOI'
                ]
            }
        },

        q2: {
            resource: 'figureCitations',
            params: {
                'figureCitationId': 'DFG3456SDFS342GHFD543245FDRGSTRE'
            }
        },

        q3: {
            resource: 'figureCitations',
            params: {
                '$page': 3,
                '$size': 25,
                'captionText': 'foo'
            }
        },

        q4: {
            resource: 'treatments',
            params: {
                q: 'Meshram',
                location: 'within(radius:50, units: kilometers, lat:25.6532, lng:3.48)',
                rank: 'species',
                $page: 7,
                $size: 70,
                $cols: [
                    'treatmentId',
                    'treatmentTitle'
                ],
                $sortby: 'journalYear.asc, zenodoDep.desc'
            }
        },

        q5: {
            resource: 'treatments',
            params: { 
                location: "within(radius:50.09, units: kilometers, lat:-25.6532, lng:-3.48)"
            }
        },

        q6: {
            resource: 'figureCitations',
            params: {
                '$page': 1,
                '$size': 30,
                'treatmentId': 'DFG3456SDFS342GHFD543245FDRGSTRE'
            }
        },

        q7: {
            resource: 'treatments',
            params: { 
                publicationDate: 'since(2018-1-12)',
                $cols: []
            }
        },

        q8: {
            resource: 'treatments',
            params: { 
                publicationDate: 'between(2018-1-12 and 2019-9-3)',
                $page: 1,
                $size: 30
            }
        },

        q9: {
            resource: 'treatments',
            params: { 
                authorityName: 'starts_with(Agosti)'
            }
        },

        q10: {
            resource: 'treatments',
            params: {
                'treatmentId': '03A0156F4B2CFF8B83E61C59FA09FF74'
            }
        },

        q11: {
            resource: 'figureCitations',
            params: {
                'treatmentId': '017D5369FFF0FF8255ACE98AB5CFF8D0'
            }
        },

        q12: {
            resource: 'materialsCitations',
            params: {
                materialsCitationId: '38C63CC3D74CDE17E88B8E25FCD2D91C'
            }
        },

        q13: {
            resource: 'treatments',
            params: {
                q: 'formica'
            }
        },

        q14: {
            resource: 'treatments',
            params: {}
        },

        q15: {
            resource: 'collectionCodes',
            params: {
                collectionCode: 'MACN',
                '$cols': [ 'collectionCode', 'institution_name' ]
            }
        },

        q16: {
            resource: 'treatments',
            params: {
                q: 'shrimp',
                httpUri: 'ne("")',
                '$cols': [ 'treatmentId', 'treatmentTitle', 'httpUri', 'captionText' ]
            }
        },

        q17: {
            resource: 'families',
            params: {
                q: 'form'
            }
        },

        q18: {
            resource: 'treatments',
            params: {
                treatmentTitle: 'form'
            }
        }
    }

    if (process.argv.length < 3) {
        console.log('available inputs')
        for (let k in inputs) {
            console.log(`\t- ${k}: ${JSON.stringify(inputs[k], null, 4)}`)
        }

        return
    }

    const input = process.argv[2]
    const i = inputs[input]
    console.log(i)
    const { queries, runparams } = zql(i)
 
    log.info(sqlformatter.format(queries.fullSql))
    log.info(sqlformatter.format(queries.countSql, { params: runparams }))

    if (queries.facets) {
        for (let f in queries.facets) {
            console.log(sqlformatter.format(queries.facets[f]))
        }
    }
}

// https://stackoverflow.com/questions/6398196/detect-if-called-through-require-or-directly-by-command-line?rq=1
if (require.main === module) {
    test()
} 
else {
    module.exports = zql
}