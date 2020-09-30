'use strict'

// const definitions = require('./definitions')
// const commonparams = require('./commonparams')
const sqlformatter = require('sqlformatter')
const { allParams } = require('../../data-dictionary/dd-utils')
const turf = require('@turf/turf')
const JSON5 = require('json5')

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
    within       : 'BETWEEN',
    near         : 'BETWEEN',

    // fts5
    match        : 'MATCH'
}

// All params are queryable unless 'false'
const queryableParams = (resources, resource) => {
    const params = allParams(resources, resource)
    return params.filter(p => p.queryable !== false)
}

// A param is a part of the set of default columns 
// if 'defaultCols' is true
const defaultCols = (resource) => {
    const params = allParams(resource)
    return params
        .filter(p => p.defaultCols === true)
        .map(p => { 
            return {
                sqlname: p.sqlname || p.name, 
                join: p.join
            }
        })
}

// A param is a col if sqltype is present
const allCols = (resource) => {
    const params = allParams(resource)
    return params
        .filter(p => p.sqltype)
        .map(p => {
            return {
                name: p.name, sqlname: p.sqlname || p.name, 
                where: p.where || '', 
                join: p.join || ''
            }
        })
}

/**
 * Outputs proper key, operator and value to use in bind and debug SQL
 * @author Puneet Kishor <github.com/punkish>
 * @param {string} key - Left side of the operator,
 * @param {string} op - The operator.
 * @param {string} value - Right side of the operator.
 */
const ops = function(key, op, value, colNames) {
    
    let val
    let keydebug
    switch(op) {
        case 'eq':
            val = value
            break

        case 'starts_with':
            val = `%${value}`
            break

        case 'ends_with':
            val = `${value}%`
            break

        case 'contains':
            val = `%${value}%`
            break

        case 'between':
            const [from, to] = value.toLowerCase().split(' and ')

            key = {
                'date(publicationDate)': {
                    binds: 'date(@from) AND date(@to)',
                    param: { from: from, to: to },
                    debug: `date(${from}) AND date(${to})`
                }
            }
            
            break

        case 'since':
        case 'until':
            key = {
                'date(publicationDate)': {
                    binds: 'date(@date)',
                    param: { date: value },
                    debug: `date${value}`
                }
            }

            break

        case 'within':
        case 'near':
            const w = JSON5.parse(value)
            
            let radius = w.radius
            if (op === 'near') {
                radius = 1
            }

            let units = w.units || 'kilometers'
            if (units !== 'kilometers') {
                if (units === 'kms') {
                    units = 'kilometers'
                }
            }

            const buffered = turf.buffer(
                turf.point([ w.lng, w.lat ]), 
                radius, 
                { units: units }
            )

            const [ min_lng, min_lat, max_lng, max_lat ] = turf.bbox(buffered)

            key = {
                latitude: {
                    binds: '@min_lat AND @max_lat',
                    param: { min_lat: min_lat, max_lat: max_lat },
                    debug: `${min_lat} AND ${max_lat}`
                },
                longitude: {
                    binds: '@min_lng AND @max_lng',
                    param: { min_lng: min_lng, max_lng: max_lng },
                    debug: `${min_lng} AND ${max_lng}`
                }
            }
            
            break

        default:
            val = value
    }

    op = operators[op]

    if (typeof(key) === 'string') {
        if (colNames[key].wherekey) {
            key = colNames[key].wherekey
        }

        return {
            k: key, 
            o: op, 
            v: val, 
            p: null,
            d: keydebug
        }
    }
    else {
        const res = []
        for (let kp in key) {
            const r = {
                k: kp,
                o: op,
                v: key[kp].binds,
                p: key[kp].param,
                d: key[kp].debug
            }
            res.push(r)
        }

        return res
    }
}

const checkQuery = (query) => {
    const resource = query.resource
    const params = query.params

    if (!resource) throw new Error('ERROR: "resource" is missing')
    if (!params) throw new Error('ERROR: "params" are missing')

    return { resource: resource, params: params }
}

