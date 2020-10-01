'use strict'

const fs = require('fs')

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
        description: 'Development, testing and release workflow',
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
        name: 'docs',
        description: 'API documentation',
        layout: 'docs'
    }
]

const routes = async function(fastify, options) {
    resources.forEach(r => {

        //let view = `./layouts/${r.name}`
        let text
        let layout

        if (r.name === 'docs') {
            text = {}
            layout = `./views/layouts/docs`
        }
        else {
            text = { text: fs.readFileSync(`./views/${r.name}.hbs`, 'utf-8') },
            layout = './views/layouts/main'
        }

        fastify.route({
            method: 'GET',
            url: `/${r.name.toLowerCase()}`,
            handler: function(request, reply) {
                reply.view(
                    layout,
                    text
                )
            }
        })
    })
}

module.exports = routes