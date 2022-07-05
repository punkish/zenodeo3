import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import {config} from '../zconf/index.js';

/**
 * A Fastify plugin for serving a Swagger UI, using Swagger (OpenAPI v2) or 
 * OpenAPI v3 schemas automatically generated from your route schemas, or from 
 * an existing Swagger/OpenAPI schema.
 *
 * @see https://github.com/fastify/fastify-swagger
 */
const getOptions = async () => {
    const address = config.address;
    const port = config.port;

    return {
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
            host: `${address}:${port}`,
            schemes: [ 'http' ],
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
};

export const plugin = fp(async (fastify, opts) => {
    const options = await getOptions();
    fastify.register(swagger, options);
})