const where = (resource, params) => {

    const allColumns = queryableParams(resource)

    const tables = [ resource ]
    const constraints = {
        binds: [],
        debug: []
    }

    const runparams = {}
    const colNames = {}
    allColumns.forEach(c => {
        colNames[c.name] = { 
            sqlname: c.sqlname || c.name, 
            where: c.where || '', 
            join: c.join || '' 
        }
    })

    // https://stackoverflow.com/questions/19874555/how-do-i-convert-array-of-objects-into-one-object-in-javascript
    const defaultOps = allColumns.reduce((o, i) => 
        //const name = i.queryString ? i.queryString : i.name
        Object.assign(o, { [ i.name ]: i.defaultOp }), {}
    )
    
    for (let key in params) {

        // ignore all keys starting with '$'
        if (key.indexOf('$') === -1) {
            
            if (colNames[key].join) {
                tables.push(colNames[key].join)
            }
            
            
            const value = params[key]

            // if a ZQL operator is present, it will be in the value
            // and the value will be a string
            let i
            if (typeof value === 'string' || value instanceof String) {
                i = value.match(/(?<operator>\w+)\((?<val>.*?)\)/)
            }

            
            // if a zql operator is missing, that is, a bare query 
            // value has been submitted, we use the default operator 
            // defined in the data dictionary
            if (i === null || i === -1) {

                const defaultOp = defaultOps[key]
                const o = operators[defaultOp]
                
                let wherekey = colNames[key].sqlname
                if (colNames[key].where) {
                    wherekey = colNames[key].where
                }

                constraints.binds.push(`${wherekey} ${o} @${key}`)
                constraints.debug.push(`${wherekey} ${o} '${value}'`)

                runparams[key] = value
            }
            else {
                
                console.log(`key: ${key}`)
                console.log(`value: ${value}`)
                
                const operator = i.groups.operator
                if (!Object.keys(operators).includes(operator)) {
                    throw `Error: "${operator}" is not a valid operator`
                }

                const res = ops(key, operator, i.groups.val, colNames)

                if ((operator === 'within') || (operator === 'near') || (operator === 'between')) {
                    res.forEach(e => {
                        constraints.binds.push(`${e.k} ${e.o} ${e.v}`)
                        constraints.debug.push(`${e.k} ${e.o} ${e.d}`)

                        for (let k in e.p) {
                            runparams[k] = e.p[k]
                        }
                    })
                }
                else {
                    constraints.binds.push(`${res.k} ${res.o} @${res.k}`)
                    constraints.debug.push(`${res.k} ${res.o} ${res.v}`)

                    runparams[res.k] = res.v
                }
            }
        }
    }

    return { constraints: constraints, tables: tables, runparams: runparams }
}

const sortby = (resource, params) => {
    if ('$sortby' in params) {
        return params.$sortby.split(',').map(o => {
            const arr = o.split('.')
            return [ `${arr[0]} ${arr[1].toUpperCase()}` ]
        })
    }
    else {
        return ''
    }
}

const selfrom = (resource, params) => {
    
    const cols = []
    //const tables = [ resource ]

    // SELECT cols FROM tables
    if ('$cols' in params) {
        const allColumns = allCols(resource)
        const submittedCols = params.$cols

        let i = 0
        const j = submittedCols.length
        for (; i < j; i++) {
            const col = submittedCols[i]
            const vc = allColumns.filter(c => c.name === col)
            
            if (vc.length === 1) {
                cols.push(vc[0].sqlname)
                //if (vc[0].join) tables.push(vc[0].join)
            }
            else {
                throw new Error(`invalid column "${col}" requested in $cols`)
            }
        }
    }
    else {
        const columns = defaultCols(resource)
        
        for (let c in columns) {
            cols.push(columns[c].sqlname)
            //if (columns[c].join) tables.push(columns[c].join)
        }
    }

    //return { cols: cols, tables: tables }
    return cols
}

