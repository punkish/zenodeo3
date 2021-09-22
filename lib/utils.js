'use strict'

const config = require('config')
const pino = require('pino')

module.exports = {
    logger: function(caller) {
        return pino({
            name: caller,
            level: config.get('pino.opts.level'),
            base: undefined,
            prettyPrint: true,
            timestamp: () => {
                const d = new Date()
                return `,"time":"${d.toLocaleDateString('en-US', { dateStyle: 'short', timeStyle: 'short' })}"`
            }
        })
    },

    // Convert ms into human-readable string of "? s and ? ms"
    timerFormat: function(t) {
        const s = t >= 1000 ? Math.round(t / 1000) : ''
        return s ? `${s}s ${t - (s * 1000)}ms` : `${t}ms`
    }
}