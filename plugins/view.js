import fp from 'fastify-plugin';
import * as path from 'path';
import { cwd } from 'node:process';
import view from '@fastify/view';
import Handlebars from 'handlebars';

/**
 * Plugin for serving static files as fast as possible
 *
 * @see https://github.com/fastify/fastify-static
 */
const options = {
    engine: {
        handlebars: Handlebars
    },

    /** 
     * all the layouts and templates are relative
     * to the 'root' setting below
     */
    root: path.join(cwd(), 'views'),

    /**
     * we don't set 'layout' here because we set 
     * route-specific custom layout in the route source 
     * wherever applicable
     */
    //layout: './layouts/main.hbs',

    viewExt: 'hbs',
    options: {
        partials: {
            meta: './partials/meta.hbs',
            head: './partials/head.hbs',
            foot: './partials/foot.hbs'
        }
    }
};

export const plugin = fp(async function(fastify, opts) {
    fastify.register(view, options);
})