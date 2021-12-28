'use strict'

const config = require('config')
const Logger = require('../utils')
const level = 'info'
const transports = [ 'console', 'file' ]
const logdir = '/Users/punkish/Projects/zenodeo/zenodeo3/bin/truebug/logs'
const log = new Logger({level, transports, logdir})

const fs = require('fs')
const path = require('path')

const dirExists = (truebug, dirtype) => {
    log.info(`checking if ${dirtype} exists… `, 'start')
    const dir = truebug.dirs[dirtype]
    let cmd = `fs.existsSync('${dir}')`
    const exists = eval(cmd)
    if (exists) {
        log.info('yes, it does\n', 'end')
    }
    
    return exists
}

const createDir = (truebug, dirtype) => {
    const dir = truebug.dirs[dirtype]
    const cmd = `fs.mkdirSync('${dir}')`
    log.info(`${dirtype} doesn't exist… making it`)
    //log.info(`${$cmd}\n`)
    if (truebug.run === 'real') eval(cmd)
}

const checkDir = (truebug, dirtype) => {
    if (!dirExists(truebug, dirtype)) {
        createDir(truebug, dirtype)
    }
}

const fileaway = (truebug, xml) => {        
    const src = `${config.get('truebug.dirs.dump')}/${xml}`

    const one = xml.substr(0, 1)
    const two = xml.substr(0, 2)
    const thr = xml.substr(0, 3)
    const dst = `${config.get('truebug.dirs.archive')}/${one}/${two}/${thr}`

    const cleanname = xml.replace(/\.\./, '.')
    const tgt = `${dst}/${cleanname}`

    const cmd1 = `fs.mkdirSync('${dst}', {recursive: true})`
    const cmd2 = `fs.copyFileSync('${src}', '${tgt}')`
    const cmd3 = `fs.rmSync('${src}')`
    
    if (truebug.run === 'real') {
        //eval(cmd1)
        //eval(cmd2)
        eval(cmd3)
    }
}

const preflight = {
    checkDir,
    filesExistInDump: (truebug) => fs.readdirSync(truebug.dirs.dump).filter(f => path.extname(f) === '.xml'),
    fileaway
}

module.exports = preflight