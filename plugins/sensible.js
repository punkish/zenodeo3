import fp from 'fastify-plugin';
import sensible from '@fastify/sensible';

/**
 * This plugins adds some utilities to handle http errors
 *
 * @see https://github.com/fastify/fastify-sensible
 */
const options = {
    errorHandler: true
};

export const plugin = fp(async function(fastify, opts) {
    fastify.register(sensible, options);
})