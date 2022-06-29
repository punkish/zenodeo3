import fp from 'fastify-plugin';
import routes from '@fastify/routes';

/**
 * The fastify.routes Map has a key for each path any route has been 
 * registered, which points to an array of routes registered on that path. 
 * There can be more than one route for a given path if there are multiple 
 * routes added with different methods or different constraints.
 *
 * @see https://github.com/fastify/fastify-routes
 */
const options = {};

 export const plugin = fp(async function(fastify, opts) {
    fastify.register(routes, options);
})