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
        name: '',
        description: 'API documentation',
        layout: 'docs'
    }
]

const routes = async function(fastify, options) {
    resources.forEach(r => {

        //let view = `./layouts/${r.name}`
        let text
        let layout

        if (r.name === '') {
            text = {}
            layout = `./views/layouts/docs`
        }
        else if (r.name === 'workflow') {
            const content = fs.readFileSync(`${dir}/${r.name}.md`, 'utf-8')
            text = { text: sh.makeHtml(content) },
            layout = './views/layouts/main'
        }
        else {
            text = { text: fs.readFileSync(`./views/${r.name}.hbs`, 'utf-8') },
            layout = './views/layouts/main'
        }

        fastify.route({
            method: 'GET',
            url: `/${r.name.toLowerCase()}`,
            handler: function(request, reply) {
                reply.view(layout, text)
            }
        })
    })
}

module.exports = routes