'use strict'

const { logger } = require('../../lib/utils')
const log = require('../../lib/utils').logger('ZQL-UTILS')

const config = require('config')
const ajvOpts = config.get('v3.ajv.options.customOptions')
const Ajv = require('ajv')
const ajv = new Ajv(ajvOpts)
require("ajv-errors")(ajv)

const turf = require('@turf/turf')
const ddUtils = require('../../data-dictionary/dd-utils')

const re = {
    date: '\\d{4}-\\d{1,2}-\\d{1,2}',
    year: '^\\d{4}$',
    real: '((\\+|-)?(\\d+)(\\.\\d+)?)|((\\+|-)?\\.?\\d+)'
}

const patterns = {
    loc: [
        `^(?<zop>within)\\(radius:\\s*(?<radius>${re.real}),\\s*units:\\s*(?<units>kilometers|miles),\\s*lat:\\s*(?<lat>${re.real}),\\s*lng:(?<lng>${re.real})\\)$`,
        `^(?<zop>near)\\(lat:\\s*(?<lat>${re.real}),\\s*lng:(?<lng>${re.real})\\)$`
    ],

    date: [
        `^(?<zop>between)\\((?<from>${re.date})\\sand\\s(?<to>${re.date})\\)$`,
        `^(?<zop>since|until)\\((?<date>${re.date})\\)$`
    ],

    //number: [],

    text: [
        `^(?<zop>like|starts_with|ends_with|contains)\\((?<text>\.*?)\\)$`,
    ]
}

