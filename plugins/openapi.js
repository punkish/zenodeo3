import fp from 'fastify-plugin';
import openapi from 'fastify-openapi-docs';

/**
 * A simple plugin for Fastify that generates OpenAPI spec automatically.
 *
 * @see http://sw.cowtech.it/fastify-openapi-docs
 */

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
//const host = config.port ? `${config.address}:${config.port}` : config.address;

const options = { 
    // All these fields are optional, but they should be provided to 
    // satisfy OpenAPI specification. 
    openapi: '3.0.3', 
    info: { 
      title: 'Zenodeo API documentation', 
      description: 'A `nodejs` interface to treatments from [TreatmentBank](http://treatmentbank.org) and resources on [Zenodo](https://zenodo.org)', 
      contact: { 
        name: 'API Support',
        email: 'support@plazi.org'
      }, 
      license: { 
        name: 'CC0 Public Domain Dedication',
        url: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode'
      }, 
      version: '1.0.0' 
    }, 
    servers: [ 
      { url: 'https://example.com', description: 'Production Server' }, 
      { url: 'https://dev.example.com', description: 'Development Server' } 
    ], 
    tags: [
        { name: 'meta', description: 'Resources metadata' },
        { name: 'zenodeo', description: 'Zenodeo end-points' },
        { name: 'zenodo', description: 'Zenodo end-points' }
    ],
    components: { 
      securitySchemes: { 
        jwtBearer: { 
          type: 'http', 
          scheme: 'bearer', 
          bearerFormat: 'JWT' 
        } 
      } 
    } 
}

const options_old = {

    //routePrefix: '/',
    swagger: {
        info: {
            title: 'Zenodeo API documentation',
            description: 'A `nodejs` interface to treatments from [TreatmentBank](http://treatmentbank.org) and resources on [Zenodo](https://zenodo.org)',
            version: '3.4.0',
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
            { name: 'meta', description: 'Resources metadata' },
            { name: 'zenodeo', description: 'Zenodeo end-points' },
            { name: 'zenodo', description: 'Zenodo end-points' }
        ],

        /**
         * make sure there is no scheme before the host
         * that is, there should not be any 'http(s)://' 
         */ 
        host: config.url.swagger,
        test: config.url.swagger,
        schemes: config.schemes,
        consumes: [ 'application/json' ],
        produces: [ 'application/json' ]
    },
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
    exposeRoute: true,
    hideUntagged: true
};

export const plugin = fp(async (fastify) => {
    fastify.register(openapi, options);
})