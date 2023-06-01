import fp from 'fastify-plugin';
import betterSqlite3 from './lib/better-sqlite3.js';

/**
 * This plugin enables the use of CORS in a Fastify application.
 * @see https://www.npmjs.com/package/@fastify/cors
 */
export const plugin = fp(async function(fastify, opts) {
    fastify.register(betterSqlite3, {});
})