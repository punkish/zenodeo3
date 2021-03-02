'use strict'

const config = require('config')
//const JSON5 = require('json5')
const pino = require('pino')

module.exports = {
    logger: function (caller) {

        const pinoOpts = {
            prettyPrint: true,
            level: config.get('pino.opts.level'),
            name: caller
        }
    
        return pino(pinoOpts)
    },

    // Convert the time from process.hrtime() into 
    // human-readable total ms and an English-string 
    // of "? s and ? ms"
    timerFormat: function (t) {

        // seconds and nanoseconds
        let [s, ns] = t

        // Time taken in ms
        const ms = ns / 1000000
        const timeInMs = Math.round(ms)

        // Time in an English-readable string
        let timeInEnglish
        if (ms >= 1000) {
            
            s = s + Math.round(ms / 1000)
            timeInEnglish = `${s}s ${ms - (s * 1000)}ms`
        }
        else {
            timeInEnglish = `${timeInMs}ms`
        }

        return {
            timeInMs: timeInMs, 
            timeInEnglish: timeInEnglish
        }
    }
}