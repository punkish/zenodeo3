// import fp from 'fastify-plugin';
// import fastifySwagger from '@fastify/swagger';
// import fastifySwaggerUi from '@fastify/swagger-ui'

// 
// A Fastify plugin for serving a Swagger UI, using Swagger (OpenAPI v2) or 
// OpenAPI v3 schemas automatically generated from your route schemas, or from 
// an existing Swagger/OpenAPI schema.
// 
// @see https://github.com/fastify/fastify-swagger
// 

import { Config } from '@punkish/zconfig';
const config = new Config().settings;

export const swaggerOpts = {

    //routePrefix: '/',
    swagger: {
        openapi: {
            info: {
                title: 'Zenodeo API documentation',
                description: 'A `nodejs` interface to treatments from [TreatmentBank](http://treatmentbank.org) and resources on [Zenodo](https://zenodo.org)',
                version: '3.6.0',
                termsOfService: '/tos',
                contact: {
                    name: 'API Support',
                    email: 'support@plazi.org'
                },
                license: {
                    name: 'CC0 Public Domain Dedication',
                    url: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode'
                }
            },
            externalDocs: {
                url: 'https://swagger.io',
                description: 'Find more info on Swagger here'
            },
            tags: [
                //{ name: 'meta', description: 'Resources metadata' },
                { name: 'zenodeo', description: 'Zenodeo end-points' },
                //{ name: 'zenodo', description: 'Zenodo end-points' }
            ],

            // 
            // make sure there is no scheme before the host
            // that is, there should not be any 'http(s)://' 
            //  
            host: config.url.swagger,
            test: config.url.swagger,
            schemes: config.schemes,
            consumes: [ 'application/json' ],
            produces: [ 'application/json' ]
        }
    },

    swaggerUi: {
        uiConfig: {
            docExpansion: 'none',
            deepLinking: false
        },
        uiHooks: {
            onRequest: (request, reply, next) => { next() },
            preHandler: (request, reply, next) => { next() }
        },
        staticCSP: true,
        transformStaticCSP: (header) => header,
        //exposeRoute: true,
        hideUntagged: true
    }
};

// export const plugin = fp(async (fastify) => {
//     await fastify.register(fastifySwagger, options.swagger);
//     await fastify.register(fastifySwaggerUi, options.swaggerUi);
// })