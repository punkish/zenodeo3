import fp from 'fastify-plugin';
import favicon from 'fastify-favicon';

/**
 * This plugins adds some utilities to handle http errors
 *
 * @see https://github.com/fastify/fastify-sensible
 */
const options = {};

export const plugin = fp(async function(fastify, opts) {
    fastify.register(favicon, options);
})