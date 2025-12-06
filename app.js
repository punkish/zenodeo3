import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { staticPublic } from './plugins/static-public.js';
import { connect } from './bin/newbug/lib/db/dbconn.js';
import routes from '@fastify/routes';
import favicon from 'fastify-favicon';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui'
import { swaggerOpts } from './plugins/swagger.js';
import { docs } from './routes/docs/index.js';
import { tos } from './routes/tos/index.js';
import { install } from './routes/install/index.js';
import { queryHelp } from './routes/query-help/index.js';
import { roadmap } from './routes/roadmap/index.js';
import { about } from './routes/about/index.js';
import { treatmentsArchive } from './routes/treatments-archive/index.js';
import { bins } from './routes/bins/index.js';

// we rename routes to resources because we have already 
// imported a map of the routes above
import { routes as resources } from './routes/api/index.js';

import view from '@fastify/view';
import { viewOpts } from './plugins/view.js';
import zconfig from './plugins/zconfig/index.js';
import zcache from './plugins/zcache/index.js';
import zlog from './plugins/zlogger/index.js';
import zqlite from './plugins/zqlite/index.js';
import { cronJobs } from './plugins/cron.js';
import { ddutils } from './data-dictionary/utils/index.js';

export async function server(opts={}) {
    const fastify = Fastify(opts);

    // register the plugins

    // zconfig has to be registered first because the other plugins
    // use config settings via this plugin
    fastify.register(zconfig);
    fastify.register(zlog);
    fastify.register(favicon, {});
    fastify.register(cors, {});
    fastify.register(routes, {});
    await fastify.register(fastifySwagger, swaggerOpts.swagger);
    await fastify.register(fastifySwaggerUi, swaggerOpts.swaggerUi);
    fastify.register(fastifyStatic, staticPublic);
    fastify.register(view, viewOpts);
    //fastify.register(fastifyCron, { jobs: cronJobs.jobs });

    // we initialize the db connection once, and store it in a fastify
    // plugin so it can be used everywhere
    const db = connect({
        dbconfig:  fastify.zconfig.newbug.database,
        logger: fastify.zlog
    });

    fastify.register(zqlite, db);
    fastify.register(zcache);
    
    // register the routes to resources
    fastify.register(docs);
    fastify.register(tos);
    fastify.register(install);
    fastify.register(queryHelp);
    fastify.register(roadmap);
    fastify.register(about);
    fastify.register(treatmentsArchive);
    fastify.register(bins, { prefix: 'v3' });
    resources.forEach(resource => fastify.register(resource, { prefix: 'v3' }));
    
    const resourceNames = ddutils.getResources();
    fastify.decorate('resourceNames', resourceNames);

    return fastify;
}