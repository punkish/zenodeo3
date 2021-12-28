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
        host: 'https://tb.plazi.org/GgServer/dumps/',
        downloads: {

            // ********** full **********
            // example: 'http://tb.plazi.org/GgServer/dumps/plazi.zenodeo.zip'
            full: {
                //path: 'http://tb.plazi.org/GgServer/dumps',
                file: 'plazi.xmlHistory.zip'
            },

            // ********** diff **********
            // example 'http://tb.plazi.org/GgServer/srsStats/stats?outputFields=doc.uuid+doc.updateDate&groupingFields=doc.uuid+doc.updateDate&orderingFields=doc.updateDate&format=JSON&FP-doc.updateDate=%222021-03-01%22'
            diff: {
                //path: 'http://tb.plazi.org/GgServer',
                file: 'srsStats/stats?outputFields=doc.uuid+doc.updateDate&groupingFields=doc.uuid+doc.updateDate&orderingFields=doc.updateDate&format=JSON&FP-doc.updateDate=',
            },

            // ********** single xml **********
            // example 'http://tb.plazi.org/GgServer/xml/8C2D95A59531F2DCB34D5040E36E6566'
            xml: {
                //path: 'http://tb.plazi.org/GgServer',
                //file: 'xml',
            }
        },

        //dataDir:         path.join(cwd, '..', 'data'),
        treatmentsDump:    path.join(dataDir, `${dataPrefix}-treatments-dump`),
        treatmentsArchive: path.join(dataDir, `${dataPrefix}-treatments-archive`)
    }
}