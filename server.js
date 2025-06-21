// default the NODE_ENV to 'development'.
// To start in 'production' mode using `pm2`, start like so
// $ NODE_ENV=production pm2 start server.js --name=z3
// 
const env = process.env.NODE_ENV || 'development';
import process from 'node:process';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;

import { server } from './app.js';
import { coerceToArray } from './lib/routeUtils.js';
import cron from 'node-cron';
import { cronJobs } from './plugins/cron.js';
import { getQueryForCache } from './lib/utils.js';
import { getQueryType } from './lib/zql/z-utils/index.js';

const start = async (server) => {
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
        fastify.addHook('preValidation', async (request) => {
            request.queryForCache = getQueryForCache(request);
        });

        // the following takes care of cols=col1,col2,col3 as sent by the 
        // swagger interface to be validated correctly by ajv as an array. See 
        // `coerceToArray()` in routeUtils().
        fastify.addHook('preValidation', async (request) => {
            coerceToArray(request, 'cols');
            coerceToArray(request, 'communities');
        });

        // if the query results have been cached, we send the cached value back 
        // and stop processing any further
        fastify.addHook('preHandler', async (request, reply) => {

            // all of this makes sense only if refreshCache does not exist
            // or is set to false (the same thing)
            if (!request.query.refreshCache) {
                
                // Remove leading '/' if it exists
                const rurl = request.url.substring(0, 1) === '/'
                    ? request.url.slice(1)
                    : request.url;

                const url = new URL(`${config.url.zenodeo}/${rurl}`);
                const resourceName = url.pathname.split('/')[2];

                // The following is applicable *only* if a resourceName exists 
                if (resourceName) {
                    const queryType = getQueryType({ 
                        request, 
                        resource: resourceName, 
                        params: request.query, 
                        fastify 
                    });

                    const cachedData = await fastify.cache.get({
                        segment: resourceName,
                        query: request.queryForCache, 
                        isSemantic: queryType.isSemantic
                    });

                    if (cachedData) {
                        fastify.zlog.info(fastify.zlog.prefix(), request.queryForCache);
                        fastify.zlog.info(fastify.zlog.prefix(), '💥 cacheHit')
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
                
            }
        });

        await fastify.listen({ 
            port: config.port, 
            host: config.address 
        });
        
        fastify.zlog.info(fastify.zlog.prefix(), `… in ${env.toUpperCase()} mode`);

        if (cronJobs.runCronJobsOnStart) {

            // We run the cronJobs onetime on initializing the server so the 
            // queries are cached
            fastify.zlog.info(fastify.zlog.prefix(), 'Running cronJobs on startup');

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