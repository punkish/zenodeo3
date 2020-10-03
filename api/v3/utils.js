'use strict'

const config = require('config')
const url = config.get('url')
const Database = require('better-sqlite3')
const db = new Database(config.get('data.treatments'))
const debug = config.get('debug')
const cacheDuration = config.get('v3.cache.duration')
const { resources, getResourceId, getQueryableParamsWithDefaults } = require('../../data-dictionary/dd-utils')
const { zql } = require('../../lib/zql/')
const crypto = require('crypto')
const JSON5 = require('json5')
const querystring = require('querystring')

const pino = require('pino')
const pinoOpts = JSON5.parse(JSON5.stringify(config.get('pino.opts')))
pinoOpts.name = 'API:V3:UTILS'
const log = pino(pinoOpts)

// *********** cache stuff ************************** //
// const ac = require('abstract-cache')
const acf = require('../../lib/abstract-cache-file')

const queryAndCacheData = async (request, resource, cache, origParams, cacheKey) => {

    // Query for new data
    const data = _get(request, resource, origParams)
                
    // Now we need to store this data in the cache
    // flag for mkdir success/failure
    log.info(`storing data in cache under key: ${cacheKey}`)
    cache.set(cacheKey, data, cacheDuration)
    
    return data
}

const handlerFactory = (resource) => {

    // The following handler function is returned to 
    // make the route to this resource
    return async function(request, reply) {

        log.info(`request received for ${resource}`)

        // The parameters submitted in request.query get validated
        // and modified by the JSON schema validator. So, we 
        // preserve the orignal submitted parameters by extracting
        // them from request.url and use them to make the links and 
        // the 'search-params' in the reply
        const origParams = querystring.parse(request.url.split('?').pop())
        log.info('query params:' + Object.entries(origParams).join('; '))

        // remove $refreshCache because this is the only submitted 
        // parameter that is not preserved in the query string
        if ('$refreshCache' in origParams) {
            delete origParams.$refreshCache
        }

        const cacheKey = getCacheKey(origParams)
        
        const cache = acf({
            base: '',
            segment: resource,
            duration: cacheDuration
        })

        let data

        if (request.query.$refreshCache) {
            log.info('refreshing cache as requested')
            data = await queryAndCacheData(request, resource, cache, origParams, cacheKey)
        }
        else {

            let cacheContent

            // check the cache for existing data
            try {
                log.info(`checking cache under key: ${cacheKey}`)
                cacheContent = await cache.get(cacheKey)
            }

            // there is no data in the cache so log the error
            // and continue on
            catch (error) {
                log.error(error.code === 'ENOENT' ? 'no data in cache' : error)
                log.info('querying the db for new data')
            }

            if (cacheContent) {
                log.info('found data in cache')
                data = JSON5.parse(cacheContent)
            }
            else {

                // if we reached here, that means no data was 
                // found in the cache. So we get new data
                //data = await foo(request, resource, folder, file)
                data = await queryAndCacheData(request, resource, cache, origParams, cacheKey)
            }
        }

        log.info('sending back data, request complete')
        return data
    }
}

const getCacheKey = (params) => {
    
    const qs = Object
        .keys(params)
        .sort()
        .map(k => { return `${k}=${params[k]}` })
        .join('&')

    return crypto
        .createHash('md5')
        .update(qs)
        .digest('hex')
}

const packageResult = ({ resource, origParams, result }) => {
    log.info(`packaging ${resource} result for delivery`)
    
    // make a copy of the params
    //const p = JSON5.parse(JSON5.stringify(origParams))

    // now, remove refreshCache, if present
    // if ('$refreshCache' in p) {
    //     delete p.$refreshCache
    // }

    // if ('poly' in p) {
    //     delete p.poly
    // }
    
    const resourceId = getResourceId(resource)
    const data = {
        value: {
            'search-criteria': origParams,
            'num-of-records': result.d1[0].num_of_records || 0,
            _links: {},
            prevpage: '',
            nextpage: ''
        }
    }

    if (data.value['num-of-records']) {
        data.value.records = halify(result.d2, resource, resourceId.name)
    }
    else {
        data.value.records = []
    }
    
    const thisq = JSON5.parse(JSON5.stringify(origParams))

    if (resourceId.name in origParams) {

        // add link to self
        data.value._links.self = { href: `${url}/${resource}?${q2qs(thisq)}` }
    }
    else {

        // add links to prev and next, with appropriately
        const prevq = JSON5.parse(JSON5.stringify(origParams))
        const nextq = JSON5.parse(JSON5.stringify(origParams))

        let prevpage = ''
        let nextpage = ''

        // update '$page'
        if ('$page' in origParams) {
            thisq.$page = origParams.$page
        }
        else {
            const queryableParamsWithDefaults = getQueryableParamsWithDefaults(resource)
            thisq.$page = queryableParamsWithDefaults
                .filter(p => p.name === '$page')[0].schema.default
        }

        prevpage = thisq.$page === 1 ? 1 : thisq.$page - 1
        prevq.$page = prevpage

        nextpage = thisq.$page + 1
        nextq.$page = nextpage

        data.value._links.self = { href: `${url}/${resource}?${q2qs(thisq)}` }
        data.value._links.prev = { href: `${url}/${resource}?${q2qs(prevq)}` }
        data.value._links.next = { href: `${url}/${resource}?${q2qs(nextq)}` }
        
        data.value.prevpage = prevpage
        data.value.nextpage = nextpage
    }

    if (debug) {
        data.debug = {
            count: {
                sql: {
                    query: result.queries.count.debug.join(' '),
                    t: result.t1
                }
            },
            records: {
                sql: {
                    query: result.queries.records.debug.join(' '),
                    t: result.t2
                }
            }
        }
    }

    return data
}

