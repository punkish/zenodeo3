'use strict'

const chalk = require('chalk')
const b = (str) => chalk.bold(str)
const c = (str) => `  ${chalk.red('$')} ${chalk.red(str)}`

const { logger } = require('../../lib/utils')
const log = logger('TRUEBUG')

const { createTables, loadFTS, buildIndexes, insertEtlStats } = require('./lib/database')
const parse = require('./lib/parse')

const config = require('config')
const truebug = JSON.parse(JSON.stringify(config.get('truebug')))

// check for and create archive if needed
const checkArchive = (truebug) => {
    const s = truebug.switches

    if (s.checkArchive) {
        const archive = truebug.dirs.archive
        let cmd = `fs.existsSync(${archive})`
        log.info(`checking if ${b(archive)} exists`)
        log.info(c(cmd))
    
        const archiveExists = truebug.run === 'real' ? eval(cmd) : false
    
        // create archive if it doesn't exist
        if (s.createArchive) {
            if (!archiveExists) {
                cmd = `fs.mkdir(${archive})`
                log.info(`making ${b(archive)}`)
                log.info(c(cmd))
    
                if (truebug.run === 'real') eval(cmd)
            }
        }
    }
}

// check for and create new dump if needed
const checkDump = (truebug) => {
    const s = truebug.switches

    if (s.checkDump) {
        const dump = truebug.dirs.dump
        let cmd = `fs.existsSync(${dump})`
        log.info(`checking if ${b(dump)} exists`)
        log.info(c(cmd))
    
        const dumpExists = truebug.run === 'real' ? eval(cmd) : false
        
        // backup dump if it exists
        if (s.backupDump) {
            if (dumpExists) {
                cmd = `fs.renameSync(${dump}, ${dump}Old)`
                log.info(`backing up ${b(dump)}`)
                log.info(c(cmd))
    
                if (truebug.run === 'real') eval(cmd)
            }
        }
    }

    if (s.createDump) {
        const dump = truebug.dirs.dump
        let cmd = `fs.mkdir(${dump})`
        log.info(`making ${b(dump)}`)
        log.info(c(cmd))

        if (truebug.run === 'real') eval(cmd)
    }
}

// download zip and unzip into new dump
const downloadSource = (truebug) => {
    const s = truebug.switches

    if (s.downloadSource) {
        const zs = `${truebug.server}/${truebug.download[truebug.source]}`
        const zt = `${truebug.dirs.data}/${truebug.download[truebug.source]}`
        const cmd = `curl --output '${zt}' '${zs}'`
        log.info(`downloading ${b(zs)}`)
        log.info(c(cmd))
    
        if (truebug.run === 'real') {
            execSync(cmd)
            log.info(`downloaded ${b(zs)}`)
        }
    }

    if (s.unzipSource) {
        const zt = `${truebug.dirs.data}/${truebug.download[truebug.source]}`
        const dd = truebug.dirs.dump
        let cmd = `unzip -q -n '${zt}' -d '${dd}'`
        log.info(`unzipping ${b(zt)}`)
        log.info(c(cmd))
        
        if (truebug.run === 'real') {
            execSync(cmd)
            log.info(`unzipped ${b(zt)}`)
    
            // find number of files in the zip source
            cmd = `unzip -Z -1 ${zt} | wc -l`
            truebug.etlStats.downloaded = Number(execSync(cmd).toString().trim())
            log.info(`downloaded ${truebug.etlStats.downloaded} treatments`)
        }
    }
}

// delete the old dump
const deleteOldDump = (truebug) => {
    const s = truebug.switches
    
    if (s.deleteOldDump) {
        const oldDump = `${truebug.dirs.dump}Old`
        log.info(`removing ${b(oldDump)}`)
        let cmd = `fs.rmdirSync('${oldDump}', { recursive: true })`
        log.info(c(cmd))
    
        if (truebug.run === 'real') eval(cmd)
    }
}

checkArchive(truebug)
checkDump(truebug)
downloadSource(truebug)
createTables(truebug)
parse(truebug)
loadFTS(truebug)
buildIndexes(truebug)
insertEtlStats(truebug)
deleteOldDump(truebug)