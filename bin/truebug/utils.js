'use strict'

const fs = require('fs')
const moment = require('moment')
const dateFormat = 'YYYY-MM-DD'
const timestampFormat = `${dateFormat} HH:mm:ss`

class Logger {
    constructor({level, transports, logdir}) {
        this.level = level || 'info'
        this.transports = transports
        this.logdir = logdir
        const day = moment().format(dateFormat)

        const dir = `${this.logdir}/${day}`
        if (!fs.existsSync(dir)) fs.mkdirSync(dir)

        this.file = `${dir}/${day}-${this.level}.log`

        // https://stackoverflow.com/questions/3459476/how-to-append-to-a-file-in-node/43370201#43370201
        this.stream = fs.createWriteStream(this.file, {flags:'a'})
    }

    convert(input) {
        const levels = {debug: 10, info: 20, warn: 30, error: 40, fatal: 50};
        const level = Object.keys(levels)[Object.values(levels).indexOf(input)];
        const number = levels[input];
        return typeof(input) === 'number' ? level : number;
    }

    loglevel = () => console.log(`this logger's level is ${this.level.toUpperCase()}`)

    write = (level, str, position) => {
        const ts = moment().format(timestampFormat)
        
        if (position) {
            if (position === 'start') str = `${ts} ${level.toUpperCase()} ${str}`
            if (this.transports.includes('console')) process.stdout.write(str)
            if (this.transports.includes('file'))    this.stream.write(str)
        }
        else {
            const msg = `${ts} ${level.toUpperCase()} ${str}`
            if (this.transports.includes('console')) console.log(msg)
            if (this.transports.includes('file'))    this.stream.write(msg + '\n')
        }
    }

    debug = (str, position) => { if (this.convert(this.level) <= 10) this.write(this.convert(10), str, position) }
    info  = (str, position) => { if (this.convert(this.level) <= 20) this.write(this.convert(20), str, position) }
    warn  = (str, position) => { if (this.convert(this.level) <= 30) this.write(this.convert(30), str, position) }
    error = (str, position) => { if (this.convert(this.level) <= 40) this.write(this.convert(40), str, position) }
    fatal = (str, position) => { if (this.convert(this.level) <= 50) this.write(this.convert(50), str, position) }
}

module.exports = Logger