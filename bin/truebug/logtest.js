'use strict'

const Logger = require('./utils')

const level = 'info'
const transports = [ 'console', 'file' ]
const logdir = '/Users/punkish/Projects/zenodeo/zenodeo3/bin/truebug/logs'
const log = new Logger({level, transports, logdir})

log.loglevel()
log.info('writing with LOG2')
log.info('something else')
log.error('oops I did it again');

[...Array(100)].forEach((i, x) => {
    if (x === 0) {
        log.info(`${x} … `, 'start')
    }
    else {
        log.info(`${x} … `, 'end')
    }
})

log.info('100\n', 'end')
log.info('DONE')