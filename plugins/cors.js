import fp from 'fastify-plugin';
import cors from '@fastify/cors';

/**
 * This plugin enables the use of CORS in a Fastify application.
 * @see https://www.npmjs.com/package/@fastify/cors
 */
export const plugin = fp(async function(fastify, opts) {
    fastify.register(cors, {});
})