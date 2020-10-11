'use strict'

const config = require('config')
const Database = require('better-sqlite3')
const db = new Database(config.get('data.treatments'))
const debug = config.get('debug')
const cacheDuration = config.get('v3.cache.duration')
const { resources, getResourceId, getQueryableParamsWithDefaults } = require('../../data-dictionary/dd-utils')
const { zql } = require('../../lib/zql/')
const crypto = require('crypto')
const JSON5 = require('json5')
const querystring = require('querystring')
const uriZenodeo = config.get('url.zenodeo')
const uriZenodo = config.get('url.zenodo')
const fetch = require('node-fetch')

const pino = require('pino')
const pinoOpts = JSON5.parse(JSON5.stringify(config.get('pino.opts')))
pinoOpts.name = 'API:V3:UTILS'
const log = pino(pinoOpts)

// *********** cache stuff ************************** //
// const ac = require('abstract-cache')
const acf = require('../../lib/abstract-cache-file')

const queryAndCacheData = async (request, resource, cache, origParams, cacheKey) => {

    const isZenodoResource = resource === 'images' || resource === 'publications'
    
    // Query for new data
    const data = isZenodoResource ? 
        await getRecords(request, resource, origParams) : 
        await _get(request, resource, origParams)
                
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
        const url = new URL(`http://server/${request.url}`)
        const origRoute = `${url.pathname}/${url.search}`
        const origParams = url.search

        log.info('query params:' + Object.entries(origParams).join('; '))

        // remove $refreshCache because this is the only submitted 
        // parameter that is not preserved in the query string
        if (Object.keys(origParams).length) {
            if ('$refreshCache' in origParams) {
                delete origParams.$refreshCache
            }
        }
        
        const cacheKey = getCacheKey(origRoute)
        
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

const packageResult = ({ resource, origParams, result, url }) => {
    log.info(`packaging ${resource} result for delivery`)
    
    let data
    // if (resource === 'images') {
    //     data = {
    //         value: {
    //             'search-criteria': origParams,
    //             'num-of-records': result.hits.total,
    //             _links: result.links,
    //             prevpage: '',
    //             nextpage: '',
    //             records: result.hits.hits
    //         }
    //     }
    // }
    // else {

    
        const resourceId = getResourceId(resource)
        data = {
            value: {
                'search-criteria': origParams,
                'num-of-records': result.d1[0].num_of_records || 0,
                _links: {},
                prevpage: '',
                nextpage: ''
            }
        }

        if (data.value['num-of-records']) {
            data.value.records = halify(result.d2, resource, resourceId.name, url)
        }
        else {
            data.value.records = []
        }
        
        const thisq = JSON5.parse(JSON5.stringify(origParams))

        if (Object.keys(origParams).length) {
            if (resourceId.name in origParams) {

                // add link to self
                data.value._links.self = { href: `${url}/${resource}?${q2qs(thisq)}` }
            }
            else {
    
                // add links to prev and next
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
        }
        else {

            // add link to self
            data.value._links.self = { href: `${url}/${resource}` }

            // add links to prev and next
            const prevq = {}
            const nextq = {}

            let prevpage = ''
            let nextpage = ''

            // update '$page'
            
            const queryableParamsWithDefaults = getQueryableParamsWithDefaults(resource)
            const $page = queryableParamsWithDefaults
                .filter(p => p.name === '$page')[0].schema.default
            

            prevpage = $page === 1 ? 1 : $page - 1
            prevq.$page = prevpage

            nextpage = $page + 1
            nextq.$page = nextpage

            
            data.value._links.prev = { href: `${url}/${resource}?${q2qs(prevq)}` }
            data.value._links.next = { href: `${url}/${resource}?${q2qs(nextq)}` }
            
            data.value.prevpage = prevpage
            data.value.nextpage = nextpage

        }
        
        if (debug) {
            data.debug = {
                count: {
                    sql: {
                        query: result.queries ? result.queries.count.debug.join(' ') : '',
                        t: result.t1
                    }
                },
                records: {
                    sql: {
                        query: result.queries ? result.queries.records.debug.join(' ') : '',
                        t: result.t2
                    }
                }
            }
        }
    //}

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
const halify = (data, resource, resourceId, url) => {
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
            res: res,
            url: uriZenodeo
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
        result: result,
        url: uriZenodeo
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
                    res: res,
                    url: uriZenodeo
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

const getRecords = async function(request, resource, origParams) {

    const resourceId = getResourceId(resource)

    let result

    // An id is present. The query is for a specific
    // record. All other query params are ignored
    if (resourceId.name in request.query) {
        result = getOneZenodoRecord(request, resource)
    }
    
    // More complicated queries with search parameters
    else {
        result = await getManyZenodoRecords(request, resource)
    }

    const data = packageResult({
        resource: resource, 
        origParams: origParams, 
        result: result,
        url: uriZenodo
    })

    return data
    
}

const getOneZenodoRecord = async function(request, resource) {

    const resourceId = getResourceId(resource)
    const resourceIdValue = request.query[resourceId.name]
    const uriRemote = url.zenodo + resourceIdValue

    request.log.info(`getting ${resource} from ${uriRemote}`)

    let response = await fetch(uriRemote)

    // if HTTP-status is 200-299
    if (response.ok) {

        request.log.info('waiting for response.text')

        // get the response body (the method explained below)
        const payload = await response.text()
        return JSON5.parse(payload)
    } 
    else {
        request.log.info("HTTP-Error: " + response.status)
        return []
    }
};

const getManyZenodoRecords = async function(request, resource) {

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

            const d1 = [{ num_of_records: result.hits.total }]
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
    // packageResult: packageResult,
    // sqlRunner: sqlRunner,
    // halify: halify,
    // getCacheKey: getCacheKey,
    // send: send,
    // queryCacheAndSend: queryCacheAndSend,
    // isFresh: isFresh,
    handlerFactory: handlerFactory
}