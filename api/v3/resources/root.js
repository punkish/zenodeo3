'use strict'

const config = require('config')
const url = config.get('url')


const name = 'root'
const description = 'API root'
const cols = require('../../../data-dictionary/root')
const handler = async function(request, reply) {
    const records = []

    const resources = require('./index')
    resources.forEach(resource => {
        const urlpath = resource.name === 'root' ? '' : resource.name
        records.push({
            name: resource.name,
            url: `${url}/${urlpath}`,
            description: resource.description
        })
    })

    return {
        value: {
            'search-criteria': {},
            'num-of-records': records.length,
            _links: { self: { href: `${url}/` }},
            records: records
        }
    }
}

module.exports = { 
    name: name, 
    description: description, 
    cols: cols, 
    schema: {},
    handler: handler 
}