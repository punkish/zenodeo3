'use strict'

const sqlformatter = require('sql-formatter-plus')
const { getSchema, getQueryableParams, getDefaultCols, getResourceId, getSelName, getWhere, getAllFacetColumns, getJoin } = require('../../data-dictionary/dd-utils')
const turf = require('@turf/turf')
const JSON5 = require('json5')
const config = require('config')
const ajvOpts = config.get('v3.ajv.options.customOptions')
const Ajv = require('ajv')
const ajv = new Ajv(ajvOpts)
require("ajv-errors")(ajv)
const log = require('../../lib/utils').logger('ZQL')
const querystring = require('querystring')

const operators = {

    // numeric and string operators
    eq            : '=',
    ne            : '!=',

    // numeric operators
    gte           : '>=',
    lte           : '<=',
    gt            : '>',
    lt            : '<',
    
    // also between

    // string operators
    like          : 'LIKE',
    starts_with   : 'LIKE',
    ends_with     : 'LIKE',
    contains      : 'LIKE',

    // date operators
    between       : 'BETWEEN',
    since         : '>=',
    until         : '<=',

    // spatial operator
    within        : 'BETWEEN',
    near          : 'BETWEEN',

    // fts5
    match         : 'MATCH'
}

const makeDate = (date) => {
    let [y, m, d] = date.split('-')

    if (m.length < 2) {
        m = m.padStart(2, '0')
    }

    if (d.length < 2) {
        d = d.padStart(2, '0')
    }

    return `${y}-${m}-${d}`
}

const validate = (q) => {
    const { resource, params } = q    
    const schema = getSchema(resource)
    
    const valid = ajv.validate(schema, params);
    if (!valid) {
        log.error(ajv.errors)
        return false
    }
    else {
        console.log(params)
        return true
    }
}

const facetQueries = ({ resource, params }) => {
    const facets = {}
    const columns = getAllFacetColumns(resource)

    columns.forEach(c => {
        
        const tables = [ resource ]
        if (c.tables) {
            tables.push(c.tables)
        }

        facets[c.name] = `SELECT ${c.name}, count FROM (SELECT ${c.name}, Count(${c.name}) AS count FROM ${tables.join(' JOIN ')} WHERE ${c.name} != '' GROUP BY ${c.name} HAVING ${c.facet} ORDER BY count DESC LIMIT 50) AS t ORDER BY ${c.name} ASC`
    })

    return facets
}


