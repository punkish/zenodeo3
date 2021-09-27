'use strict'

const { logger } = require('../../lib/utils')
const log = logger('TRUEBUG')

const fs = require('fs')

const config = require('config')
const DATADIR = config.get('truebug.dataDir')
const DUMP = config.get('truebug.treatmentsDump')

const { createDump, cleanOldDump } = require('./lib/pre-and-post-flight')
const download = require('./lib/download')
const parse = require('./lib/parse')
const { createTables, insertEtlStats, selCountOfTreatments } = require('./lib/database')
const OPTS = JSON.parse(JSON.stringify(config.get('truebug.opts')))

//
//   source                           target
//   +-------------------+         +-------------------+                                        
//   | plazi.zenodeo.zip |- curl ->| plazi.zenodeo.zip |                                        
//   +-------------------+         +-------------------+                                        
//                                          |                                                 
//                                        unzip
//                                          |                                                 
//   source                         dump    v                           archive                      
//   +-------+                     +-----------------+              +--------------------+
//   | <xml> |------------ curl -->| treatments-dump |- rearrange ->| treatments-archive |
//   +-------+                     +-----------------+              +--------------------+
//                                         \ ^ /
//                                          \|/           
//                                           |             
//                                          curl          
//   source                         target   |          
//   +-------------------+         +-----------------+
//   |   <diff>-<date>   |- curl ->| treatments-list |
//   +-------------------+         +-----------------+
//

const init = function(opts) {

    // make sure the process runs from ~/zenodeo/data
    log.info(`init() -> changing directory to ${DATADIR}`)
    process.chdir(DATADIR)

    // createTables(opts)

    // opts.etl.loaded = selCountOfTreatments()
    // if (!opts.etl.loaded) {
    //     opts.source = 'full'
    // }

    if (opts.download) {
        if (fs.existsSync(DUMP)) {
            log.info(`init() -> ${DUMP} exists, so cleaning it up`)
            cleanOldDump(opts)
        }
        
        log.info(`init() -> all clean, so creating ${DUMP}`)
        createDump(opts)
        download(opts)
    }

    // if (opts.parse) {
    //     fs.existsSync(DUMP) ? parse(opts) : console.error('there is no input available')
    // }

    // opts.etl.ended = Date.now()
    // console.log('\n')
    // console.log('='.repeat(75))
    // console.log(opts.etl)

    // insertEtlStats(opts)
}

init(OPTS)
// crontab -e
// 30 0 * * * cd /Users/punkish/Projects/zenodeo/zenodeo3 && NODE_ENV=test /opt/local/bin/node /Users/punkish/Projects/zenodeo/zenodeo3/bin/truebug/index.js