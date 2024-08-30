// default the NODE_ENV to 'development'.
// To start in 'production' mode using `pm2`, start like so
// $ NODE_ENV=production pm2 start server.js --name=z3
// 
const env = process.env.NODE_ENV || 'development';
import process from 'node:process';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;

import { server } from './app.js';
import { coerceToArray, getCache, getCacheKey } from '../../../lib/routeUtils.js';

import { cronJobs } from '../../../plugins/cron.js';

// Function to initialize and start the server!
// 
const start = async () => {
    const opts = {

        // setting 'exposeHeadRoutes' to false ensures only 'GET' routes are 
        // created without their accompanying 'HEAD' routes
        // 
        exposeHeadRoutes: false,
        logger: config.pino.opts,

        // ajv options are provided in the key 'customOptions'. This is 
        // different from when ajv is called in a stand-alone script (see 
        // `validate()` in lib/zql/z-utils.js)
        // 
        ajv: {
            customOptions: config.ajv.opts
        }
    };

    try {
        const fastify = await server(opts);

        // save the original request query params for use later because the 
        // query will get modified after schema validation
        // 
        // fastify.addHook('preValidation', async (request) => {
        //     request.origQuery = JSON.parse(JSON.stringify(request.query));
        // });

        // the following takes care of cols=col1,col2,col3 as sent by the 
        // swagger interface to be validated correctly by ajv as an array. See 
        // `coerceToArray()` in routeUtils().
        // 
        fastify.addHook('preValidation', async (request) => {
            coerceToArray(request, 'cols');
            coerceToArray(request, 'communities');
        });

        // if the query results have been cached, we send the cached value back 
        // and stop processing any further
        //
        fastify.addHook('preHandler', async (request, reply) => {

            // all of this makes sense only if refreshCache is not true
            //
            if (!request.query.refreshCache) {
                
                const path = request.url.split('/')[2];
                const resourceName = path 
                    ? path.split('?')[0]
                    : '';

                // The following is applicable *only* if a resourceName is 
                // present
                //
                if (resourceName) {
                    const cacheKey = getCacheKey(request);

                    const cache = getCache({ 
                        dir: config.cache.base, 
                        namespace: resourceName, 
                        duration: request.query.cacheDuration
                            ? request.query.cacheDuration * 24 * 60 * 60 * 1000
                            : config.cache.ttl
                    });

                    let res = await cache.get(cacheKey);

                    if (res) {
                        const response = {
                            item: res.item,
                            stored: res.stored,
                            ttl: res.ttl,
                            //pre: true,
                            cacheHit: true,
                        };

                        reply.hijack();

                        // since we are sending back raw response, we need to 
                        // add the appropriate headers so the response is 
                        // recognized as JSON and is CORS-compatible
                        //
                        reply.raw.writeHead(200, { 
                            'Content-Type': 'application/json; charset=utf-8',
                            'Access-Control-Allow-Origin': '*'
                        });
                        reply.raw.end(JSON.stringify(response));
                        return Promise.resolve('done');
                    }
                }
            }
        });

        await fastify.listen({ port: 8080 });

        fastify.log.info(`… in ${env.toUpperCase()} mode`);

        // We run the cronJobs onetime on initializing the server so the 
        // queries are cached
        for (const {qs} of cronJobs) {
            try {
                await fastify.inject(qs);
            }
            catch(error) {
                console.error(error);
            }
        }
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }
};

// Start the server!
//
start();