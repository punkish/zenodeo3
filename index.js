'use strict'

const config = require('config')
const port = config.get('port')

// we need to make a deep clone of the swagger
// options config settings otherwise config 
// will not allow mod-ding the options object
const swagger = JSON.parse(JSON.stringify(config.get('v3.swagger')))

const fastify = require('fastify')({
    logger: { 
        level: 'info', 
        prettyPrint: { 
            colorize: true,
            ignore: 'pid,hostname'
        }
    },
    ajv: {
        customOptions: {

            // Refer to [ajv options](https://ajv.js.org/#options)
            jsonPointers: true, 
            allErrors: true,

            // the following allows the `addtionalProperties`
            // false constraint in the JSON schema to be 
            // applied. Without this, any additional props
            // supplied in the querystring will be silently 
            // removed but no error will be raised
            removeAdditional: false
        },
        plugins: [
            require('ajv-errors')
        ]
    },
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

fastify.register(require('fastify-blipp'))
fastify.register(require('fastify-favicon'))
fastify.register(require('fastify-swagger'), swagger.options)
fastify.register(require('./api/v3/index'), { prefix: '/v3' })

// Run the server!
fastify.listen(port, function (error, address) {
    if (error) {
        fastify.log.error(error)
        process.exit(1)
    }

    fastify.blipp()
    //fastify.swagger()
    fastify.log.info(`server listening on ${address}`)
})