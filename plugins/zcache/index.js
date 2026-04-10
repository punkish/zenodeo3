import fp from 'fastify-plugin';
import { Cache } from '@punkish/zcache';
//import { Cache } from '../../../zcache/index.js';

async function zcache(fastify, options) {
    //const cacheOpts = JSON.parse(JSON.stringify(fastify.zconfig.cache));

    // Create a new semantic cache
    const cache = new Cache(fastify.zconfig.cache);
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