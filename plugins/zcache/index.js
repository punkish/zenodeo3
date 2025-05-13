import fp from 'fastify-plugin';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;
import { Cache } from '@punkish/zcache';
import path from 'path';
const cwd = process.cwd();


function zcache(fastify, resourceName, next) {

    // Create a new semantic cache
    const cache = new Cache({
        //dir: './',
        name: 'cache',
        space: resourceName,
        ttl: config.cache.ttl
    });
    
    if (fastify.cache) {
        next(new Error('plugin already registered'));
    }
    
    fastify.decorate('cache', cache);
    next();
}

export default fp(zcache, {
    fastify: '5.x',
    name: 'zcache'
})