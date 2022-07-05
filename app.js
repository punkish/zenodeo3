import Fastify from 'fastify';

import { plugin as favicon } from './plugins/favicon.js';
import { plugin as sensible } from './plugins/sensible.js';
import { plugin as swagger } from './plugins/swagger.js';
import { plugin as routes } from './plugins/routes.js';
import { plugin as view } from './plugins/view.js';
import { plugin as fastifyStatic } from './plugins/static.js';

import { route as tos } from './routes/tos/index.js';
import { route as docs } from './routes/docs/index.js';
import * as api from './routes/api/index.js';

export async function server(opts={}) {
    const fastify = Fastify(opts);

    /** 
     * register plugins
     */ 
    fastify.register(favicon);
    fastify.register(sensible);
    fastify.register(routes);
    fastify.register(swagger);
    fastify.register(fastifyStatic);
    fastify.register(view);

    /**
     * register the routes to resources
     */ 
    //fastify.register(favicon);
    fastify.register(tos);
    fastify.register(docs);
    api.routes.forEach(route => fastify.register(route, { prefix: 'v3' }));
    
    return fastify;
}