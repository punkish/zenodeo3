'use strict'

const { test } = require('tap')
const zql = require('../lib/zql/')

test('creates SQL from no querystring', async t => {
    const q = { resource: 'treatments' }
    const queries = await zql(q)

    const sql1 = 'SELECT Count(*) AS num_of_records FROM treatments'
    t.strictEqual(queries.count.debug.join(' '), sql1, `returns "${sql1}"`)

    const sql2 = 'SELECT treatments.treatmentId, treatmentTitle, journalTitle, publicationDate FROM treatments LIMIT 30 OFFSET 0'
    t.strictEqual(queries.records.debug.join(' '), sql2, `returns "${sql2}"`)
    //t.end()
})

test('creates SQL from querystring', async t => {
    const q = {
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

    const queries = await zql(q)

    const sql1 = 'SELECT Count(*) AS num_of_records FROM treatments WHERE treatmentTitle LIKE Carvalhoma AND journalTitle LIKE Taxonomy AND publicationDate = {y:2016, m:1, d:12}'
    t.strictEqual(queries.count.debug.join(' '), sql1, `returns "${sql1}"`)

    const sql2 = 'SELECT treatments.treatmentId, treatmentTitle, journalTitle, publicationDate FROM treatments WHERE treatmentTitle LIKE Carvalhoma AND journalTitle LIKE Taxonomy AND publicationDate = {y:2016, m:1, d:12} ORDER BY journalYear ASC, zenodoDep DESC LIMIT 70 OFFSET 4'
    t.strictEqual(queries.records.debug.join(' '), sql2, `returns "${sql2}"`)
    //t.end()
})