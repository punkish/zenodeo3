import Fastify from 'fastify';

import { plugin as favicon } from './plugins/favicon.js';
import { plugin as cors } from './plugins/cors.js';
import { plugin as sensible } from './plugins/sensible.js';
import { plugin as routes } from './plugins/routes.js';
import { plugin as swagger } from './plugins/swagger.js';
import { plugin as fastifyStatic } from './plugins/static.js';
import { plugin as view } from './plugins/view.js';
import { plugin as cron } from './plugins/cron.js';

import { tos } from './routes/tos/index.js';
import { docs } from './routes/docs/index.js';
import { routes as resources } from './routes/api/index.js';

export async function server(opts={}) {
    const fastify = Fastify(opts);

    //
    // register the plugins
    //
    fastify.register(favicon);
    fastify.register(cors);
    fastify.register(sensible);
    fastify.register(routes);
    fastify.register(swagger);
    fastify.register(fastifyStatic);
    fastify.register(view);
    fastify.register(cron);

    //
    // register the routes to resources
    //
    fastify.register(tos);
    fastify.register(docs);
    resources.forEach(resource => fastify.register(resource, { prefix: 'v3' }));
    
    return fastify;
}