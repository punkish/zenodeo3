'use strict'

/**************************************************************
 * 
 * The config options this file modify config/default when the
 * app is running in PRODUCTION mode
 * 
 **************************************************************/

// const path = require('path')
// const cwd = process.cwd()

module.exports = {
    //port: 3010,
    url: {
        zenodeo: 'http://zenodeo.org/v3',
        //zenodo: 'https://zenodo.org/api/records'
    },
    // pino: {
    //     opts: {
    //         //prettyPrint: true,
    //         level: 'error'
    //     }
    // },
    debug: false,
    cacheOn: true,

    v3: {
        swagger: {
            options: {
                //routePrefix: '/documentation',
                //exposeRoute: true,
                swagger: {
                    // info: {
                    //     title: 'Zenodeo API documentation',
                    //     description: 'A `nodejs` interface to treatments from [TreatmentBank](http://treatmentbank.org) and resources on [Zenodo](https://zenodo.org)',
                    //     version: '3.0.0',
                    //     termsOfService: '/tos',
                    //     contact: {
                    //         name: 'API Support',
                    //         //url: 'http://www.example.com/support',
                    //         email: 'support@plazi.org'
                    //     },
                    //     license: {
                    //         name: 'CC0 Public Domain Dedication',
                    //         url: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode'
                    //     }
                    // },
                    // externalDocs: {
                    //     url: 'https://swagger.io',
                    //     description: 'Find more info on Swagger here'
                    // },

                    // make sure there is no scheme before the host
                    // that is, there should not be any 'http(s)://'
                    host: 'zenodeo.org/',
                    // schemes: ['http'],
                    // consumes: ['application/json'],
                    // produces: ['application/json']
                }
            }
        },

        // ajv: {
        //     options: {
        //         customOptions: {

        //             // The following is needed to pass single values as arrays
        //             // See https://github.com/fastify/help/issues/281
        //             coerceTypes: 'array',
        //             //coerceTypes: 'true',
        
        //             // Refer to [ajv options](https://ajv.js.org/#options)
        //             jsonPointers: true, 
        //             allErrors: true,
        
        //             // the following allows the `addtionalProperties`
        //             // false constraint in the JSON schema to be 
        //             // applied. Without this, any additional props
        //             // supplied in the querystring will be silently 
        //             // removed but no error will be raised
        //             removeAdditional: false
        //         },
        //         plugins: [
        //             require('ajv-errors')
        //         ]
        //     }
        // },

        // cache: {

        //     // default cache duration 1 day (24 hours)
        //     duration: 1 * 60 * 60 * 1000
        // }
    },

    // data: {
    //     treatments: path.join(cwd, '..', 'data', 'z3-treatments.sqlite'),
    //     etlStats:   path.join(cwd, '..', 'data', 'z3-etl-stats.sqlite'),
    //     queryStats: path.join(cwd, '..', 'data', 'z3-query-stats.sqlite')
    // },

    // truebug: {
    //     downloads: {

    //         // ********** full **********
    //         // example: 'http://tb.plazi.org/GgServer/dumps/plazi.zenodeo.zip'
    //         full: {
    //             path: 'http://tb.plazi.org/GgServer/dumps',
    //             file: 'plazi.zenodeo.zip'
    //         },

    //         // ********** diff **********
    //         // example 'http://tb.plazi.org/GgServer/srsStats/stats?outputFields=doc.uuid+doc.updateDate&groupingFields=doc.uuid+doc.updateDate&orderingFields=doc.updateDate&format=JSON&FP-doc.updateDate=%222020-07-03%22'
    //         diff: {
    //             path: 'http://tb.plazi.org/GgServer',
    //             file: 'srsStats/stats?outputFields=doc.uuid+doc.updateDate&groupingFields=doc.uuid+doc.updateDate&orderingFields=doc.updateDate&format=JSON&FP-doc.updateDate=',
    //         },

    //         // ********** single xml **********
    //         // example 'http://tb.plazi.org/GgServer/xml/8C2D95A59531F2DCB34D5040E36E6566'
    //         xml: {
    //             path: 'http://tb.plazi.org/GgServer',
    //             file: '',
    //         }
    //     },

    //     //dataDir:         path.join(cwd, '..', 'data'),
    //     treatmentsDump:    path.join(cwd, '..', 'data', 'z3-treatments-dump'),
    //     treatmentsArchive: path.join(cwd, '..', 'data', 'z3-treatments-archive')
    // }
}