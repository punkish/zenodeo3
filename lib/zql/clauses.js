'use strict'

const JSON5 = require('json5')
const columns = require('../../data-dictionary/index')
const turf = require('@turf/turf')

const operators = {
    eq           : '=',
    gte          : '>=',
    lte          : '<=',
    gt           : '>',
    lt           : '<',
    starts_with  : 'LIKE',
    ends_with    : 'LIKE',
    contains     : 'LIKE',

    // date operators
    between      : 'BETWEEN',
    since        : '>=',
    until        : '<=',

    // spatial operator
    within       : '!=',
    near         : '!='
}

const dateExtract = function(value) {
    let date
    if (typeof value === 'string' || value instanceof String) {
        date = JSON5.parse(value)
    }
    else if (typeof value === 'object' || value instanceof Object) {
        value = value
    }

    return `date('${date.y}-${new String(date.m).padStart(2, '0')}-${new String(date.d).padStart(2, '0')}')`
}

/**
 * Outputs proper key, operator and value to use in bind and debug SQL
 * @author Puneet Kishor <github.com/punkish>
 * @param {string} key - Left side of the operator,
 * @param {string} op - The operator.
 * @param {string} value - Right side of the operator.
 */
const ops = function(key, op, value) {
    
    let val
    let keydebug
    switch(op) {
        case 'eq':
            val = value
        case 'starts_with':
            val = `'%${value}'`
            break
        case 'ends_with':
            val = `'${value}%'`
            break
        case 'contains':
            val = `'%${value}%'`
            break
        case 'between':
            const dates = JSON5.parse(value)
            val = `${dateExtract(dates.from)} AND ${dateExtract(dates.to)}`
            break
        case 'since':
        case 'until':
            val = dateExtract(value)
            break
        case 'within':
        case 'near':

            const w = JSON.parse(value)
            const units = w.units

            let radius = w.r
            if (op === 'near') {
                radius = 1
            }

            const buffered = turf.buffer(
                turf.point([ w.lng, w.lat ]), 
                radius, 
                { units: units }
            )

            // The buffer produces a multipolygon (even though it is a 
            // simple polygon, so it is represented by an array of array 
            // of coordinates. I have to use the one and only poly in 
            // that array. The following does the trick
            const poly = JSON.stringify(buffered.geometry.coordinates[0])

            key = 'geopoly_within(_shape, @poly)'
            keydebug = `geopoly_within(_shape, '${poly}')`
            val = 0
            break
        default:
            val = value
    }

    op = operators[op]
    
    return {
        k: key, 
        o: op, 
        v: val, 
        d: keydebug
    }
}

const parens = function(key, value, colNames, defaultOps, colsWithJoinTables, clauses, resource) {

    const cols = columns[resource]

    if (key in colsWithJoinTables) {
        clauses.tables.push(colsWithJoinTables[key])
    }

    // first, let's check if the key begins with '$'
    let i = key.indexOf('$')

    // a $ zql operator defines LIMIT, OFFSET and ORDER BY
    // SQL clauses. A $ zql operator is represented by a 
    // query param that starts with '$'
    if (i === 0) {
        switch(key) {
            case '$page':
                clauses.offset = value - 1
                break
            case '$size':
                clauses.limit = value
                break
            case '$sortby':
                clauses.orderby = value.split(',').map(o => {
                    const arr = o.split('.')
                    return [ `${arr[0]} ${arr[1].toUpperCase()}` ]
                })
                break
            case '$cols':
                if (value.toLowerCase() === 'default') {
                    //clauses.cols = defaultCols(resource)
                    //clauses.cols = cols.filter(c => c.defaultset)
                }
                else if (value.toLowerCase() === 'all') {
                    clauses.cols = cols
                }
                else {
                    clauses.cols = value.split(',')
            
                    for (let i = 0, j = clauses.cols.length; i < j; i++) {
                        const c = clauses.cols[i]
                        if (! cols.includes(c)) {
                            throw `invalid column ${c} provided in the cols param`
                        }
                    }
                }

                break
            default:
                throw `invalid operator ${key} provided in the query`
        }

    }

    // no '$' was found in the key, so we will check for ZQL operators
    else if (i === -1) {

        // if a ZQL operator is present, it will be in the value
        // and the value will be a string
        if (typeof value === 'string' || value instanceof String) {
            i = value.match(/(?<operator>\w+)\((?<val>.*?)\)/)
        }

        // if a zql operator is missing, that is, a bare query 
        // value has been submitted, we use the default operator 
        // defined in the data dictionary
        if (i === null || i === -1) {
            if (colNames.includes(key)) {
                const defaultOp = defaultOps[key]
                const o = operators[defaultOp]

                if (key === 'publicationDate') {
                    value = dateExtract(value)
                }

                clauses.constraints.binds.push(`${key} ${o} @${key}`)
                clauses.constraints.debug.push(`${key} ${o} ${value}`)
            }
        }
        else {
            const { k, o, v, d } = ops(key, i.groups.operator, i.groups.val)
            
            if ((i.groups.operator === 'within') || (i.groups.operator === 'contains') || (i.groups.operator === 'near')) {
                clauses.constraints.binds.push(`${k} ${o} ${v}`)
                clauses.constraints.debug.push(`${d} ${o} ${v}`)
            }
            else {
                clauses.constraints.binds.push(`${k} ${o} @${k}`)
                clauses.constraints.debug.push(`${k} ${o} ${v}`)
            }
        }
    }
}

/*******************************************
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
*******************************************/
const clauses = function({ resource, params }) {
    
    const cols = columns[resource]

    // clauses with default values
    const clauses = {
        cols        : cols.filter(c => c.defaultSet).map(c => c.select ? c.select : c.name),
        tables      : [ resource ],
        constraints : { binds: [], debug: [] },
        orderby     : [],
        limit       : 30,
        offset      : 0
    }

    const colNames   = cols.map(c => c.name)

    // https://stackoverflow.com/questions/19874555/how-do-i-convert-array-of-objects-into-one-object-in-javascript
    const defaultOps = cols.reduce((o, i) => Object.assign(o, { [i.name]: i.defaultOp }), {})
    const colsWithJoinTables = cols.filter(c => c.jointable).reduce((o, i) => Object.assign(o, { [i.name]: i.jointable }), {})

    for (const key in params) {
        parens(key, params[key], colNames, defaultOps, colsWithJoinTables, clauses, resource)
    }

    return clauses
}

module.exports = clauses