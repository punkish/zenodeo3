import fp from 'fastify-plugin';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;
import { coerceToArray, getCache, getCacheKey } from '../../lib/routeUtils.js';

function fastifyCache(fastify, resourceName, next) {
    const cache = getCache({ 
        dir: config.cache.base, 
        namespace: resourceName, 
        duration: config.cache.ttl
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