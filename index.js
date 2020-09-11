'use strict'

const config = require('config')
const port = config.get('port')

// Require the framework and instantiate it
const fastify = require('./app') ({
    logger: {
        level: 'info',
        prettyPrint: true
    }
})

fastify.listen(port, function (err, address) {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }

    //fastify.blipp()
    fastify.swagger()
    fastify.log.info(`server listening on ${address}`)
})