const regularQueries = ({ resource, params }) => {
    const queryableParams = getQueryableParams(resource)

    const _getFullSql = (columns, tables, constraints, sortorder, limit, offset) => {
        return `SELECT ${columns.join(', ')} FROM ${tables.join(' ')} WHERE ${constraints.join(' AND ')} ${sortorder ? 'ORDER BY ' + sortorder.join(', ') : ''} LIMIT ${limit} OFFSET ${offset}`
    }

    const _getCountSql = (columns, tables, constraints, sortorder, limit, offset) => {
        return `SELECT Count(${columns[0]}) AS num_of_records FROM ${tables.join(' ')} WHERE ${constraints.join(' AND ')}`
    }

    // https://stackoverflow.com/questions/19874555/how-do-i-convert-array-of-objects-into-one-object-in-javascript
    const _defaultOps = queryableParams
        .reduce((o, i) => Object.assign(o, { [ i.name ]: i.defaultOp || 'eq' }), {})  
    
    const _getSelect = (resource, params) => {

        // The resourceId as it is always present in the SELECT clause
        const resourceId = getResourceId(resource)
        const columns = [ resourceId.selname ]

        // The columns to be returned by the SQL query are determined 
        // two-ways:
        // 1. if $cols exists in params:
        // 1.1. if $cols is list, we use only it in SELECT 
        // 1.2. if $cols is empty, we return only the count
        // 2. if no $cols then params are returned along with defaultCols
        if ('$cols' in params) {
            if (params.$cols !== '') {

                // make sure to filter out the resourceId as it is 
                // automatically included in every query
                columns.push(...params.$cols.filter(c => c !== resourceId.name).map(c => getSelName(resource, c)))
            }
        }
        else {
            columns.push(...Object.keys(params)
                .filter(p => p !== 'deleted')
                .filter(p => p.substring(0, 1) !== '$')
                .filter(p => p !== resourceId.name)
                .map(p => getSelName(resource, p)))
            
            columns.push(...getDefaultCols(resource).map(c => c.selname || c.name))
        }

        // return uniq
        return [...new Set(columns)]
    }

    const _getFrom = (resource, params) => {
        const tables = [ resource ]
        
        const resourceId = getResourceId(resource)

        // The returned cols are also used to determine any table JOINs
        if ('$cols' in params) {
            if (params.$cols !== '') {
                params.$cols.forEach(c => {
                    const t = getJoin(resource, c, 'select')
                    if (t) tables.push(...t)
                })
            }
        }

        Object.keys(params)
            .filter(p => p !== 'deleted')
            .filter(p => p.substring(0, 1) !== '$')
            .filter(p => p !== resourceId.name)
            .forEach(p => { const t = getJoin(resource, p, 'query'); if (t) tables.push(...t) })
            
        // return uniq
        return [...new Set(tables)]
    }

    const _getWhere = (params) => {
        log.info('_getWhere() -> getting constraints')

        const _getConstraint = (p, v) => {
            log.info(`_getConstraint() -> param: ${p}, value: ${v}`)

            /**
             * Outputs proper key, operator and value to use in bind and debug SQL
             * @author Puneet Kishor <github.com/punkish>
             * @param {string} key - Left side of the operator,
             * @param {string} operator - The operator.
             * @param {string} value - Right side of the operator.
             */
            const _getConstraintParts = function(pre_left, pre_operator, pre_right) {
                log.info(`_getConstraintParts() -> pl: ${pre_left}, po: ${pre_operator}, pr: ${pre_right}`)
                
                pre_left = getSelName(resource, pre_left)
                log.info(`_getConstraintParts() -> sel name: ${pre_left}`)

                const constraint = []
                const runparam = {}

                switch(pre_operator) {
                    case 'starts_with':
                    case 'like':
                        constraint.push(`${pre_left} ${operators[ pre_operator ]} @${pre_left}`)
                        runparam[pre_left] = `${pre_right}%`
                        break

                    case 'ends_with':
                        constraint.push(`${pre_left} ${operators[ pre_operator ]} @${pre_left}`)
                        runparam[pre_left] = `${pre_right}%`
                        break

                    case 'contains':
                        constraint.push(`${pre_left} ${operators[ pre_operator ]} @${pre_left}`)
                        runparam[pre_left] = `%${pre_right}%`
                        break

                    case 'match':
                        constraint.push(`${pre_left} ${operators[ pre_operator ]} @${pre_left}`)
                        runparam[pre_left] = `${pre_right}`
                        break

                    case 'between':
                        const [from, to] = pre_right.toLowerCase().split(' and ').map(d => makeDate(d))

                        constraint.push(`date(${pre_left}) ${operators[ pre_operator ]} @from AND @to`)
                        runparam.from = `date(${from})`
                        runparam.to = `date(${to})`
                        break

                    case 'since':
                    case 'until':
                        constraint.push(`date(${pre_left}) ${operators[ pre_operator ]} @${pre_left}`)
                        runparams[pre_left] = `date(${pre_right})`
                        break

                    case 'within':
                    case 'near': 
                        const re = new RegExp(/{radius:\s*(?<radius>.*?),\s*units:\s*(?<units>.*?),\s*lat:\s*(?<lat>.*?),\s*lng:\s*(?<lng>.*?)}/)
                        const locparams = pre_right.match(re)
                        
                        const coords = [ Number(locparams.groups.lng), Number(locparams.groups.lat) ]
                        const radius = pre_operator === 'near' ? 1 : Number(locparams.groups.radius)
                        const units = locparams.groups.units

                        const buffered = turf.buffer(
                            turf.point(coords), 
                            radius, 
                        { units: units }
                        )

                        const [ min_lng, min_lat, max_lng, max_lat ] = turf.bbox(buffered)

                        constraint.push(`latitude ${operators[ pre_operator ]} @min_lat AND @max_lat`)
                        runparam.min_lat = min_lat
                        runparam.max_lat = max_lat

                        constraint.push(`longitude ${operators[ pre_operator ]} @min_lng AND @max_lng`)
                        runparam.min_lng = min_lng
                        runparam.max_lng = max_lng
                        break
                }

                return { constraint: constraint.join(' AND '), runparam }
            }

            //let left = getWhere(resource, p) ?
            //let operator
            let right
            log.info(`_getConstraint() -> left: ${left}, operator: ${operator}, right: ${right}`)
    
            const i = v.match(/(?<op>\w+)\((?<val>.*?)\)/)

            // if there was no match for 'i', no zql operator
            // was submitted. The param is a straightforward
            // left=right pair
            if (i === null || i === -1) {
                operator = _defaultOps[p]
                operator = operators[ operator ]
                right = v

                const { constraint, runparam } = _getConstraintParts(left, operator, right)
                return { constraint, runparam }
            }
            else {
                operator = i.groups.op
                right = i.groups.val

                const { constraint, runparam } = _getConstraintParts(left, operator, right)
                return { constraint, runparam }
            }
        }

        const constraints = []
        const runparams = {}

        Object.keys(params)
            .filter(p => p !== 'deleted')
            .filter(p => p.substring(0, 1) !== '$')
            .map(p => _getConstraint(p, params[p]))
            .forEach(p => {
                constraints.push(p.constraint)

                for (let [key, value] of Object.entries(p.runparam)) {
                    runparams[key] = value
                }
            })

        return { constraints, runparams }
    }

    const _getOrder = (params) => {
        if ('$sortby' in params) {
            return params.$sortby.split(',').map(o => {
                const arr = o.split(':')
                return [ `${arr[0]} ${arr[1].toUpperCase()}` ]
            })
        }
    }

    const _getLimitAndOffset = (params) => {
        return {
            limit: params.$size,
            offset: params.$page
        }
    }

    // SELECT columns
    const columns = _getSelect(resource, params)

    // FROM tables
    const tables = _getFrom(resource, params)

    // WHERE constraints
    const { constraints, runparams } = _getWhere(params)

    // ORDER BY sortorder
    const sortorder = _getOrder(params)

    // LIMIT ? OFFSET ?
    const { limit, offset } = _getLimitAndOffset(params)

    const fullSql = _getFullSql(columns, tables, constraints, sortorder, limit, offset)
    const countSql = _getCountSql(columns, tables, constraints, sortorder, limit, offset)

    //console.log(`--- full sql ${'-'.repeat(50)}`)
    // log.info(sqlformatter.format(fullSql, { params: runparams }))
    // //console.log(`--- count sql ${'-'.repeat(50)}`)
    // log.info(sqlformatter.format(countSql, { params: runparams }))
    // //console.log(`--- runparams ${'-'.repeat(50)}`)
    // log.info(runparams)

    return { queries: { fullSql, countSql }, runparams }

}

