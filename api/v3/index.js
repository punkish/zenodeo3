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
            _links: { _self: { href: `${url.zenodeo}/` }},
            records: records
        },
        stored: null,
        ttl: null
    }
}

/*
* the following takes care of cols=col1,col2,col3
* as sent by the swagger interface to be validated 
* correctly by ajv as an array
*/
const coerceToArray = (request, param) => {
    if (typeof request.query[param] === 'string') {
        const arr = request.query[param].split(',');
        request.query[param] = arr;
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

        if (r.name === 'treatmentImages') {
            const sch = getSchema(r.name);
            console.log(JSON.stringify(sch, null, 4));
        }


        const route = {
            method: 'GET',
            url: `/${r.name.toLowerCase()}`,
            schema: { 
                summary: r.summary,
                description: r.description,
                querystring: getSchema(r.name)
            },

            preValidation: function(request, reply, done) {
                coerceToArray(request, 'cols');
                coerceToArray(request, 'communities');
                done();
            },

            handler: handlerFactory(r.name)
        }

        fastify.route(route);
    })
}

module.exports = routes;