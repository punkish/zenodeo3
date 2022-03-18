'use strict'

/**************************************************************
 * 
 * The config options start with all the values in this file
 * 
 **************************************************************/

const path = require('path')
const cwd = process.cwd()
const dataDir = path.join(cwd, '..', 'data')
// const dbDir = path.join(dataDir, 'z3-sqlite')
// const dataPrefix = 'z3'

module.exports = {
    port: 3010,
    address: '0.0.0.0',
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
    isDebug: true,

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

                    /*
                    The following is needed to pass single values as arrays
                    See https://github.com/fastify/help/issues/281
                    */
                    coerceTypes: 'array',
                    //coerceTypes: true,
        
                    /* Refer to [ajv options](https://ajv.js.org/#options) */
                    jsonPointers: true, 
                    allErrors: true,
        
                    /*
                    The following allows the `addtionalProperties`
                    false constraint in the JSON schema to be 
                    applied. Without this, any additional props
                    supplied in the querystring will be silently 
                    removed but no error will be raised
                    */
                    removeAdditional: false,

                    useDefaults: true
                },
                plugins: [
                    require('ajv-errors')
                ]
            }
        },

        cache: {
            on: false,
            base: cwd,

            /* default cache ttl 1 day (24 hours) */
            ttl: 1 * 24 * 60 * 60 * 1000
        }
    },

    db: {
        h3             : path.join(dataDir, 'h3'),
        stats          : path.join(dataDir, 'z3-stats.sqlite'),
        treatments     : path.join(dataDir, 'z3-treatments.sqlite'),
        facets         : path.join(dataDir, 'z3-facets.sqlite'),
        gbifcollections: path.join(dataDir, 'z3-gbifcollections.sqlite')
    },

    truebug: {
        log: {
            level: 'info',
            transports: [ 'console', 'file' ],
            dir: path.join(cwd, 'bin/truebug/logs')
        },

        // run: 'test', // test data (small sample ~10K records)
        run: 'real', // real data
        // run: 'dry',     // simulated run, no commands executed

        // server where the data are stored
        // server: 'https://tb.plazi.org/dumps/',
        server: 'http://127.0.0.1/plazi/data',

        source: 'full',
        //source: 'monthly',
        // source: 'weekly',
        //source: 'daily',
        //source: 'single',

        /*
        by default, download the daily dump, and then go to
        the larger ones if a smaller one doesn't exist:
         - if plazi.zenodeo.daily.zip exists => use it
         - else if plazi.zenodeo.weekly.zip exists => use it
         - else if plazi.zenodeo.monthly.zip exists => use it
         - else use plazi.zenodeo.zip

        The full dump is packed once a year now
        The monthly dump is packed on the first Sunday of the month
        The weekly dump is packed every Sunday
        The daily dump is packed every day
        */
        download: {

            // example: 'http://127.0.0.1/plazi/data/test.zip'
            full: 'plazi.zenodeo.zip',
            monthly: 'plazi.zenodeo.monthly.zip',
            weekly: 'plazi.zenodeo.weekly.zip',
            daily: 'plazi.zenodeo.daily.zip',

            // '03FC87E61268FFD6D3E36CD2FE12DF29'
            // 'BF8A576EC3F6661E96B5590C108213BA'
            // '0247B450A734FFD280E97BD0FA9FFA55',
            single: 'BF8A576EC3F6661E96B5590C108213BA',  
        },

        dirs: {
            data   : dataDir,
            dump   : path.join(dataDir, 'treatments-dump'),
            old    : path.join(dataDir, 'treatments-dump-old'),
            archive: path.join(dataDir, 'treatments-archive')
        }
    }
}