// table of zops to sql operators
const zops = {

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

// check if the submitted params conform to the schema
const validate = function({ resource, params }) {
    const schema = ddUtils.getSchema(resource)
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

const formatDate = (date) => {
    let [y, m, d] = date.split('-')
    if (m.length < 2) m = m.padStart(2, '0')
    if (d.length < 2) d = d.padStart(2, '0')
    return `${y}-${m}-${d}`
}

/*

The queryString is made up of key-value pairs separated by '&'
Within each pair, the key and the value are separated by '='

Two kinds of patterns are possible
    <key> = <value>
    <key> = <zql>(<value>)

1. Convert queryString into an object of k,v pairs
2. evaluate each k,v pair
    - convert key to 'left' by using getWhere()
    - evaluate value to see if it contains a ZQL operator (zop)
        - yes:
            - convert zop to operator
            - convert value to 'right'
        - no:
            - find default operator
            - convert value to 'right'

*/
const getConstraint = (resource, key, val) => {
    log.info(`getConstraint() -> ${resource}, ${key}, ${val}`)
    const constraint = []
    const runparam = {}

    // The val (right side of the k,v pair) is either a string
    // or a boolean or a number. ZQL operators are only present
    // in strings.
    if (typeof(val) === 'string') {

        // first, lets check if there is an ZQL operator in 
        // the val
        const zqltype = ddUtils.getZqltype(resource, key)
        let matched = false

        for (const pattern of patterns[zqltype]) {
            const res = val.match(pattern)

            if (res) {
                matched = true
                const g = res.groups
                const zop = g.zop.toLowerCase()
                const operator = zops[ zop ]

                log.info(`getConstraint() -> string ZQL ${JSON.stringify(g)}`)
    
                if (zqltype === 'loc') {
                    const coords = [ Number(g.lng), Number(g.lat) ]
    
                    // default radius and units for 'near'
                    let radius = 1
                    let units = 'kilometers'
    
                    if (zop === 'within') {
                        radius = Number(g.radius)
                        units = g.units
                    }
    
                    const buffered = turf.buffer(
                        turf.point(coords), 
                        radius, 
                        { units: units }
                    )
    
                    const [ min_lng, min_lat, max_lng, max_lat ] = turf.bbox(buffered)
    
                    constraint.push(`latitude ${operator} @min_lat AND @max_lat`)
                    runparam.min_lat = min_lat
                    runparam.max_lat = max_lat
    
                    constraint.push(`longitude ${operator} @min_lng AND @max_lng`)
                    runparam.min_lng = min_lng
                    runparam.max_lng = max_lng
                }
                else if (zqltype === 'date') {
                    if (zop === 'between') {
                        const from = formatDate(g.from)
                        const to = formatDate(g.to)
        
                        constraint.push(`date(${key}) ${operator} @from AND @to`)

                        runparam.from = `date('${from}')`
                        runparam.to = `date('${to}')`
                    }
                    else if (zop === 'since' || zop === 'until') {
                        const date = formatDate(g.date)
        
                        constraint.push(`date(${key}) ${operator} @date`)
                        runparam.date = `date('${date}')`
                    }
                    
                    //convert Object null prototype to regular Object
                    // https://stackoverflow.com/questions/56298481/how-to-fix-object-null-prototype-title-product#comment111312577_60333849
                    //runparam = { ...g }
                }
                // else if (zqltype === 'number') {
                // }
                else if (zqltype === 'text') {
                    const left = `LOWER(${key})`
                    const right = g.text.toLowerCase()
    
                    constraint.push(`${left} ${operator} @${key}`)
                    if (zop === 'like') {
                        runparam[key] = right
                    }
                    else if (zop === 'starts_with') {
                        runparam[key] = `${right}%`
                    }
                    else if (zop === 'ends_with') {
                        runparam[key] = `%${right}`
                    }
                    else if (zop === 'contains') {
                        runparam[key] = `%${right}%`
                    }
                }
    
                break
            }
        }

        // if matched is still false, no ZQL operator
        // was found. Let's try to determine a nonzql 
        // constraint
        if (!matched) {
            log.info(`getConstraint() -> string no ZQL`)
            

            const queryableParams = ddUtils.getQueryableParams(resource)
    
            // https://stackoverflow.com/questions/19874555/how-do-i-convert-array-of-objects-into-one-object-in-javascript
            const _defaultOps = queryableParams
                .reduce((o, i) => Object.assign(o, {[i.name]: i.defaultOp || 'eq'}), {})
        
            const zop = _defaultOps[ key ]
            const operator = zops[ zop ]
        
            if ((zop === 'eq') || (zop === 'match')) {
                const left = ddUtils.getWhere(resource, key)
                constraint.push(`${left} ${operator} @${key}`)
                runparam[key] = val
            }
            else {
                const left = `LOWER(${ddUtils.getWhere(resource, key)})`
                const right = val.toLowerCase()
                
                constraint.push(`${left} ${operator} @${key}`)
                if (zop === 'like') {
                    runparam[key] = right
                }
                else if (zop === 'starts_with') {
                    runparam[key] = `${right}%`
                }
                else if (zop === 'ends_with') {
                    runparam[key] = `%${right}`
                }
                else if (zop === 'contains') {
                    runparam[key] = `%${right}%`
                }
            } 
        }
    }

    // val is not a string, so it is either a boolean or a 
    // number. It is going to be a straightforward left op right
    // constraint
    else {
        log.info(`getConstraint() -> no string`)
        if (typeof(val) === 'boolean') {
            const left = ddUtils.getWhere(resource, key)
            constraint.push(`${left} = ${key}`)
        }
        else {
            const left = ddUtils.getWhere(resource, key)
    
            const queryableParams = ddUtils.getQueryableParams(resource)
        
            // https://stackoverflow.com/questions/19874555/how-do-i-convert-array-of-objects-into-one-object-in-javascript
            const _defaultOps = queryableParams
                .reduce((o, i) => Object.assign(o, {[i.name]: i.defaultOp || 'eq'}), {})
    
            const zop = _defaultOps[key]
            const operator = zops[zop]
        
            constraint.push(`${left} ${operator} @${key}`)
            runparam[key] = val
        }

    }

    // zUtils.packMatch(match, constraint, runparam)
    return { constraint, runparam }
}

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
const getSql = ({ type, columns, tables, constraints, sortorder, limit, offset }) => {
    const parts = [
        type === 'count' ? 
            `SELECT Count(${columns[0]}) AS num_of_records` : 
            `SELECT ${columns.join(', ')}`,
        
        `FROM ${tables.join(' ')}`
    ]

    if (constraints.length) parts.push(`WHERE ${constraints.join(' AND ')}`)
    if (type === 'full') {
        if (sortorder && sortorder.length) parts.push(`ORDER BY ${sortorder.join(', ')}`)
        if (limit) parts.push(`LIMIT ${limit}`)
        if (offset !== undefined) parts.push(`OFFSET ${offset}`)
    }

    return parts.join(' ')
}

module.exports = {
    validate,
    formatDate,
    getConstraint,
    getSql
}