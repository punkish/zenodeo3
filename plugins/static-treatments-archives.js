//import fp from 'fastify-plugin';
import * as path from 'path';
import { cwd } from 'node:process';

//import fastifyStatic from '@fastify/static';
// 
// Plugin for serving static files as fast as possible
// 
// @see https://github.com/fastify/fastify-static
// 

export const staticTreatmentsArchives = {
    root: path.join(cwd(), 'data', 'treatments-archive'),
    prefix: '/treatments-archive/',

    // the reply decorator has been added by the static public plugin
    // registration
    decorateReply: false
};