'use strict'

/**************************************************************
 * 
 * The config options this file modify config/default when the
 * app is running in TEST mode
 * 
 **************************************************************/

// const path = require('path')
// const cwd = process.cwd()
// const dataDir = path.join(cwd, '..', 'data')
// const dataPrefix = 'z3'

module.exports = {
    url: {
        zenodeo: 'http://test.zenodeo.org/v3',
    },
    pino: {
        opts: {
            level: 'info' // 'error'
        }
    },

    v3: {
        swagger: {
            options: {
                //routePrefix: '/documentation',
                exposeRoute: true,
                swagger: {

                    // make sure there is no scheme before the host
                    // that is, there should not be any 'http(s)://'
                    host: 'test.zenodeo.org',
                    schemes: ['https'],
                    consumes: ['application/json'],
                    produces: ['application/json']
                }
            }
        },

        cache: {
            on: true,
        }
    },

    truebug: {
        server: 'https://tb.plazi.org/dumps/',

        //dataDir:         path.join(cwd, '..', 'data'),
        // treatmentsDump:    path.join(dataDir, `${dataPrefix}-treatments-dump`),
        // treatmentsArchive: path.join(dataDir, `${dataPrefix}-treatments-archive`)
    }
}