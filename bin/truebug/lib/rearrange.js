'use strict'

const fs = require('fs')
const mkdirp = require('mkdirp')

const chalk = require('chalk')
const config = require('config')
const srcdir = config.get('truebug.treatmentsDump')
const destdir = config.get('truebug.treatmentsArchive')


const rearrangeFiles = function({ opts, file }) {
    const one = file.substr(0, 1)
    const two = file.substr(0, 2)
    const thr = file.substr(0, 3)

    const src = `${srcdir}/${file}`
    const dest = `${destdir}/${one}/${two}/${thr}`
    const tgt = `${dest}/${file}`

    //process.stdout.write(`   - copying ${chalk.bold(src)} to ${chalk.bold(tgt)} … `)
    if (!opts.dryrun) {
        mkdirp.sync(dest)
        fs.copyFileSync(src, tgt)
    }
}

module.exports = rearrangeFiles