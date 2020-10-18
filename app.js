'use strict'

const config = require('config')
const fastify = require('fastify')
const JSON5 = require('json5')
const path = require('path')

// we need to make a deep clone of the swagger
// options config settings otherwise config 
// will not allow mod-ding the options object
const swagger = JSON5.parse(JSON5.stringify(config.get('v3.swagger')))

const hbs = {
    engine: {
        handlebars: require('handlebars')
    },
    //root: path.join(__dirname, 'views'),
    //layout: '/layouts/main.hbs',
    viewExt: 'hbs', // it will add the extension to all the views
    options: {
        partials: {
              meta: './views/partials/meta.hbs',
            header: './views/partials/head.hbs',
            footer: './views/partials/foot.hbs'
        }
    }
}

function build(opts={}) {

    const app = fastify(opts)

    
    app.register(require('fastify-blipp'))
    app.register(require('fastify-favicon'))
    app.register(require('point-of-view'), hbs)
    app.register(require('./static/'))
    app.register(require('fastify-swagger'), swagger.options)
    app.register(require('./api/v3/index'), { prefix: '/v3' })
    app.register(require('fastify-cors'))
    app.register(require('fastify-static'), {
        root: path.join(__dirname, 'public'),
        prefix: '/public/',
    })

    return app
}

module.exports = build