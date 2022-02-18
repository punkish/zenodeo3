'use strict'

const fs = require('fs')
const showdown = require('showdown');
const footnotes = require('../public/js/footnotes.js');
const sh = new showdown.Converter({extensions: [footnotes], tables: true});
const dir = './static/text'

const resources = [
    {
        name: 'about',
        description: 'About Zenodeo',
    },

    {
        name: 'examples',
        description: 'Examples',
    },

    {
        name: 'releases',
        description: 'Releases',
    },

    {
        name: 'workflow',
        description: 'Development, testing and release workflow'
    },

    {
        name: 'tos',
        description: 'Terms of Service',
    },

    {
        name: 'install',
        description: 'Installation instructions',
    },

    {
        name: 'roadmap',
        description: 'Zenodeo development roadmap',
    },

    {
        name: 'query-help',
        description: 'Zenodeo Query Language (ZQL) syntax help',
    }
]

const routes = async function(fastify, options) {

    // first, add the route for docs
    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            description: 'API documentation'
        },
        handler: function(request, reply) {
            reply.view('./views/layouts/docs', {})
        }
    })

    resources.forEach(r => {

        let text;
        const layout = './views/layouts/main';

        const textFromMd = ['workflow', 'roadmap', 'query-help'];

        if (textFromMd.includes(r.name)) {
            const content = fs.readFileSync(`${dir}/${r.name}.md`, 'utf-8');
            text = { text: sh.makeHtml(content) };
        }
        else {
            text = { text: fs.readFileSync(`./views/${r.name}.hbs`, 'utf-8') };
        }

        fastify.route({
            method: 'GET',
            url: `/${r.name.toLowerCase()}`,
            schema: {
                description: r.description,
                hide: true,
                tags: [ 'x-HIDDEN' ]
            },
            handler: function(request, reply) {
                reply.view(layout, text)
            }
        })
    })
}

module.exports = routes