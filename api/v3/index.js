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

const yesterday = () => {
    let yyyy;
    let mm;
    let dd;

    const date = new Date();
    date.setDate(date.getDate() - 1);
    yyyy = date.getUTCFullYear();
    mm = date.getUTCMonth() + 1;
    dd = date.getUTCDate();

    if (parseInt(mm) < 10) {
        mm = mm.toString().padStart(2, '0');
    }

    if (parseInt(dd) < 10) {
        dd = dd.toString().padStart(2, '0');
    }

    return `${yyyy}-${mm}-${dd}`;
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

                // const zqldates = ['publicationDate', 'checkinTime', 'updateTime', 'created', 'updated'];

                // if (request.query) {
                //     const datekeys = Object.keys(request.query).filter(val => zqldates.includes(val));
                //     if (datekeys.length) {
                //         datekeys.forEach(key => {
                //             if (request.query[key].indexOf('yesterday') > -1) {
                //                 request.query[key] = request.query[key].replace('yesterday', yesterday());
                //             }
                //         })
                //     }
                // }

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

                done();
            },

            handler: handlerFactory(r.name)
        }

        // hide the fake route
        // if (r.name === 'fake') {
        //     route.schema.hide = true;
        // }

        fastify.route(route);
    })
}

module.exports = routes;