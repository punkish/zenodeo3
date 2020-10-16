'use strict'

const querystring = require('qs')
const Ajv = require('ajv')
const ajv = new Ajv({ coerceTypes: true })

const re = {
    date: '[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}',
    year: '^[0-9]{4}$'
}

const schema = {
    publicationDate: {
        type: 'string',
        pattern: `^((since|until)\\(${re.date}\\))|(${re.date})|(between\\(${re.date} and ${re.date}\\))$`
    },
    geolocation: {
        type: 'object',
        properties: {
            radius: { type: 'integer' },
            units: {
                type: 'string',
                enum: [ 'kilometers', 'miles' ],
                default: 'kilometers'
            },
            lat: {
                type: 'number',
                minimum: -90,
                maximum: 90
            },
            lng: {
                type: 'number',
                minimum: -180,
                maximum: 180
            }
        }
    },
    geoloc_operator: { 
        type: 'string',
        enum: [ 'within', 'near' ]
    },
    authorityName: { type: 'string' },
    '$cols': {
        type: 'array', 
        items: { type: 'string' },
        emum: [ 'publication', 'geolocation', 'authorityName' ]
    }
}

const testAjv = (str) => {

    const data = pre(str)

    console.log('orig qs')
    console.log('-'.repeat(50))
    console.log(str)

    console.log('='.repeat(50), '\n')
    
    console.log('orig qs to data')
    console.log('-'.repeat(50))
    console.log(data)
    
    console.log('='.repeat(50), '\n')
    
    let validate
    console.log('validating against object')
    console.log('-'.repeat(50))
    for (let p in data) {
        validate = ajv.compile(schema[p])
        console.log(`${p}: ${validate(data[p])}`)
    }
}


const pre = (str) => {
    const data = querystring.parse(str, { decode: true })

    let g = data.geolocation
    if (typeof(g) === 'string') {
        g = querystring.parse({ geolocation: g }, { comma: true }).geolocation
    }

    const clean_g = g.map(e => {
        return e.trim().replace(')', '').replace("'", '').split('(')
    }).flat()
    
    data.geoloc_operator = clean_g[0]
    data.geolocation = {}
    clean_g.forEach(e => {
        if (e.indexOf(':') > -1) {
            const [ key, value ] = e.split(':').map(e => e.trim().replace(/"/g, '').replace(/'/g, ''))
            const n = Number(value)
            data.geolocation[key] = isNaN(n) ? value : n
        }
    })

    return data
}

const obj = {
    publicationDate: 'since(2018-10-12)',
    geolocation : "within(radius: 50, units: 'kilometers', lat: 83, lng: -121)",
    authorityName: 'starts_with(Miller)',
    '$cols': [ 'geolocation', 'publicationDate' ]
}

const str = querystring.stringify(obj, { encode: true  })
testAjv(str)