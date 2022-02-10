'use strict'

const config = require('config');
const port = config.get('port');
const address = config.get('address');
const ajvOpts = config.get('v3.ajv.options');
const log = require('./lib/utils').logger('SERVER');
//const querystring = require('qs')
//const querystring = require('querystring')


const server = require('./app')({
    // querystringParser: str => {
    //     console.log(querystring.parse(str, { comma: true }))
    //     querystring.parse(str, { comma: true })
    // },
    logger: log,
    ajv: ajvOpts,
    
    schemaErrorFormatter: (errors, dataVar) => {
        // const err = []
        // errors.forEach(e => {
        //     if (e.keyword === 'errorMessage') {
        //         err.push(e.message)
        //     }
        // })
        
        // return new Error(JSON.stringify(err.join('; ')))
        return new Error(JSON.stringify(errors))
    }
})

server.listen(port, address, (error, address) => {
    if (error) {
        server.log.error(error);
        process.exit(1);
    }

    server.blipp();
    server.swagger();
    
    // server.log.info(
    //     'Server running in %s mode on %s', 
    //     process.env.NODE_ENV ? process.env.NODE_ENV.toUpperCase() : 'DEVELOPMENT', 
    //     address
    // )
})