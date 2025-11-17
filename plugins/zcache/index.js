import fp from 'fastify-plugin';
import { Cache } from '@punkish/zcache';

async function zcache(fastify, options) {

    // Create a new semantic cache
    const cache = new Cache({
        //dir: './cache',
        ttl: 7 * 24 * 60 * 60 * 1000
    });

    await cache.init();

    if (fastify.cache) {
        new Error('zcache plugin already registered');
    }
    
    fastify.decorate('cache', cache);
}

export default fp(zcache, {
    fastify: '5.x',
    name: 'zcache'
})