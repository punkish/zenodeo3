'use strict'

const fs = require('fs')
const execSync = require('child_process').execSync
const chalk = require('chalk')

const config = require('config')
const DUMP = config.get('truebug.treatmentsDump')

const createDump = function(opts) {

    // create the dump directory
    console.log(`creating ${chalk.bold(DUMP)}`)
    if (opts.runtype === 'real') {
        if (!fs.existsSync(DUMP)) {
            fs.mkdirSync(DUMP)
        }
    }
}

const cleanOldDump = function(opts) {
    const dumpOld = `${DUMP}-old`

    if (fs.existsSync(dumpOld)) {
        console.log(`removing ${chalk.bold(dumpOld)}`)
        if (opts.runtype === 'real') {
            execSync(`rm -Rf ${dumpOld}`)
            fs.renameSync(DUMP, dumpOld)
        }
    }
}

module.exports = { createDump, cleanOldDump }