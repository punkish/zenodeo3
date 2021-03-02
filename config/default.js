'use strict'

/**************************************************************
 * 
 * The config options start with all the values in this file
 * 
 * 
 **************************************************************/

const path = require('path')
const cwd = process.cwd()
const dataDir = path.join(cwd, '..', 'data')
const dataPrefix = 'test'

module.exports = {
    port: 3010,
    url: {
        zenodeo: 'http://127.0.0.1:3010/v3',
        zenodo: 'https://zenodo.org/api/records'
    },
    pino: {
        opts: {
            prettyPrint: true,
            level: 'info'
        }
    },
    debug: true,
    cacheOn: false,

    v3: {
        swagger: {
            options: {
                //routePrefix: '/documentation',
                exposeRoute: true,
                swagger: {
                    info: {
                        title: 'Zenodeo API documentation',
                        description: 'A `nodejs` interface to treatments from [TreatmentBank](http://treatmentbank.org) and resources on [Zenodo](https://zenodo.org)',
                        version: '3.0.0',
                        termsOfService: '/tos',
                        contact: {
                            name: 'API Support',
                            //url: 'http://www.example.com/support',
                            email: 'support@plazi.org'
                        },
                        license: {
                            name: 'CC0 Public Domain Dedication',
                            url: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode'
                        }
                    },
                    externalDocs: {
                        url: 'https://swagger.io',
                        description: 'Find more info on Swagger here'
                    },

                    // make sure there is no scheme before the host
                    // that is, there should not be any 'http(s)://'
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

                    // The following is needed to pass single values as arrays
                    // See https://github.com/fastify/help/issues/281
                    coerceTypes: 'array',
                    //coerceTypes: 'true',
        
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
        treatments: path.join(cwd, '..', 'data', `${dataPrefix}-treatments.sqlite`),
        etlStats:   path.join(cwd, '..', 'data', `${dataPrefix}-etl-stats.sqlite`),
        queryStats: path.join(cwd, '..', 'data', `${dataPrefix}-query-stats.sqlite`)
    },

    truebug: {
        host: 'http://127.0.0.1/plazi/data',
        downloads: {

            // ********** full **********
            // example: 'http://127.0.0.1/plazi/data/test.zip'
            full: {
                //path: 'http://127.0.0.1/plazi/data',
                file: 'plazi.zenodeo.zip'
            },

            // ********** diff **********
            // example 'http://127.0.0.1/plazi/data/diff.txt'
            diff: {
                //path: 'http://127.0.0.1/plazi/data',
                file: 'diff.json'
            },
            
            // ********** single xml **********
            // example 'http://127.0.0.1/plazi/data/8C2D95A59531F2DCB34D5040E36E6566'
            xml: {
                //path: 'http://127.0.0.1/plazi/data',
                file: 'xml'
            }
        },

        opts: {
            dryrun: false,
        
            //download: 'full',
            download: 'diff',
            //download: 'F57587F8FFCFFFF8FF68FBB7FAD2FA31',
        
            database: true,
            parse: true,
            rearrange: true,
        
            preparedInsertStatements: {},
            
            etl: {
                started: Date.now(),
                downloaded: 0,
                parsed: {
                    treatments: 0,
                    treatmentCitations: 0,
                    treatmentAuthors: 0,
                    materialsCitations: 0,
                    figureCitations: 0,
                    bibRefCitations: 0
                },
                loaded: 0,
                ended: 0
            }
            
        },

        dataDir:           dataDir,
        treatmentsDump:    path.join(dataDir, `${dataPrefix}-treatments-dump`),
        treatmentsArchive: path.join(dataDir, `${dataPrefix}-treatments-archive`)
    }
}