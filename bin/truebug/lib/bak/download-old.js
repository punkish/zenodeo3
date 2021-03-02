'use strict'

const execSync = require('child_process').execSync
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const config = require('config')
const hostname = config.get('truebug.hostname')
const downloads = config.get('truebug.downloads')

const done = chalk.green('done')

const prepareForDownload = function(opts) {

    const filename = downloads[opts.download]
    const src = `${hostname}/${filename}`

    /******************************************************/
    // create the tgt file by adding date-time stamp to the 
    // basename of the src
    const ext = '.zip';
    const basename = path.basename(filename, ext)

    // a date-time stamp that looks like `[yyyy-mm-dd]-[hh]h[mm]m[ss]s`
    const dt = new Date()
        .toISOString()
        .replace(/\..+/, '')
        .replace(/T(\d\d):(\d\d):(\d\d)/, '-$1h$2m$3s')
        
    const tgt = `${basename}-${dt}${ext}` 
    /******************************************************/

    const dump = config.get('truebug.treatmentsDump')
    const dumpOld = `${dump}Old`

    return { dump ,dumpOld, src, tgt }
}

const checkDumpExists = function(dryrun, dump, dumpOld) {
    process.stdout.write(`1. checking if ${chalk.bold(dump)} exists … `)

    let oldExists = false

    // back up the dump directory if it exists
    if (fs.existsSync(dump)) {
        oldExists = true
        console.log(chalk.green('yes'))
        process.stdout.write(`   - backing ${chalk.bold(dump)} to ${chalk.bold(dumpOld)} … `)
        if (!dryrun) execSync(`mv ${dump} ${dumpOld}`)
        console.log(done)
    }

    // create the dump directory
    else {
        console.log(chalk.red('no'))
        process.stdout.write(`   - creating ${chalk.bold(dump)}… `)
        if (!dryrun) fs.mkdirSync(dump)
        console.log(done)
    }

    return oldExists
}

const downloadArchive = function(dryrun, src, tgt) {
    process.stdout.write(`2. downloading ${chalk.bold(src)} to ${chalk.bold(tgt)} … `)
    if (!dryrun) execSync(`curl --output ${tgt} ${src}`)
    console.log(done)
}

const unpackArchive = function(dryrun, tgt, dump) {
    process.stdout.write(`3. unzipping ${chalk.bold(tgt)} to ${chalk.bold(dump)} … `)
    if (!dryrun) execSync(`unzip -q -n ${tgt} -d ${dump}`)
    console.log(done)
}

const cleanUp = function(dryrun, tgt, oldExists, dumpOld) {
    console.log(`4. cleaning up …`)
    process.stdout.write(`   - deleting ${chalk.bold(tgt)} … `)
    if (!dryrun) execSync(`rm -Rf ${tgt}`)
    console.log(done)

    if (oldExists) {
        process.stdout.write(`   - deleting ${chalk.bold(dumpOld)} … `)
        if (!dryrun) execSync(`rm -Rf ${dumpOld}`)
        console.log(done)
    }
}

module.exports = { 
    prepareForDownload, 
    checkDumpExists, 
    downloadArchive, 
    unpackArchive, 
    cleanUp 
}


// unzip and print out . to show progress
//unzip -o 1b1-2020-08-13-05h54m57s.zip -d treatments-2020-08-13-06h00m01s | awk 'BEGIN {ORS=""} {if(NR%1==0)print "."}'