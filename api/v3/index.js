'use strict'

const { resources, getSchemaStrict } = require('../../data-dictionary/dd-utils')
const { handlerFactory } = require('./utils')

/*
 * This is the route factory that uses the routes configuration
 * defined in data-dictionary and generates a route. The route  
 * definition uses a handlerFactory to create the handler for 
 * each route, and a schema generator that uses the data-dictionary
 * to create a JSON schema for validation
 */
const routes = async function(fastify, options) {
    resources.forEach(r => {
        fastify.route({
            method: 'GET',
            url: `/${r.name === 'root' ? '' : r.name.toLowerCase()}`,
            schema: { querystring: getSchemaStrict(r.name) },
            handler: handlerFactory(r.name)
        })
    })
}

module.exports = routes