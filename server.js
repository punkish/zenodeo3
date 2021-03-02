'use strict'

const config = require('config')
const port = config.get('port')
const ajvOpts = config.get('v3.ajv.options')
const log = require('./lib/utils').logger('INDEX')
const qs = require('qs')

const server = require('./app')({
    querystringParser: str => qs.parse(str, { comma: true }),
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

server.listen(port, (error, address) => {
    if (error) {
        server.log.error(error)
        process.exit(1)
    }

    server.blipp()
    server.swagger()
    
    if (process.env.NODE_ENV) {
        server.log.info(
            'Server running in %s mode on %s', 
            process.env.NODE_ENV.toUpperCase(), 
            address
        )
    }
    else {
        server.log.info(
            'Server running in DEVELOPMENT mode on %s', 
            address
        )
    }
})