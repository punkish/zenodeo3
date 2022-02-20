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
});

describe('getPattern: return regexps based on zqltype', () => {
    const tests = [
        {
            input: {
                zqltype: 'geolocation',
                query: "within({radius:10, units: 'kilometers', lat:40.00, lng: -120})"
            },
            output: {
                operator: 'within',
                radius: '10',
                units: 'kilometers',
                lat: '40.00',
                lng: '-120',
                min_lat: undefined,
                min_lng: undefined,
                max_lat: undefined,
                max_lng: undefined
            }
        },
        {
            input: {
                zqltype: 'geolocation',
                query: "contained_in({lower_left:{lat: -40.00, lng: -120},upper_right: {lat:23,lng:6.564}})"
            },
            output: {
                operator: 'contained_in',
                radius: undefined,
                units: undefined,
                lat: undefined,
                lng: undefined,
                min_lat: '-40.00',
                min_lng: '-120',
                max_lat: '23',
                max_lng: '6.564'
            }
        },
        {
            input: {
                zqltype: 'date',
                query: "since(2018-12-03)"
            },
            output: {
                operator: 'since',
                date: '2018-12-03',
                from: undefined,
                to: undefined
            }
        },
        {
            input: {
                zqltype: 'date',
                query: "until(2018-03-22)"
            },
            output: {
                operator: 'until',
                date: '2018-03-22',
                from: undefined,
                to: undefined
            }
        },
        {
            input: {
                zqltype: 'date',
                query: "between(2018-03-22 and 2019-12-03)"
            },
            output: {
                operator: 'between',
                date: undefined,
                from: '2018-03-22',
                to: '2019-12-03'
            }
        },
        {
            input: {
                zqltype: 'date',
                query: "eq(2018-03-22)"
            },
            output: {
                operator: 'eq',
                date: '2018-03-22',
                from: undefined,
                to: undefined
            }
        }
    ]

    tests.forEach(t => {
        test(`${i(t.input)} converted to ${o(JSON.stringify(t.output))}`, () => {
            const regexp = utils.getPattern(t.input.zqltype);
            const res = t.input.query.match(regexp);
            expect(res.groups).toEqual(t.output)
        })
    })
})