const q2qs = function(q) {
    let qs = []
    for (let k in q) {
        qs.push(`${k}=${q[k]}`)
    }

    return encodeURI(qs.join('&'))
}

// make HAL links for the record(s)
const halify = (data, resource, resourceId) => {
    log.info('halifying the records')

    for (let i = 0; i < data.length; i++) {
        const record = data[i]
        record._links = {
            self: { href: `${url}/${resource.toLowerCase()}?${resourceId}=${record[resourceId]}` }
        }
    }

    return data
}

const sqlRunner = (sql, params) => {
    
    try {
        let t = process.hrtime()
        const data = db.prepare(sql).all(params)
        t = process.hrtime(t)

        // 't' is an array of seconds and nanoseconds
        // convert 't' into ms 
        return [ data, Math.round((t[0] * 1000) + (t[1] / 1000000)) ]
    }
    catch(error) {
        log.error(sql)
        throw error
    }
}

const __get = (resource, queries, runparams) => {
    const res = {}

    let sql = queries.count.binds.join(' ')
    const [ d1, t1 ] = sqlRunner(sql, runparams)
    res.d1 = d1
    res.t1 = t1

    if (d1[0].num_of_records) {
        log.info(`${resource} num_of_records is ${d1[0].num_of_records}, so getting actual records`)
        sql = queries.records.binds.join(' ')
        const [ d2, t2 ] = sqlRunner(sql, runparams)
        res.d2 = d2
        res.t2 = t2
    }
    else {
        log.info(`"${resource}" num_of_records is 0, so returning []`)
        res.d2 = []
        res.t2 = null
    }

    res.queries = queries
    return res
}

const _getRelated = (primaryResourceIdName, primaryResourceIdValue, relatedResource, data) => {

    const params = {}
    params[primaryResourceIdName] = primaryResourceIdValue

    const queryableParamsWithDefaults = getQueryableParamsWithDefaults(relatedResource)
    queryableParamsWithDefaults.forEach(p => params[p.name] = p.schema.default)
    
    const { queries, runparams } = zql({ resource: relatedResource, params: params })
    const res = __get(relatedResource, queries, runparams)

    if (res.d1[0].num_of_records) {
        data['related-records'][relatedResource] = packageResult({
            resource: relatedResource, 
            params: params, 
            res: res
        })
    }
}

const _get = (request, resource, origParams) => {

    // first, we query for the primary dataset and package it for delivery
    const { queries, runparams } = zql({resource: resource, params: request.query})
    const result = __get(resource, queries, runparams)

    const data = packageResult({
        resource: resource, 
        origParams: origParams, 
        result: result
    })

    // then we check if related records are also needed,  
    // and query for and package them, adding them 
    // to a key called 'related-records'. Related records
    // are *only* required if there is a resourceId in the 
    // the query.

    // related records will exist only if anything was found in the 
    // first query
    if (result.d2.length) {

        const primaryResourceId = getResourceId(resource)
        const primaryResourceIdName = primaryResourceId.name
        const primaryResourceIdValue = result.d2[0][primaryResourceId.name]

        if (primaryResourceIdName in request.query) {

            data['related-records'] = {}
            
            if (resource === 'treatments') {

                // Go through every resource…
                for (let i = 0, j = resources.length; i < j; i++) {
                    
                    const r = resources[i]
                    const relatedResource = r.name

                    // except 'root' and 'treatments'
                    if ((relatedResource !== 'root') && (relatedResource !== resource)) {

                        log.info(`getting related "${relatedResource}" for this ${resource}`)
                        _getRelated(primaryResourceIdName, primaryResourceIdValue, relatedResource, data)
                        
                    }
                }

            }
            else {
                const r = 'treatments'
                const q = { resource: r, params: {} }
                const relatedResourceId = getResourceId(r)
                q.params[relatedResourceId.name] = result.d2[0][relatedResourceId.name]
                
                const { queries, runparams } = zql(q)
                const res = __get(queries, runparams)

                data['related-records'][r] = packageResult({
                    resource: r, 
                    params: q.params, 
                    res: res
                })
            }

        }
    }

    return data
}

const isFresh = (value) => {   
    if (typeof(value) === 'string') {
        value = JSON5.parse(value)
    }

    if (value.ttl === 'Infinity') {
        return true
    }
    else {
        return ((value.stored + value.ttl) > Date.now()) ? true : false
    }
}

module.exports = {
    // packageResult: packageResult,
    // sqlRunner: sqlRunner,
    // halify: halify,
    // getCacheKey: getCacheKey,
    // send: send,
    // queryCacheAndSend: queryCacheAndSend,
    // isFresh: isFresh,
    handlerFactory: handlerFactory
}