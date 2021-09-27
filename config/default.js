'use strict'

/**************************************************************
 * 
 * The config options start with all the values in this file
 * 
 **************************************************************/

const path = require('path')
const cwd = process.cwd()
const dataDir = path.join(cwd, '..', 'data')
const dataPrefix = 'z3'

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
    //cacheOn: false,

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
                    //coerceTypes: 'array',
                    coerceTypes: true,
        
                    // Refer to [ajv options](https://ajv.js.org/#options)
                    jsonPointers: true, 
                    allErrors: true,
        
                    // the following allows the `addtionalProperties`
                    // false constraint in the JSON schema to be 
                    // applied. Without this, any additional props
                    // supplied in the querystring will be silently 
                    // removed but no error will be raised
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

            // default cache duration 1 day (24 hours)
            duration: 1 * 60 * 60 * 1000
            //duration: 1000
        }
    },

    db: {
        treatments:  path.join(dataDir, `${dataPrefix}-treatments.sqlite`),
        etlStats:    path.join(dataDir, `${dataPrefix}-etl-stats.sqlite`),
        queryStats:  path.join(dataDir, `${dataPrefix}-query-stats.sqlite`),
        collections: path.join(dataDir, `${dataPrefix}-collections.sqlite`),
        facets:      path.join(dataDir, 'facets.sqlite')
    },

    truebug: {

        // run: 'test', // test data (small sample ~10K records)
        // run: 'real', // real data
        run: 'real',     // simulated run, no commands executed

        switches: {
            checkArchive  : false,
            createArchive : false,
            checkDump     : false,
            createDump    : false,
            downloadSource: false,
            unzipSource   : false,
            createTables  : false,
            parse         : false,
            insertData    : false,
            loadFTS       : false,
            rearrange     : true,
            buildIndexes  : false,
            insertEtlStats: false,
            deleteOldDump : false
        },

        // server where the data are stored
        // server: 'https://tb.plazi.org/dumps/',
        server: 'http://127.0.0.1/plazi/data/dumps',

        source: 'full',
        // source: 'monthly',
        // source: 'weekly',
        // source: 'daily'
        // source: '0247B450A734FFD280E97BD0FA9FFA55',

        treatmentsToParse: '',

        // by default, download the daily dump, and then go to
        // the larger ones if a smaller one doesn't exist:
        //  - if plazi.zenodeo.daily.zip exists => use it
        //  - else if plazi.zenodeo.weekly.zip exists => use it
        //  - else if plazi.zenodeo.monthly.zip exists => use it
        //  - else use plazi.zenodeo.zip

        // The full dump is packed once a year now
        // The monthly dump is packed on the first Sunday of the month
        // The weekly dump is packed every Sunday
        // The daily dump is packed every day
        download: {

            // example: 'http://127.0.0.1/plazi/data/dumps/test.zip'
            full: 'plazi.zenodeo.zip',
            monthly: 'plazi.zenodeo.monthly.zip',
            weekly: 'plazi.zenodeo.weekly,zip',
            daily: 'plazi.zenodeo.daily,zip'
        },

        // The different operations to perform
        ops: {
            download: true,
            database: true,
            parse: true,
            rearrange: true
        },
        
        preparedInsertStatements: {},
        fts: ['vtreatments', 'vfigurecitations', 'vbibrefcitations'],
        etlStats: {
            started: Date.now(),
            downloaded: 0,
            parsed: {
                treatments: 0,
                treatmentCitations: 0,
                treatmentAuthors: 0,
                materialsCitations: 0,
                collectionCodes: 0,
                figureCitations: 0,
                bibRefCitations: 0
            },
            loaded: 0,
            ended: 0
        },

        dirs: {
            data: dataDir,
            dump: path.join(dataDir, `${dataPrefix}-treatments-dump`),
            old: path.join(dataDir, `${dataPrefix}-treatments-dump-old`),
            archive: path.join(dataDir, `${dataPrefix}-treatments-archive`),
        }
    }
}