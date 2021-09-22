'use strict'

const chalk = require('chalk')
const i = (i) => chalk.bold.blue(i)
const o = (o) => chalk.bold.green(o)

const utils = require('./utils.js')

describe('timerFormat: formats ms time to ms and s', () => {
    const tests = [
        {
            input: 58,
            output: '58ms'
        },
        {
            input: 1050,
            output: '1s 50ms'
        }
    ]

    tests.forEach(t => {
        test(`${i(t.input)} converted to ${o(JSON.stringify(t.output))}`, () => {
            expect(utils.timerFormat(t.input)).toEqual(t.output)
        })
    })
})