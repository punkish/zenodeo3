import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { staticOpts } from './plugins/static.js';

import fastifyBetterSqlite3 from '@punkish/fastify-better-sqlite3';
import { initDb } from './lib/dbconn.js';
import routes from '@fastify/routes';
import favicon from 'fastify-favicon';
import cors from '@fastify/cors';

import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui'
import { swaggerOpts } from './plugins/swagger.js';

import fastifyCron from 'fastify-cron';
import { cronOpts } from './plugins/cron.js';

import fastifyQueries from './plugins/queries.js';

import { tos } from './routes/tos/index.js';
import { docs } from './routes/docs/index.js';

//
// we rename routes to resources because we have already imported a map of the 
// routes above
//
import { routes as resources } from './routes/api/index.js';

import view from '@fastify/view';
import { viewOpts } from './plugins/view.js';

export async function server(opts={}) {
    const fastify = Fastify(opts);

    //
    // register the plugins
    //
    fastify.register(favicon, {});
    fastify.register(cors, {});
    fastify.register(routes, {});
    await fastify.register(fastifySwagger, swaggerOpts.swagger);
    await fastify.register(fastifySwaggerUi, swaggerOpts.swaggerUi);
    fastify.register(fastifyStatic, staticOpts);
    fastify.register(view, viewOpts);
    fastify.register(fastifyCron, cronOpts);
    
    //
    // we initialize the db connection once, and store it in a fastify
    // plugin so it can be used everywhere
    //
    const db = initDb();
    const fastifyBetterSqlite3Opts = {
        "class": db.class,
        "connection": db.conn
    };

    fastify.register(fastifyBetterSqlite3, fastifyBetterSqlite3Opts);

    //
    // register the routes to resources
    //
    fastify.register(tos);
    fastify.register(docs);
    resources.forEach(resource => fastify.register(resource, { prefix: 'v3' }));
    
    return fastify;
}