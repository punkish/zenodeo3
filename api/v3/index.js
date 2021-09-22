'use strict'

const config = require('config')
const url = config.get('url')
const { getSchema } = require('../../data-dictionary/dd-utils')
const resources = require('../../data-dictionary/')
const { handlerFactory } = require('./utils')

const rootHandler = async function(request, reply) {
    const records = [{
        name: 'root',
        url: url.zenodeo,
        summary: 'root of the API',
        description: 'This is where it starts'
    }]

    resources.forEach(r => {
        records.push({
            name: r.name,
            url: `${url.zenodeo}/${r.name.toLowerCase()}`,
            summary: r.summary,
            description: r.description
        })
    })

    return {
        item: {
            'search-criteria': {},
            'num-of-records': records.length,
            _links: { self: { href: `${url.zenodeo}/` }},
            records: records
        },
        stored: null,
        ttl: null
    }
}
/*
 * This is the route factory that uses the routes configuration
 * defined in data-dictionary and generates a route. The route  
 * definition uses a handlerFactory to create the handler for 
 * each route, and a schema generator that uses the data-dictionary
 * to create a JSON schema for validation
 */
const routes = async function(fastify, options) {
    fastify.route({
        method: 'GET',
        url: '/',
        schema: { 
            summary: 'root of the API',
            description: 'This is where it starts'
        },
        handler: rootHandler
    })

    resources.forEach(r => {
        fastify.route({
            method: 'GET',
            url: `/${r.name.toLowerCase()}`,
            schema: { 
                summary: r.summary,
                description: r.description,
                querystring: getSchema(r.name) 
            },

            preValidation: function(request, reply, done) {

                // if (request.query && request.query.geolocation) {
                //     let g = request.query.geolocation
                //     console.log(`g: ${g}`)
                //     if (typeof(g) === 'string') {
                //         //g = querystring.parse({ geolocation: g }, { comma: true }).geolocation
                //     }

                //     const clean_g = g.map(e => {
                //         return e.trim().replace(')', '').replace("'", '').split('(')
                //     }).flat()

                //     const geoloc_operator = clean_g[0]
                //     const geolocation = {}
                //     clean_g.forEach(e => {
                //         if (e.indexOf(':') > -1) {
                //             const [ key, value ] = e.split(':').map(e => e.trim().replace(/"/g, '').replace(/'/g, ''))
                //             const n = Number(value)
                //             geolocation[key] = isNaN(n) ? value : n
                //         }
                //     })

                //     request.query.geoloc_operator = geoloc_operator
                //     request.query.geolocation = geolocation
                // }

                done()
            },

            handler: handlerFactory(r.name)
        })
    })
}

module.exports = routes