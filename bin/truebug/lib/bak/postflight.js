'use strict'

const {r, g, b, B, $} = require('../utils')

const { logger } = require('../../../lib/utils')
const log = logger('TRUEBUG:POSTFLIGHT')
const fs = require('fs')

/* delete the old dump */
const deleteOldDump = (truebug) => {
    const s = truebug.switches
    
    if (s.deleteOldDump) {
        const oldDump = `${truebug.dirs.dump}Old`
        log.info(`removing ${b(oldDump)}`)
        let cmd = `fs.rmdirSync('${oldDump}', { recursive: true })`
        log.info($(cmd))
    
        if (truebug.run === 'real') eval(cmd)
    }
}

module.exports = {deleteOldDump}