/**********************************************************
 * 
 * A SQL SELECT statement is made up of following clauses
 * 
 * SELECT   [<cols>] 
 * FROM     [<table or tables with JOINs>]
 * WHERE    [<constraints>]
 * ORDER BY [<col> <dir>, <col> <dir> …]
 * LIMIT    <int>
 * OFFSET   <int>
 * 
 * The first two clauses SELECT and FROM are mandatory.
 * The remaining clauses are optional.
**********************************************************/
const zql = ({ resource, params }) => {

    // we convert the qs to an object
    //const params = querystring.parse(qs)

    // check if the submitted params conform to the schema
    const schema = getSchema(resource)

    const validator = ajv.compile(schema)
    if (!validator(params)) {
        log.error(validator.errors)
        return false
    }

    // params were ok, so let's move on  
    const { queries, runparams } = regularQueries({ resource, params })

    if (params.$facets) {
        queries.facets = facetQueries({ resource, params })
    }
    
    return { queries, runparams }
}

const dispatch = {
    validate,
    zql
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
            qs: 'treatmentId=DFG3456SDFS342GHFD543245FDRGSTRE&$page=3&$size=25&$cols=treatmentTitle&$cols=treatmentDOI'
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
            qs: 'q=Meshram&location=within({radius:50, units: kilometers, lat:25.6532, lng:3.48})&rank=species&$page=7&$size=70&$cols=treatmentId&&$cols=treatmentTitle&$sortby=journalYear.asc,zenodoDep.desc'
        },

        q5: {
            resource: 'treatments',
            params: { 
                location: "within({ radius:100, units: 'kilometers', lat: 0, lng: 0})"
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
                $page: 1,
                $size: 30
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
                'treatmentId': '017D5369FFF0FF8255ACE98AB5CFF8D0',
                //'captionText': 'hemelytra',
                //'$cols': [ 'httpUri' ]
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
                q: 'formica',
                '$cols': [ 'treatmentId', 'treatmentTitle', 'q' ]
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
            qs: 'q=form'
        },

        q18: {
            resource: 'treatments',
            params: {
                treatmentTitle: 'form'
            }
        }
    }

    if (process.argv.length < 3) {
        console.log('available functions')
        console.log('\t- ' + Object.keys(dispatch).join('\n\t- ') + '\n')

        console.log('available inputs')
        for (let k in inputs) {
            console.log(`\t- ${k}: ${JSON5.stringify(inputs[k], null, 4)}`)
        }

        return
    }

    const fn = process.argv[3]
    const input = inputs[process.argv[5]]

    const res = dispatch[fn](input)
    if (fn === 'zql') {
        console.log(sqlformatter.format(res.queries.fullSql))
        //console.log(sqlformatter.format(res.queries.countSql))
        if (res.queries.facets) {
            for (let f in res.queries.facets) {
                console.log(sqlformatter.format(res.queries.facets[f]))
            }
        }
        console.log(res.runparams)
    }
    else {
        console.log(res)
    }
    
}


// https://stackoverflow.com/questions/6398196/detect-if-called-through-require-or-directly-by-command-line?rq=1
if (require.main === module) {
    test()
} 
else {
    module.exports = dispatch
}
