'use strict'

const clauses = require('./clauses')
const sqlformatter = require('sqlformatter')

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
const zql = function({resource, params}) {
    const sqlclauses = clauses({resource, params})

    const queries = {
        count: {
            binds: [ 'SELECT Count(*) AS num_of_records' ],
            debug: [ 'SELECT Count(*) AS num_of_records' ]
        }
    }

    if (sqlclauses.tables.length > 1) {
        queries.records = {
            binds: [ `SELECT DISTINCT ${sqlclauses.cols.join(', ')}` ],
            debug: [ `SELECT DISTINCT ${sqlclauses.cols.join(', ')}` ]
        }
    }
    else {
        queries.records = {
            binds: [ `SELECT ${sqlclauses.cols.join(', ')}` ],
            debug: [ `SELECT ${sqlclauses.cols.join(', ')}` ]
        }
    }
    
    const from = `FROM ${sqlclauses.tables.join(' JOIN ')}`
    queries.count.binds.push(from)
    queries.count.debug.push(from)
    queries.records.binds.push(from)
    queries.records.debug.push(from)

    if (sqlclauses.constraints.binds.length) {
        const where_binds = `WHERE ${sqlclauses.constraints.binds.join(' AND ')}`
        const where_debug = `WHERE ${sqlclauses.constraints.debug.join(' AND ')}`
        queries.count.binds.push(where_binds)
        queries.count.debug.push(where_debug)
        queries.records.binds.push(where_binds) 
        queries.records.debug.push(where_debug) 
    }

    if (sqlclauses.orderby.length) {
        const orderby = `ORDER BY ${sqlclauses.orderby.join(', ')}`
        queries.records.binds.push(orderby)
        queries.records.debug.push(orderby)
    }

    const limoff = `LIMIT ${sqlclauses.limit} OFFSET ${sqlclauses.offset}`
    queries.records.binds.push(limoff)
    queries.records.debug.push(limoff)

    return queries
}

const test = function() {
    const q0 = {
        resource: 'treatments',
        params: {}
    }

    const q1 = {
        resource: 'treatments',
        params: { treatmentId: '58F12CC7CCAD08F32CF9920D36C9992E' }
    }

    const q2 = {
        resource: 'treatments',
        params: { 
            treatmentTitle: 'Carvalhoma',
            journalTitle: 'Taxonomy',
            publicationDate: '{y:2016, m:1, d:12}',
            articleAuthor: 'Slater',
            $cols: 'default',
            $page: 5,
            $size: 70,
            $sortby: 'journalYear.asc,zenodoDep.desc'
        }
    }

    const q3 = {
        resource: 'treatments',
        params: { 
            // treatmentTitle: 'starts_with(Carvalhoma)',
            // journalTitle: 'ends_with(Taxonomy)',
            // publicationDate: 'between({"from": {"y":2016, "m":1, "d":12}, "to": {"y":2018, "m":12, "d":3}})',
            // articleAuthor: 'contains(Slater)',
            location: 'within({"r":10, "units": "kilometers", "lat":-53.979, "lng":121.8992})',
            $cols: 'default',
            $page: 5,
            $size: 70,
            $sortby: 'journalYear.asc,zenodoDep.desc'
        }
    }

    const q4 = {
        resource: 'treatments',
        params: { 
            location: 'near({"lat":-53.979, "lng":121.8992})',
            $cols: 'default',
            $page: 5,
            $size: 70,
            $sortby: 'journalYear.asc,zenodoDep.desc'
        }
    }

    const queries = zql(q0)
    console.log(sqlformatter.format(queries.count.debug.join(' ')))
    console.log(sqlformatter.format(queries.records.debug.join(' ')))
}

// https://stackoverflow.com/questions/6398196/detect-if-called-through-require-or-directly-by-command-line?rq=1
if (require.main === module) {
    test();
} 
else {
    module.exports = zql
}



/*
curl -G -v 'http://127.0.0.1:3010/v3/treatments' \
--data-urlencode 'location=within({"r":50,"units":"kilometers","lat":0,"lng":0})' | jq '.'
*/