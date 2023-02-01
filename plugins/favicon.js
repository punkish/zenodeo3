import fp from 'fastify-plugin';
import favicon from 'fastify-favicon';

/**
 * With this plugin, Fastify will have a route 
 * configured for /favicon.ico requests.
 *
 * @see https://github.com/smartiniOnGitHub/fastify-favicon
 */
export const plugin = fp(async function(fastify, opts) {
    fastify.register(favicon, {});
})