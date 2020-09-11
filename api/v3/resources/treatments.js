'use strict'

const zql = require('../../../lib/zql')
const turf = require('@turf/turf')
const sql = require('sqlformatter')
const crypto = require('crypto')

const { packageResult, sqlRunner } = require('../utils')

const name = 'treatments'
const description = 'fetch treatments'
const cols = require('../../../data-dictionary/treatments')
const schema = function(cols) {
    const schema = {}
    
    cols.forEach(c => {
        const prop = JSON.parse(JSON.stringify(c.zenodeotype))
        prop.description = c.description
        schema[c.name] = prop
    })

    return schema
}

const _get = (params) => {
    const queries = zql({resource: 'treatments', params: params})

    const res = {}

    if (params) {
        if ('location' in params) {
            console.log(params.location)
            const i = params.location.match(/(?<operator>\w+)\((?<val>.*?)\)/)
            const val = i.groups.val
            const w = JSON.parse(new String(val))
            const radius = w.r
            const units = w.units
            const lat = w.lat
            const lng = w.lng
            const buffered = turf.buffer(
                turf.point([ lng, lat ]), 
                radius, 
                { units: units }
            )

            // The buffer produces a multipolygon (even though it is a 
            // simple polygon, so it is represented by an array of array 
            // of coordinates. I have to use the one and only poly in 
            // that array. The following does the trick
            params.poly = JSON.stringify(buffered.geometry.coordinates[0])
        }
    }

    const [ d1, t1 ] = sqlRunner(queries.count.binds.join(' '), params)
    res.d1 = d1
    res.t1 = t1

    if (d1[0].num_of_records) {
        const [ d2, t2 ] = sqlRunner(queries.records.binds.join(' '), params)
        res.d2 = d2
        res.t2 = t2
    }
    else {
        res.d2 = null
        res.t2 = null
    }

    res.queries = queries
    return res
}

const handler = function(request, reply) {
    const cacheKey = crypto.createHash('md5').update(request.url).digest('hex')

    const send = function(data) {
        reply
            .headers({
                'Cache-Control': 'public, max-age=300',
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Security-Policy': "default-src 'none'; img-src 'self';"
            })
            .code(200)
            .send(data)
    }

    this.cache.get(cacheKey)
        .then((data) => {
            request.log.info('sending data from cache')
            send(data)
        })
        .catch((error) => {
            if (error) {
                const res = _get(request.query)

                request.log.info(`querying the db for count: ${sql.format(res.queries.count.debug.join(' '))}`)
                request.log.info(`querying the db for records: ${sql.format(res.queries.records.debug.join(' '))}`)

                const data = packageResult({
                    resource: 'treatments',
                    params: request.query,
                    res: res
                })

                this.cache.set(cacheKey, data, 0, () => {
                    request.log.info('wrote data to cache')
                    send(data)
                })
            }
            
        })
}

module.exports = { 
    name: name, 
    description: description, 
    cols: cols, 
    schema: schema(cols),
    handler: handler 
}