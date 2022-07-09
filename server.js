/** 
 * import env variables from .env into 
 * process.env
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

        fastify.addHook('preValidation', async (request, reply) => {
            request.origQuery = JSON.parse(JSON.stringify(request.query));
        })

        await fastify.listen({ port: config.port });
    } 
    catch (err) {
        console.log(err);
        process.exit(1);
    }
};

start();