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
                        description: `Zenodeo is a REST API for treatments and related data. All the queryable parameters are listed below under each resource. Please read the specific notes below:

- the entire URL is case-sensitive. The resource name is all lowercase and the query parameters use camelCase as appropriate
- the query *has* to be URI encoded. Browses may do this automatically, but if you are accessing the API programmatically, please URI Encode all params.
- it is possible to submit a query without any query parameters
- if a parameter is provided, it has to be a valid parameter, that is, one of those listed below.
- if the query includes a resourceId (for example, "treatmentId" in the case of "treatments"), then no additional parameter is required.
- if the query includes any valid parameter *other* than the resourceId, then "$page" and "$size" are also required. If not provided, default values will be assigned automatically.`,
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