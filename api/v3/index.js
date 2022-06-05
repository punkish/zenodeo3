'use strict'

const config = require('config');
const url = config.get('url');
const { getSchema } = require('../../data-dictionary/dd-utils');
//const resources = require('../../data-dictionary/')
const resources = require('./resources.js');
const { handlerFactory } = require('./utils');

/*
 * The rootHandler returns the response when a user queries the 
 * root route
 */
// const rootHandler = async function(request, reply) {

    
//     return {
//         item: {
//             'search-criteria': {},
//             'num-of-records': records.length,
//             _links: { _self: { href: `${url.zenodeo}/` }},
//             resources
//         },
//         stored: null,
//         ttl: null
//     }
// }

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
    resources.forEach(r => {
        const route = {
            method: 'GET',
            url: `/${r.name.toLowerCase()}`,
            schema: {
                summary: r.summary,
                description: r.description,
                tags: r.tags
            }
        };

        if (r.tags.indexOf('meta') > -1) {
            route.handler = handlerFactory(`${r.name}Handler`);
        }
        else {
            route.schema.querystring = getSchema(r.name);

            route.preValidation = (request, reply, done) => {
                coerceToArray(request, 'cols');
                coerceToArray(request, 'communities');
                done();
            }

            route.handler = handlerFactory(r.name);
        }

        fastify.route(route);
    })
}

module.exports = routes;