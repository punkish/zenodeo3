'use strict'

const config = require('config')
const JSON5 = require('json5')

const pino = require('pino')
const pinoOpts = JSON5.parse(JSON5.stringify(config.get('pino.opts')))

module.exports = (name) => {
    pinoOpts.name = name
    return pino(pinoOpts)
}