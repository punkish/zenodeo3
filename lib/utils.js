'use strict'

//const config = require('config')
//const loglevel = config.get('pino.opts.level')

const fs = require('fs')
const pino = require('pino')
// const pretty = require('pino-pretty')
// const logdir = '/Users/punkish/Projects/zenodeo/zenodeo3/bin/truebug/logs'


module.exports = {
    logger: function(caller) {
        const d = new Date()
        const ts = `,"time":"${d.toLocaleDateString('en-US', {dateStyle: 'short', timeStyle: 'short'})}"`

        const opts = {
            name: caller,
            base: undefined,

            //One of 'fatal', 'error', 'warn', 'info', 'debug', 'trace' or 'silent'
            level: 'debug',
            timestamp: () => ts,
            // transport: {
            //     targets: [
            //         {target: 'pino-pretty'},
            //         { 
            //             target: 'pino/file',
            //             level: 'debug',
            //             options: {destination: `${logdir}/debug.log`}
            //         },
            //         { 
            //             target: 'pino/file',
            //             level: 'info',
            //             options: {destination: `${logdir}/info.log`}
            //         },
            //         { 
            //             target: 'pino/file',
            //             level: 'warn',
            //             options: {destination: `${logdir}/warn.log`}
            //         },
            //         { 
            //             target: 'pino/file',
            //             level: 'error',
            //             options: {destination: `${logdir}/error.log`}
            //         },
            //         { 
            //             target: 'pino/file',
            //             level: 'fatal',
            //             options: {destination: `${logdir}/fatal.log`}
            //         }
            //     ]
            // }
        }

        //return pino(opts, pino.multistream(streams))
        return pino(opts)
    },

    // Convert ms into human-readable string of "? s and ? ms"
    timerFormat: function(t) {
        const s = t >= 1000 ? Math.round(t / 1000) : ''
        return s ? `${s}s ${t - (s * 1000)}ms` : `${t}ms`
    }
}