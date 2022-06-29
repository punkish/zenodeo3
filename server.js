import { server } from './app.js';

/**
 * Run the server!
 */
const start = async () => {
    let fastify;

    const opts = {
        exposeHeadRoutes: false,
        logger: {
            transport: {
                target: 'pino-pretty',
                options: {
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname'
                }
            }
        }
    };

    try {
        fastify = await server(opts);
        await fastify.listen({ port: 3000 });
    } 
    catch (err) {
        console.log(err);
        process.exit(1);
    }
};

start();