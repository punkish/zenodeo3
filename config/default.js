'use strict'

/**************************************************************
 * 
 * The config options start with all the values in this file
 * 
 **************************************************************/

const path = require('path');
const cwd = process.cwd();

module.exports = {
    port: 3010,
    url: 'http://lucknow.local/v3',
    loglevel: 'INFO',
    env: 'test',
    
    
    // all queries that take longer than the 
    // following (in ms) are displayed in red
    // in the console log
    logSlowSQLthreshold: 300,

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
                    host: 'lucknow.local',
                    schemes: ['http'],
                    consumes: ['application/json'],
                    produces: ['application/json']
                }
            }
        }
    },

    data: {
        //treatments: path.join(cwd, 'data', 'treatments.sqlite')
        treatments: '/Users/punkish/Projects/zenodeo/data/treatments.sqlite'
    }
};