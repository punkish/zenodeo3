import fp from 'fastify-plugin';
import * as path from 'path';
import { cwd } from 'node:process';

import fastifyStatic from '@fastify/static';
/**
 * Plugin for serving static files as fast as possible
 *
 * @see https://github.com/fastify/fastify-static
 */
export const plugin = fp(async function(fastify, opts) {
    fastify.register(fastifyStatic, {
        root: path.join(cwd(), 'public'),
        prefix: '/public/'
    });
})