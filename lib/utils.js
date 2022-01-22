'use strict'

//const config = require('config')
//const loglevel = config.get('pino.opts.level')

const fs = require('fs')
const pino = require('pino')
// const pretty = require('pino-pretty')
// const logdir = '/Users/punkish/Projects/zenodeo/zenodeo3/bin/truebug/logs'

const logger = function(caller) {
    const d = new Date()
    const ts = `,"time":"${d.toLocaleDateString('en-US', {dateStyle: 'short', timeStyle: 'short'})}"`

    const opts = {
        name: caller,
        base: undefined,

        //One of 'fatal', 'error', 'warn', 'info', 'debug', 'trace' or 'silent'
        level: 'debug',
        timestamp: () => ts,
        prettyPrint: {
            levelFirst: true
        }
    }

    //return pino(opts, pino.multistream(streams))
    return pino(opts)
}

// Convert ms into human-readable string of "? s and ? ms"
const timerFormat = function(t) {
    const s = t >= 1000 ? Math.round(t / 1000) : ''
    return s ? `${s}s ${t - (s * 1000)}ms` : `${t}ms`
}

const re = {
    date: '\\d{4}-\\d{1,2}-\\d{1,2}',
    year: '^\\d{4}$',
    real: '((\\+|-)?(\\d+)(\\.\\d+)?)|((\\+|-)?\\.?\\d+)'
}

const getPattern = (field) => {
    let operator;
    let condition1;
    let condition2;
    let condition;

    if (field === 'geolocation') {
        const radius     = `\\s*radius:(?<radius>${re.real})`;
        const units      = `\\s*units:\\s*'(?<units>kilometers|miles)'`;
        const lat        = `\\s*lat:\\s*(?<lat>${re.real})`;
        const lng        = `\\s*lng:\\s*(?<lng>${re.real})`;
        const min_lat    = `lat:\\s*(?<min_lat>${re.real})`;
        const min_lng    = `lng:\\s*(?<min_lng>${re.real})`;
        const max_lat    = `lat:\\s*(?<max_lat>${re.real})`;
        const max_lng    = `lng:\\s*(?<max_lng>${re.real})`;
        const lowerLeft  = `\\s*lowerLeft:\\s*{${min_lat},\\s*${min_lng}}`;
        const upperRight = `\\s*upperRight:\\s*{${max_lat},\\s*${max_lng}}`;
        operator         = `(?<operator>within|containedIn)`;
        condition1       = `${radius},${units},${lat},${lng}`;
        condition2       = `${lowerLeft},${upperRight}`;
        condition        = `{(${condition1}|${condition2})}`;
    }
    else if (field === 'date') {
        operator         = `(?<operator>eq|since|until|between)?`;
        condition1       = `(?<date>${re.date})`;
        condition2       = `(?<from>${re.date})\\s*and\\s*(?<to>${re.date})`;
        condition        = `(${condition1}|${condition2})`;
    }

    return `^${operator}\\(${condition}\\)$`;
}

module.exports = { logger, timerFormat, re, getPattern }