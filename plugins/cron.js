import fp from 'fastify-plugin';
import fastifyCron from 'fastify-cron';

/**
 * This plugin enables the use of cron in a Fastify application.
 * @see https://www.npmjs.com/package/fastify-cron
 */
export const plugin = fp(async function(fastify) {
    fastify.register(fastifyCron, {
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
            },
            {
                // daily at five past midnight UTC
                cronTime: '5 0 * * *',
                onTick: async server => {
                    try {
                        await server.inject('/v3/treatmentimages?family=Formicidae&cols=httpUri&cols=treatmentTitle&cols=zenodoDep&cols=treatmentId&cols=captionText&refreshCache=true');
                    } 
                    catch (err) { 
                        console.error(err);
                    }
                },
                start: true
            },
            {
                // daily at ten past midnight UTC
                cronTime: '10 0 * * *',
                onTick: async server => {
                    try {
                        await server.inject('/v3/treatmentimages?class=Actinopterygii&cols=httpUri&cols=treatmentTitle&cols=zenodoDep&cols=treatmentId&cols=captionText&refreshCache=true');
                    } 
                    catch (err) { 
                        console.error(err);
                    }
                },
                start: true
            },
            {
                // daily at ten past midnight UTC
                cronTime: '15 0 * * *',
                onTick: async server => {
                    try {
                        await server.inject('/v3/treatmentimages?class=Arachnida&cols=httpUri&cols=treatmentTitle&cols=zenodoDep&cols=treatmentId&cols=captionText&refreshCache=true');
                    } 
                    catch (err) { 
                        console.error(err);
                    }
                },
                start: true
            },
            {
                // daily at fifteen past midnight UTC
                cronTime: '15 0 * * *',
                onTick: async server => {
                    try {
                        await server.inject('/v3/treatmentimages?class=Malacostraca&cols=httpUri&cols=treatmentTitle&cols=zenodoDep&cols=treatmentId&cols=captionText&refreshCache=true');
                    } 
                    catch (err) { 
                        console.error(err);
                    }
                },
                start: true
            },
        ]
    });
})