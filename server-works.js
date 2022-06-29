import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import Fastify from 'fastify';
import routes from '@fastify/routes';
import swagger from '@fastify/swagger';
import view from '@fastify/view';
import Handlebars from 'handlebars';
import fastifyStatic from '@fastify/static';

import { tos } from './routes/tos/index.js';
import * as api from './routes/api/index.js';

const swaggerOpts = {
    routePrefix: '/',
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

        // make sure there is no scheme before the host
        // that is, there should not be any 'http(s)://'
        host: '127.0.0.1:3000',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json']
    },
    uiConfig: {
        docExpansion: 'none',
        deepLinking: false
    },
    uiHooks: {
        onRequest: function (request, reply, next) { next() },
        preHandler: function (request, reply, next) { next() }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    exposeRoute: true,
    hideUntagged: true
};

const hbsOpts = {
    engine: {
        handlebars: Handlebars
    },
    root: path.join(__dirname, 'views'),
    layout: './layouts/main.hbs',

    // this will add the extension to all the views
    viewExt: 'hbs',
    options: {
        partials: {
            meta: './partials/meta.hbs',
            head: './partials/head.hbs',
            foot: './partials/foot.hbs'
        }
    }
};

const staticOpts = {
    root: path.join(__dirname, 'public'),
    prefix: '/public/'
}

const fastify = Fastify({
    exposeHeadRoutes: false,
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname'
            }
        }
    },
    // ajv: {
    //     customOptions: {
    //         allErrors: true
    //     }
    // }
});

fastify.register(routes);
fastify.register(swagger, swaggerOpts);
fastify.register(view, hbsOpts);
fastify.register(tos);
fastify.register(fastifyStatic, staticOpts)
api.routes.forEach(route => fastify.register(route, { prefix: 'v3' }));

/**
 * Run the server!
 */
const start = async () => {
    try {
        await fastify.listen({ port: 3000 })
    } 
    catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
};

start();