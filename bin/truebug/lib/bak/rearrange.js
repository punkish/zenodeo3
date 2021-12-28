'use strict'

const fs = require('fs')
const mkdirp = require('mkdirp')

const chalk = require('chalk')
const c = (str) => `${chalk.red('$')} ${chalk.red(str)}`
const b = (str) => chalk.bold(str)

const config = require('config')
const srcdir = config.get('truebug.dirs.dump')
const destdir = config.get('truebug.dirs.archive')

const { logger } = require('../../../lib/utils')
const log = logger('TRUEBUG:PARSE')

const rearrangeFiles = function(truebug, file) {
    const s = truebug.switches

    if (s.rearrange) {
        const one = file.substr(0, 1)
        const two = file.substr(0, 2)
        const thr = file.substr(0, 3)

        const src = `${srcdir}/${file}`
        const dest = `${destdir}/${one}/${two}/${thr}`
        const tgt = `${dest}/${file}`

        const cmd1 = `mkdirp.sync('${dest}')`
        // log.info(`making directory ${b(dest)}`)
        // log.info(c(cmd1))

        const cmd2 = `fs.copyFileSync('${src}', '${tgt}')`
        // log.info(`copying ${b(src)} to ${b(tgt)}`)
        // log.info(c(cmd2))
        if (truebug.run === 'real') {
            eval(cmd1)
            eval(cmd2)
        }
    }
}

module.exports = rearrangeFiles