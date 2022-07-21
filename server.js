/** see
 * https://github.com/motdotla/dotenv/issues/133#issuecomment-255298822
 * 
 * running 'env.js' first, before anything else, ensures the env 
 * variables are loaded
**/
import './env.js';import { Config } from '@punkish/zconfig';
const config = new Config().settings;

import { server } from './app.js';

/**
 * Function to initialize and start the server!
 */
const start = async () => {
    const opts = {

        /**
         * setting 'exposeHeadRoutes' to false ensures only
         * 'GET' routes are created without their accompanying 
         * 'HEAD' routes
         */
        exposeHeadRoutes: false,
        logger: config.pino.opts,

        /** 
         * ajv options are provided in the key 'customOptions'.
         * This is different from when ajv is called in a 
         * stand-alone script (see `validate()` in lib/zql/z-utils.js)
         */
        ajv: {
            customOptions: config.ajv.opts
        }
    };

    try {
        const fastify = await server(opts);

        /** 
         * save the original request query params for use later
         * because the query will get modified after schema 
         * validation
         */
        fastify.addHook('preValidation', async (request, reply) => {
            request.origQuery = JSON.parse(JSON.stringify(request.query));
        });

        await fastify.listen({ port: config.port });
        fastify.log.info(`… in ${process.env.NODE_ENV.toUpperCase()} mode`);
    } 
    catch (err) {
        console.log(err);
        process.exit(1);
    }
};

/**
 * Start the server!
 */
start();