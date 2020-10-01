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
                //routePrefix: '/documentation',
                exposeRoute: true,
                swagger: {
                    info: {
                        title: 'API documentation',
                        description: `Zenodeo is a REST API for treatments and related data. 
                        
All the queryable parameters are listed below under each resource. Note that it is possible to submit a query without any query parameters. However, if a parameter is provided, it has to be a valid parameter, that is, one of those listed below. Additionally, if a resourceId is provided (for example, "treatmentId" in the case of "treatments", then no additional parameter is required. But if any other valid parameter is provided, then it is **mandatory** to also provide "$page" and "$size".`,
                        version: '3.0.0'
                    },
                    externalDocs: {
                        url: 'https://swagger.io',
                        description: 'Find more info here'
                    },
                    host: '127.0.0.1:3010',
                    schemes: ['http'],
                    consumes: ['application/json'],
                    produces: ['application/json'],
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