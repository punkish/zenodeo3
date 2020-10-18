'use strict'

const config = require('config')
const JSON5 = require('json5')

const pino = require('pino')

const pinoOpts = {
    prettyPrint: true,
    level: config.get('pino.opts.level')
}

module.exports = (name) => {
    pinoOpts.name = name
    return pino(pinoOpts)
}