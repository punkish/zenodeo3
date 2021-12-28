'use strict'

const execSync = require('child_process').execSync
const Logger = require('../utils')
const level = 'info'
const transports = [ 'console', 'file' ]
const logdir = '/Users/punkish/Projects/zenodeo/zenodeo3/bin/truebug/logs'
const log = new Logger({level, transports, logdir})

// const fs = require('fs')
// const http = require('http')

const unzip = function(truebug, downloadtype) {    
    log.info(`unzipping ${downloadtype} archive`)
    const archive = `${truebug.dirs.data}/${truebug.download[downloadtype]}`
    const cmd = `unzip -q -n ${archive} -d ${truebug.dirs.dump}`
    //log.info($(cmd))
    if (truebug.run === 'real') {
        execSync(cmd)
        const files = Number(execSync(`unzip -Z -1 ${archive} | wc -l`).toString().trim())
        log.info(`downloaded ${files} files`)
        return files
    }
}

module.exports = {
    download: (truebug, downloadtype) => {
        log.info(`downloading ${downloadtype} archive`)
        const local = `${truebug.dirs.data}/${truebug.download[downloadtype]}`
        const remote = `${truebug.server}/${truebug.download[downloadtype]}`
        const cmd = `curl --silent --output ${local} '${remote}'`
        //log.info(cmd)
        //if (truebug.run === 'real') execSync(cmd)
        return unzip(truebug, downloadtype)
    },

    unzip
}