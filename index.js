'use strict'

//const path = require('path')
const config = require('config')
const port = config.get('port')
const ajvOpts = config.get('v3.ajv.options')
const JSON5 = require('json5')
const log = require('./utils')('INDEX')

// we need to make a deep clone of the swagger
// options config settings otherwise config 
// will not allow mod-ding the options object
const swagger = JSON5.parse(JSON5.stringify(config.get('v3.swagger')))

const fastify = require('fastify')({
    logger: log,
    ajv: ajvOpts,
    
    // schemaErrorFormatter: (errors, dataVar) => {
    //     const err = []
    //     errors.forEach(e => {
    //         if (e.keyword === 'errorMessage') {
    //             err.push(e.message)
    //         }
    //     })
        
    //     return new Error(JSON.stringify(err.join('; ')))
    // }
})

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

fastify.register(require('fastify-blipp'))
fastify.register(require('fastify-favicon'))
fastify.register(require('point-of-view'), hbs)
fastify.register(require('./static/'))
fastify.register(require('fastify-swagger'), swagger.options)
fastify.register(require('./api/v3/index'), { prefix: '/v3' })

// Run the server!
fastify.listen(port, function (error, address) {
    if (error) {
        fastify.log.error(error)
        process.exit(1)
    }

    fastify.blipp()
    fastify.swagger()

    if (process.env.NODE_ENV) {
        fastify.log.info(
            'Server running in %s mode on %s', 
            process.env.NODE_ENV.toUpperCase(), 
            address
        )
    }
    else {
        fastify.log.info(
            'Server running in DEVELOPMENT mode on %s', 
            address
        )
    }
})