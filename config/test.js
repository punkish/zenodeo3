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