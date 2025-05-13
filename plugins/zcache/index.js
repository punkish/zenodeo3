import fp from 'fastify-plugin';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;
import { Cache } from '../../../semcache/index.js';
import path from 'path';
const cwd = process.cwd();


function fastifyCache(fastify, resourceName, next) {

    // Create a new semantic cache
    const cache = new Cache({
        //dir: './',
        name: 'zcache',
        space: resourceName,
        ttl: config.cache.ttl
    });
    
    if (fastify.cache) {
        next(new Error('plugin already registered'));
    }
    
    fastify.decorate('cache', cache);
    next();
}

export default fp(fastifyCache, {
    fastify: '5.x',
    name: 'fastify-cache'
})