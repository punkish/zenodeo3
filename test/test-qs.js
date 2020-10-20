'use strict'

const config = require('config')
const Database = require('better-sqlite3')
const db = new Database(config.get('data.treatments'))
const ajvOpts = config.get('v3.ajv.options')
const querystring = require('qs')
const Ajv = require('ajv')
const ajv = new Ajv(ajvOpts)
const { getSchema } = require('./data-dictionary/dd-utils')

const re = {
    date: '[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}',
    year: '^[0-9]{4}$'
}

const testAjv = ({ resource, params }) => {

    const querystr = querystring.stringify(params, { encode: true  })
    const data = pre(querystr)

    console.log('orig qs')
    console.log('-'.repeat(50))
    console.log(querystr)

    console.log('='.repeat(50), '\n')
    
    console.log('orig qs to data')
    console.log('-'.repeat(50))
    console.log(data)
    
    console.log('='.repeat(50), '\n')
    
    let validate
    console.log('validating against object')
    console.log('-'.repeat(50))

    const schema = getSchema(resource)
    validate = ajv.compile(schema)
    console.log(`${validate(data)}`)
    // for (let p in data) {
    //     validate = ajv.compile(schema[p])
    //     console.log(`${p}: ${validate(data[p])}`)
    // }
}


const pre = (str) => {
    
    const data = querystring.parse(str, { decode: true })
    if (data.geolocation) {
        
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
        
    }

    return data
}

const query = {
    resource: 'materialsCitations',
    params: {
        materialsCitationId: '38C63CC3D74CDE17E88B8E25FCD2D91C',
        //$cols: 'foo'
    }
}

testAjv(query)