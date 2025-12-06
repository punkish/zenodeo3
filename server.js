// default the NODE_ENV to 'development'.
// To start in 'production' mode using `pm2`, start like so
// $ NODE_ENV=production pm2 start server.js --name=z3
// 
const env = process.env.NODE_ENV || 'development';
import process from 'node:process';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;

import { server } from './app.js';
import cron from 'node-cron';
import { cronJobs } from './plugins/cron.js';
import { getQueryForCache, getQueryType, coerceToArray } from './lib/utils.js';

const start = async (server) => {
    const opts = {

        // setting 'exposeHeadRoutes' to false ensures only 'GET' routes are 
        // created without their accompanying 'HEAD' routes
        // 
        exposeHeadRoutes: false,
        logger: config.pino.opts,

        // ajv options are provided in the key 'customOptions'. This is 
        // different from when ajv is called in a stand-alone script (see 
        // `validate()` in ./lib/utils.js)
        // 
        ajv: {
            customOptions: config.ajv.opts
        }
    };

    try {
        const fastify = await server(opts);

        fastify.addHook('preValidation', async (request, reply) => {

            // Save the original request query params for use later because the 
            // query will get modified after schema validation. We use it to 
            // make the cacheKey for the cache
            request.queryForCache = getQueryForCache(request);

            // Save the original params as some of the params get munged
            // by validation
            //request.queryOrig = request.query;
            
            // the following takes care of cols=col1,col2,col3 as sent by the 
            // swagger interface to be validated correctly by ajv as an array. 
            // See `coerceToArray()` in lib/utils.js.
            coerceToArray(request, 'cols');
            coerceToArray(request, 'communities');
        });

        // if the query results have been cached, we send the cached value back 
        // and stop processing any further
        fastify.addHook('preHandler', async (request, reply) => {
            
            // Remove leading '/' if it exists
            // const requestUrl = request.url.substring(0, 1) === '/'
            //     ? request.url.slice(1)
            //     : request.url;

            //const url = new URL(`${fastify.zconfig.url.zenodeo}/${requestUrl}`);
            //const resourceName = url.pathname.split('/')[2];
            const u = request.url.split('?')[0].split('/');

            // Proceed only if it is a Zenodeo query which will have v3 in it
            if (u[1] !== 'v3') {
                return;
            }

            const resourceName = u[2];

            if (!fastify.resourceNames.includes(resourceName)) {
                return;
            }

            // The following is applicable *only* if a resourceName exists 
            if (resourceName) {

                // Store the queryType for subsequent use
                request.queryType = getQueryType(resourceName, request);
            }

            // If refreshCache has been requested, return right away
            if (request.query.refreshCache) {
                return;
            }
            else {

                // Check if there is cached data, and return it
                const cachedData = await fastify.cache.get({
                    segment: resourceName,
                    query: request.queryForCache, 
                    isSemantic: request.queryType.isSemantic
                });

                if (cachedData) {
                    fastify.zlog.info(`query for creating cacheKey 💥: ${request.queryForCache}`);
                    cachedData.cacheHit = true;
                    reply.hijack();

                    // since we are sending back raw response, we need 
                    // to add the appropriate headers so the response 
                    // is recognized as JSON and is CORS-compatible
                    reply.raw.writeHead(200, { 
                        'Content-Type': 'application/json; charset=utf-8',
                        'Access-Control-Allow-Origin': '*'
                    });
                    reply.raw.end(JSON.stringify(cachedData));
                    return Promise.resolve('done');
                }
            }
            
        });

        await fastify.listen({ 
            port: fastify.zconfig.port, 
            host: fastify.zconfig.address 
        });
        
        fastify.zlog.info(`… in ${env.toUpperCase()} mode`);

        if (cronJobs.runCronJobsOnStart) {

            // We run the cronJobs onetime on initializing the server so the 
            // queries are cached
            fastify.zlog.info('Running cronJobs on startup');

            for (const {qs} of cronJobs.jobs) {
                try {
                    await fastify.inject(qs);
                }
                catch(error) {
                    console.error(error);
                }
            }
        }
        
        if (cronJobs.installCronJobs) {

            // We also run the cronJobs at the specified times
            cronJobs.jobs.map(({cronTime, qs}) => {
                cron.schedule(cronTime, async () => {
                    try {
                        await fastify.inject(qs);
                    }
                    catch(error) {
                        console.error(error);
                    }
                });
            });
        }
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }
};

start(server);