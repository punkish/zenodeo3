'use strict'

const config = require('config')
const querystring = require('querystring')
const uriZenodo = config.get('url.zenodo')
const fetch = require('node-fetch')
const JSON5 = require('json5')
const { packageResult } = require('./utils')

const getDataFromZenodo = async ({ request, resource, originalParams }) => {

    request.log.info('getting data from zenodo')

    const result = await runZenodoQueries({ request, resource })
    
    const data = packageResult({
        resource: resource, 
        params: originalParams, 
        result: result,
        url: uriZenodo
    })

    return data
}

const runZenodoQueries = async function({ request, resource }) {

    /// data will hold all the query results to be sent back
    // clean up request.query
    const params = JSON5.parse(JSON5.stringify(request.query))

    // add type
    if (resource === 'images') {
        params.type = 'image'
    }
    else if (resource === 'publications') {
        params.type = 'publication'
    }
    
    // remove the following params
    const remove = [ '$refreshCache', '$facets', '$stats', '$sortby' ]
    remove.forEach(p => {
        if (p in params) {
            delete params[p]
        }
    })

    // remove '$' from the following params
    const remove$ = [ '$page', '$size' ]
    remove$.forEach(p => {
        if (p in params) {
            params[ p.substr(1) ] = params[p]
            delete params[p]
        }
    })

    const qs = querystring.stringify(params)
    const uriRemote = qs ? `${uriZenodo}?${qs}` : uriZenodo

    // uriRemote should be
    // https://zenodo.org/api/records/?communities=biosyslit&page=1&size=30&type=image&communities=belgiumherbarium

    // https://zenodo.org/api/records/?sort=mostrecent&subtype=figure&subtype=photo&subtype=drawing&subtype=diagram&subtype=plot&subtype=other&communities=biosyslit&communities=belgiumherbarium&type=image&page=1&size=30

    request.log.info(`getting ${resource} from ${uriRemote}`)

    let res = {}

    try {
        let t = process.hrtime()

        request.log.info('awaiting response')
        let response = await fetch(uriRemote)

        // if HTTP-status is 200-299
        if (response.ok) {
    
            request.log.info('awaiting response.text')
            // get the response body (the method explained below)
            const payload = await response.text()
            const result = JSON5.parse(payload)

            t = process.hrtime(t)

            const d1 = [{ count: result.hits.total }]
            res.d1 = d1
            res.t1 = null
            
            res.d2 = result.hits.hits
            res.t2 = t

            return res
        } 
        else {
            request.log.info("HTTP-Error: " + response.status)
            return {}
        }
    }
    catch (error) {
        request.log.error(error)
        return {}
    }
}

module.exports = {
    getDataFromZenodo: getDataFromZenodo
}