'use strict'

const querystring = require('qs')
const Ajv = require('ajv')
const ajv = new Ajv({ coerceTypes: true })

const obj1 = {
    geolocation : { 
        radius: 50, 
        units: 'kilometers',
        lat: 83, 
        lng: -121 
    },
    authorityName: 'starts_with(Miller)'
}

const str = querystring.stringify(obj1, { encode: false })
//const obj2 = 'geolocation[radius]=50&geolocation[units]=kilometers&geolocation[lat]=83&geolocation[lng]=-121&authorityName=starts_with(Miller)'

//console.log()

//const q = `geolocation=(${obj2})&authorityName=starts_with(Miller)`
const data = querystring.parse(str)

const schema1 = {
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
    authorityName: { type: 'string' }
}

const schema2 = { 
    geolocation: { type: 'string' },
    authorityName: { type: 'string' }
 }

const testAjv = () => {
    console.log('data')
    console.log('-'.repeat(50))
    console.log(data)
    
    console.log('='.repeat(50), '\n')
    
    let validate
    console.log('validating against object')
    console.log('-'.repeat(50))
    for (let p in data) {
        validate = ajv.compile(schema1[p])
        console.log(`${p}: ${validate(data[p])}`)
    }
    
    console.log('='.repeat(50), '\n')
    
    console.log('validating against string')
    console.log('-'.repeat(50))
    for (let p in data) {
        validate = ajv.compile(schema2[p])
        console.log(`${p}: ${validate(data[p])}`)
    }
}


const pre = () => {
    const g = [ 'within(radius:10', " units:'kilometers'", ' lat:40', ' lng:-120)' ]
    const clean_g = g.map(e => {
        return e.trim().replace(')', '').replace("'", '').split('(')
    })

    const clean_g_flat = clean_g.flat()
    const geoloc_operator = clean_g_flat[0]
    const geolocation = {}
    clean_g_flat.forEach(e => {
        if (e.indexOf(':') > -1) {
            const [ key, value ] = e.split(':')
            const n = Number(value)
            geolocation[key] = isNaN(n) ? value : n
        }
    })

    console.log(geoloc_operator)
    console.log(geolocation)
}

pre()