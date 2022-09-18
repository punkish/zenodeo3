import fp from 'fastify-plugin';
import fastifyCron from 'fastify-cron';

/**
 * This plugin enables the use of cron in a Fastify application.
 * @see https://www.npmjs.com/package/fastify-cron
 */
const options = {
    jobs: [
        {
            // daily at midnight UTC
            cronTime: '0 0 * * *',
            onTick: async server => {
                try {
                    await server.inject('/v3/treatments?cols=&stats=true&refreshCache=true');
                } 
                catch (err) { 
                    console.error(err);
                }
            },
            start: true
        }
    ]
};

export const plugin = fp(async function(fastify) {
    fastify.register(fastifyCron, options);
})