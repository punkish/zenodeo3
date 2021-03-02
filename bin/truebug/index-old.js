'use strict'

const config = require('config')
const chalk = require('chalk')
const opts = require('./lib/opts')
const download = require('./lib/download')

//const Utils = require('../../api/v2/utils')

//
// const parse = require('./parse')
// const database = require('./database'
// const plog = require(config.get('plog'))

let timer = process.hrtime()

// if (opts.dryrun) {
//     console.log('-'.repeat(75))
//     console.log(chalk.bold('This is a dry run'))
//     console.log('='.repeat(75),'\n')
// }

// let oldExists = false
// let dump
// let dumpOld
// let tgt
// let src

// // download new files zip archive
// if (opts.download) {
//     const v = download.prepareForDownload(opts)
//     dump = v.dump
//     dumpOld = v.dumpOld
//     tgt = v.tgt
//     src = v.src
    
//     oldExists = download.checkDumpExists(opts.dryrun, dump, dumpOld)
//     download.downloadArchive(opts.dryrun, src, tgt)
//     download.unpackArchive(opts.dryrun, tgt, dump)
// }

// // if (opts.database) {

// //     // tables will get created if they don't already exist
// //     database.createTablesStatic()

// //     // insert statements will be prepared and stored to run
// //     // as transactions
// //     database.createInsertStatements()
// // }

// // if (opts.parse) parse(opts.parse, opts.rearrange, opts.database)
// // if (opts.database) database.indexTablesStatic()

// if (opts.download) {
//     download.cleanUp(opts.dryrun, tgt, oldExists, dumpOld)
// }

timer = process.hrtime(timer)
console.log('\n')
console.log('='.repeat(75))
console.log(`Time taken: ${timerFormat(timer).timeInEnglish}`)