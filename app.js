'use strict'

const fastify = require('fastify')
const config = require('config')

const acf = require('./lib/abstract-cache-file')
const await = true
const acfOpts = {
    base: '',
    segment: 'treatments',
    duration: 1000 * 3600 * 24,
    await: await
}

const cache = require('abstract-cache')({
    useAwait: await,
    client: acf(acfOpts)
})

// we need to make a deep clone of the swagger
// options config settings otherwise config 
// will not allow mod-ding the options object
const swagger = JSON.parse(JSON.stringify(config.get('v3.swagger')))

function build(opts={}) {
    const app = fastify(opts)

    app.register(require('fastify-favicon'))
    app.register(require('fastify-swagger'), swagger.options)
    app.register(require('fastify-caching'), { cache: cache })
    app.register(require('./api/v3/index'), { prefix: '/v3' })
    
    return app
}
  
module.exports = build