const limoff = (resource, params) => {
    return {
        limit: params.$size,
        offset: params.$page
    }
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
const zql = (query) => {
    const { resource, params } = checkQuery(query)

    /*************************************************************
     * 'binds' queries are used to actually run against the db
     * They use bind params (@param)
     *
     * 'debug' queries use the actual param values and are used
     * in the result (in dev or test mode) for debugging 
     * purpose
    /*************************************************************/
    const queries = { 
        count: { binds: [], debug: [] },
        records: { binds: [], debug: [] }
    }

    const cols = selfrom(resource, params)
    const { constraints, tables, runparams } = where(resource, params)
    const orderby = sortby(resource, params)
    const { limit, offset } = limoff(resource, params)

    let stm
    if (tables.length > 1) {
        stm = 'SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records'
        queries.count.binds.push(stm)
        queries.count.debug.push(stm)

        stm = `SELECT DISTINCT ${cols.join(", ")}`
        queries.records.binds.push(stm)
        queries.records.debug.push(stm)
    }
    else {
        stm = 'SELECT Count(*) AS num_of_records'
        queries.count.binds.push(stm)
        queries.count.debug.push(stm)

        stm = `SELECT ${cols.join(', ')}`
        queries.records.binds.push(stm)
        queries.records.debug.push(stm)
    }

    stm = `FROM ${tables.join(' JOIN ')}`
    queries.count.binds.push(stm)
    queries.records.binds.push(stm)
    queries.count.debug.push(stm)
    queries.records.debug.push(stm)

    if (constraints.binds.length) {
        stm = `WHERE ${constraints.binds.join(' AND ')}`
        queries.count.binds.push(stm)
        queries.records.binds.push(stm)

        stm = `WHERE ${constraints.debug.join(' AND ')}`
        queries.count.debug.push(stm)
        queries.records.debug.push(stm)
    }
    
    if (orderby) {
        stm = `ORDER BY ${orderby}`
        queries.records.binds.push(stm)
        queries.records.debug.push(stm)
    }

    if (limit) {
        stm = `LIMIT ${limit} OFFSET ${offset}`
        queries.records.binds.push(stm)
        queries.records.debug.push(stm)
    }

    return { queries: queries, runparams: runparams }
}

const dispatch = {
    zql: zql
}

const test = () => {

    const inputs = {
        q0: {
            resource: 'treatments',
            params: {
                '$page': 1,
                '$size': 30
            }
        },

        q1: {
            resource: 'treatments',
            params: {
                '$page': 3,
                '$size': 25,
                '$cols': 'treatmentTitle, doi',
                'treatmentId': 'DFG3456SDFS342GHFD543245FDRGSTRE'
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
                location: 'within({"r":50, "units": "kilometers", "lat":25.6532, "lng":3.48})',
                rank: 'species',
                $cols: 'treatmentId, treatmentTitle',
                $page: 5,
                $size: 70,
                $sortby: 'journalYear.asc,zenodoDep.desc'
            }
        },

        q5: {
            resource: 'treatments',
            params: { 
                location: 'within({"r":50, "units": "kilometers", "lat":0, "lng":0})',
                $page: 1,
                $size: 30
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
    }

    if (process.argv.length <= 5) {
        console.log("Usage: node " + __filename.split('/').pop() + " --fn <functions> --in <input>")

        console.log()

        console.log('available functions')
        console.log('\t- ' + Object.keys(dispatch).join('\n\t- '))

        console.log()

        console.log('available inputs')
        for (let k in inputs) {
            console.log(`\t- ${k}: ${JSON5.stringify(inputs[k])}\n`)
        }

        process.exit(-1);
    }

    const fn = process.argv[3]
    const input = inputs[process.argv[5]]
    
    const res = dispatch[fn](input)
    console.log(sqlformatter.format(res.queries.count.binds.join(' ')))
    console.log(sqlformatter.format(res.queries.records.binds.join(' ')))
    console.log(res.runparams)
}


// https://stackoverflow.com/questions/6398196/detect-if-called-through-require-or-directly-by-command-line?rq=1
if (require.main === module) {
    test()
} 
else {
    module.exports = dispatch
}