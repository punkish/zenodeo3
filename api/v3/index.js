'use strict'

//const cache = require('abstract-cache')({useAwait: true})

const resources = require('./resources')

// This is where we build the routes for each resource
const routes = async function(fastify, options) {
    resources.forEach(resource => {
        fastify.route({
            method: 'GET',
            url: `/${resource.name}`,
            schema: { querystring: resource.schema },
            handler: resource.handler,
    
            // this function is executed for every request before validation
            //preValidation: async (request, reply, done) => {
                

                // let check = false
                // const q = request.query
    
                // if (Object.keys(q).length) {
                //     for (let p in q) {
                //         if (p in resource.schema) {
                //             check = true
                //             break
                //         }
                //     }
    
                //     if (!check) {
                //         reply.code(400).send(new Error('you submitted an invalid query'))
                //     }
                // }
    
                //done()
            //}
        })
    })
}

module.exports = routes