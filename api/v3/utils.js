'use strict'

const config = require('config')
const url = config.get('url')
const Database = require('better-sqlite3')
const db = new Database(config.get('data.treatments'))
const debug = config.get('debug')
const cacheDuration = config.get('v3.cache.duration')
const { resources, getResourceId } = require('../../data-dictionary/dd-utils')
const { zql } = require('../../lib/zql/')
const crypto = require('crypto')
const JSON5 = require('json5')

// *********** cache stuff ************************** //
// const ac = require('abstract-cache')
const acf = require('../../lib/abstract-cache-file')

const queryAndCacheData = async (request, resource, cache) => {

    // Query for new data
    const data = _get(request, resource)
                
    // Now we need to store this data in the cache
    // flag for mkdir success/failure
    const cacheKey = getCacheKey(request.url)
    cache.set(cacheKey, data, cacheDuration)
    
    return data
}

const handlerFactory = (resource) => {

    // The following handler function is returned to 
    // make the route to this resource
    return async function(request, reply) {
        
        const cache = acf({
            base: '',
            segment: resource,
            duration: cacheDuration
        })

        const cacheKey = getCacheKey(request.url)

        let data

        if (request.query.$refreshCache) {
            request.log.info('refreshing cache on request')
            data = await queryAndCacheData(request, resource, cache)
        }
        else {

            let cacheContent

            // check the cache for existing data
            try {
                cacheContent = await cache.get(cacheKey)
            }

            // there is no data in the cache so log the error
            // and continue on
            catch (error) {
                request.log.error(error.code === 'ENOENT' ? 'no data in cache' : error)
                request.log.info('querying the db for new data')
            }

            if (cacheContent) {
                request.log.info('found data in cache')
                data = JSON5.parse(cacheContent)
            }
            else {

                // if we reached here, that means no data was 
                // found in the cache. So we get new data
                //data = await foo(request, resource, folder, file)
                data = await queryAndCacheData(request, resource, cache)
            }
        }

        return data
    }
}

const getCacheKey = (url) => {
    return crypto.createHash('md5').update(url).digest('hex')
}

const packageResult = ({ resource, params, res }) => {
    
    // make a copy of the params
    const p = JSON5.parse(JSON5.stringify(params))

    // now, remove refreshCache, if present
    if ('$refreshCache' in p) {
        delete p.$refreshCache
    }

    if ('poly' in p) {
        delete p.poly
    }
    
    const data = {
        value: {
            'search-criteria': params,
            'num-of-records': res.d1[0].num_of_records,
            _links: {},
            prevpage: '',
            nextpage: '',
            records: halify(res.d2, resource, getResourceId(resource))
        }
    }

    // first, add link to self
    const thisq = JSON5.parse(JSON5.stringify(p))
    const thisqs = q2qs(thisq)
    data.value._links.self = { href: `${url}/${resource}?${thisqs}` }

    if (!(getResourceId(resource) in p)) {

        // update '$page'
        thisq.$page = p.$page
        const thisqs = q2qs(thisq)
        data.value._links.self = { href: `${url}/${resource}?${thisqs}` }

        // add links to prev and next, with appropriately
        // updated $page in each
        const prevq = JSON5.parse(JSON5.stringify(p))
        const nextq = JSON5.parse(JSON5.stringify(p))

        const prevpage = p.$page === 1 ? 1 : p.$page - 1
        prevq.$page = prevpage

        const nextpage = p.$page + 1
        nextq.$page = nextpage

        const prevqs = q2qs(prevq)
        const nextqs = q2qs(nextq)

        data.value._links.prev = { href: `${url}/${resource}?${prevqs}` }
        data.value._links.next = { href: `${url}/${resource}?${nextqs}` }
        data.value.prevpage = prevpage
        data.value.nextpage = nextpage
    }

    if (debug) {
        data.debug = {
            count: {
                sql: {
                    query: res.queries.count.debug.join(' '),
                    t: res.t1
                }
            },
            records: {
                sql: {
                    query: res.queries.records.debug.join(' '),
                    t: res.t2
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
        throw error
    }
}

// const send = (request, reply, data, code) => {
//     request.log.info('sending data')
//     if (!reply.sent) {
//         reply.headers({
//                 'Cache-Control': 'public, max-age=300',
//                 'Content-Type': 'application/json; charset=utf-8',
//                 'Content-Security-Policy': "default-src 'none'; img-src 'self';"
//             })
//             .code(code)
//             .send(data)
//     }
// }

const __get = (queries, runparams) => {
    const res = {}

    let sql = queries.count.binds.join(' ')
    const [ d1, t1 ] = sqlRunner(sql, runparams)
    res.d1 = d1
    res.t1 = t1

    if (d1[0].num_of_records) {
        sql = queries.records.binds.join(' ')
        const [ d2, t2 ] = sqlRunner(sql, runparams)
        res.d2 = d2
        res.t2 = t2
    }
    else {
        res.d2 = []
        res.t2 = null
    }

    res.queries = queries
    return res
}

const _get = (request, resource) => {

    // first, we query for the primary dataset and package it for delivery
    const { queries, runparams } = zql({resource: resource, params: request.query})
    const result = __get(queries, runparams)
    
    const data = packageResult({
        resource: resource, 
        params: request.query, 
        res: result
    })

    // then we check if related records are also needed,  
    // and query for them and package them, adding them 
    // to a key called 'related-records'
    const resourceId = getResourceId(resource)
    if (resourceId in request.query) {

        data['related-records'] = {}
        
        if (resource === 'treatments') {

            const resourceId = getResourceId(resource)
            const resourceIdValue = result.d2[0][resourceId]

            for (let i = 0, j = resources.length; i < j; i++) {
                
                const r = resources[i]
                const relatedResource = r.name

                if ((relatedResource !== 'root') && (relatedResource !== resource)) {

                    const q = { resource: r.name, params: {} }
                    q.params[resourceId] = resourceIdValue
                    
                    const { queries, runparams } = zql(q)
                    const res = __get(queries, runparams)

                    data['related-records'][relatedResource] = packageResult({
                        resource: relatedResource, 
                        params: q.params, 
                        res: res
                    })
                }
            }

        }
        else {
            const r = 'treatments'
            const q = { resource: r, params: {} }
            const relatedResourceId = getResourceId(r)
            q.params[relatedResourceId] = result.d2[0][relatedResourceId]
            
            const { queries, runparams } = zql(q)
            const res = __get(queries, runparams)

            data['related-records'][r] = packageResult({
                resource: r, 
                params: q.params, 
                res: res
            })
        }

    }

    return data
}

// const queryCacheAndSend = (request, reply, resource, cache, cacheKey, code) => {

//     // first, we retrieve the data from the database
//     const data = _get(request, resource)
//     const payload = {
//         item: data,
//         stored: Date.now(),
//         ttl: cacheDuration
//     }

//     // the retrieved data is cached and then sent to the client
//     cache.set(cacheKey, data, '')
//         .then(() => { send(requet, reply, payload, code) })
//         .catch((error) => { request.log.error(error) })
// }

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