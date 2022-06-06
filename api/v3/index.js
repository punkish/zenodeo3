'use strict'

const { getSchema } = require('../../data-dictionary/dd-utils');
const resources = require('./resources.js');
const { handlerFactory } = require('./utils');

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
 * defined in resources.js and generates the routes. The route  
 * definition uses a handlerFactory to create the handler for 
 * each route, and a schema generator that uses the data-dictionary
 * to create a JSON schema for validation
 */
const routes = async function(fastify, options) {
    resources.forEach(r => {
        const route = {
            method: 'GET',
            url: `/${r.url}`,
            schema: {
                summary: r.summary,
                description: r.description,
                tags: r.tags
            },
            handler: handlerFactory(r.name)
        };

        if (r.name === 'root') {
            //route.handler = handlerFactory(r.name);
        }
        else if (r.name === 'etlstats') {
            route.schema.querystring = getSchema(r.name);
            //route.handler = handlerFactory(r.name);
        }
        else {
            route.schema.querystring = getSchema(r.name);

            route.preValidation = (request, reply, done) => {
                coerceToArray(request, 'cols');
                coerceToArray(request, 'communities');
                done();
            }

            //route.handler = handlerFactory(r.name);
        }

        fastify.route(route);
    })
}

module.exports = routes;