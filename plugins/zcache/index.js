import fp from 'fastify-plugin';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;
import { Cache } from '@punkish/zcache';
//import { Cache } from '../../../zcache/index.js';

async function zcache(fastify, options) {

    // Create a new semantic cache
    const cache = new Cache({
        //dir: './cache',
        ttl: 7 * 24 * 60 * 60 * 1000
    });

    await cache.init();

    if (fastify.cache) {
        new Error('plugin already registered');
    }
    
    fastify.decorate('cache', cache);
}

export default fp(zcache, {
    fastify: '5.x',
    name: 'zcache'
})