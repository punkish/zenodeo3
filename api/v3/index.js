'use strict'

const config = require('config')
const url = config.get('url')
const { resources, getSchema } = require('../../data-dictionary/dd-utils')
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
            url: `/${r.name === 'root' ? '' : r.name.toLowerCase()}`,
            schema: { 
                summary: r.summary,
                description: r.description,
                querystring: getSchema(r.name) 
            },
            handler: handlerFactory(r.name)
        })
    })
}

module.exports = routes