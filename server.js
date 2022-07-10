/** 
 * import env variables from .env into `process.env`
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { server } from './app.js';
import { config } from './zconf/index.js';

/**
 * Run the server!
 */
const start = async () => {
    let fastify;

    const opts = {

        /**
         * setting 'exposeHeadRoutes' to false ensures only
         * 'GET' routes are created without their accompanying 
         * 'HEAD' routes
         */
        exposeHeadRoutes: false,
        logger: config.pino.opts
    };

    try {
        fastify = await server(opts);

        /** 
         * save the original request query params for use later
         * because the query will get modified after schema 
         * validation
         */
        fastify.addHook('preValidation', async (request, reply) => {
            request.origQuery = JSON.parse(JSON.stringify(request.query));
        })

        await fastify.listen({ port: config.port });
        fastify.log.info(`… in ${process.env.NODE_ENV.toUpperCase()} mode`);
    } 
    catch (err) {
        console.log(err);
        process.exit(1);
    }
};

start();