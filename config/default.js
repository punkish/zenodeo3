'use strict'

/**************************************************************
 * 
 * The config options start with all the values in this file
 * 
 **************************************************************/

// const path = require('path');
// const cwd = process.cwd();

module.exports = {
    port: 3010,
    url: 'http://127.0.0.1:3010/v3',
    pino: {
        opts: {
            prettyPrint: true,
            level: 'info'
        }
    },
    debug: true,

    v3: {
        swagger: {
            options: {
                //routePrefix: '/documentation',
                exposeRoute: true,
                swagger: {
                    info: {
                        title: 'API documentation',
//                      description: '',
                        version: '3.0.0'
                    },
                    externalDocs: {
                        url: 'https://swagger.io',
                        description: 'Find more info here'
                    },
                    host: '127.0.0.1:3010',
                    schemes: ['http'],
                    consumes: ['application/json'],
                    produces: ['application/json']
                }
            }
        },

        ajv: {
            options: {
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
            }
        },

        cache: {

            // default cache duration 1 day (24 hours)
            duration: 1 * 60 * 60 * 1000
        }
    },

    data: {
        //treatments: path.join(cwd, 'data', 'treatments.sqlite')
        treatments: '../data/treatments.sqlite'
    }
};