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
    loglevel: 'INFO',
    debug: true,

    v3: {
        swagger: {
            options: {
                routePrefix: '/docs',
                exposeRoute: true,
                swagger: {
                    info: {
                        title: 'Zenodeo API',
                        description: 'a REST API for treatments',
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