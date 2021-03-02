'use strict'

const execSync = require('child_process').execSync
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const config = require('config')
const hostname = config.get('truebug.hostname')
const downloads = config.get('truebug.downloads')

const getDateOfLastDownload = function() {
    return "2021-02-10"
}

const assignNames = function(opts) {

    const names = {

        // source – 'full' (default) or 'diff' or <XML GUID>
        // to be set below
        
        // target – source + <datetime stamp>
        // to be set below
    
        // dump – this where the target is unzipped
        dump: config.get('truebug.treatmentsDump'),

        // dumpOld – the old dump directory
        dump_old: `${config.get('truebug.treatmentsDump')}_old`,
    
        // archive – the treatments XMLs are rearranged 
        // alphabetically and hierarchically
        archive: config.get('truebug.treatmentsArchive')
    }

    if (opts.download) {

        let filename
        
        if (opts.download === 'full') {
            filename = downloads[opts.download]
        }
        else if (opts.download === 'diff') {
            filename = `${downloads[opts.download]}="${getDateOfLastDownload()}"`
        }
        else if (opts.download.length === 32) {
            filename = `${downloads.single}/${opts.download}`
        }

        names.source = `${hostname}/${filename}`

        // create the target file by adding date-time stamp 
        // to the basename of the src
        const ext = '.zip';
        const basename = path.basename(filename, ext)

        // a date-time stamp that looks like 
        // `[yyyy-mm-dd]-[hh]h[mm]m[ss]s`
        const dt = new Date()
            .toISOString()
            .replace(/\..+/, '')
            .replace(/T(\d\d):(\d\d):(\d\d)/, '-$1h$2m$3s')
            
        names.target = `${basename}-${dt}${ext}` 
    }
    
    return names
}

const checkIfDumpExists = function({ opts, names }) {

    // back up the dump directory if it exists
    process.stdout.write(`   - ${chalk.bold(names.dump)} exists … `)
    if (fs.existsSync(names.dump)) {
        console.log(chalk.green('yes'))

        if (opts.download) {
            process.stdout.write(`     backing it to ${chalk.bold(names.dump_old)} … `)
            if (!opts.dryrun) execSync(`mv ${names.dump} ${names.dump_old}`)
            console.log(chalk.green('done'))
        }
    }

    // create the dump directory
    else {
        console.log(chalk.red('no'))
        process.stdout.write(`     creating it… `)
        if (!opts.dryrun) fs.mkdirSync(names.dump)
        console.log(chalk.green('     done'))
    }
}

const checkIfArchiveExists = function({ opts, names }) {

    // create the directory if it doesn't exists
    process.stdout.write(`   - ${chalk.bold(names.archive)} exists … `)
    if (fs.existsSync(names.archive)) {
        console.log(chalk.green('moving on'))
    }
    else {
        console.log(chalk.red('no'))
        process.stdout.write(`     creating it… `)
        if (!opts.dryrun) fs.mkdirSync(names.archive)
        console.log(chalk.green('done'))
    }
}

const cleanUp = function({ opts, names }) {
    let cleaned = false

    if (names.target && fs.existsSync(names.target)) {
        process.stdout.write(`   - deleting ${chalk.bold(names.target)} … `)
        if (!opts.dryrun) execSync(`rm -Rf ${names.target}`)
        cleaned = true
        console.log(chalk.green('done'))
    }

    if (names.dump_old && fs.existsSync(names.dump_old)) {
        process.stdout.write(`   - deleting ${chalk.bold(names.dump_old)} … `)
        if (!opts.dryrun) execSync(`rm -Rf ${names.dump_old}`)
        cleaned = true
        console.log(chalk.green('done'))
    }

    if (!cleaned) {
        console.log('   - nothing to clean')
    }
}

module.exports = {
    assignNames,
    checkIfDumpExists,
    checkIfArchiveExists,
    cleanUp
}