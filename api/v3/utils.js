'use strict'

const config = require('config')
const Database = require('better-sqlite3')
const db = new Database(config.get('data.treatments'))
const debug = config.get('debug')
const cacheDuration = config.get('v3.cache.duration')
const { getResourceId, getQueryableParamsWithDefaults, getSourceOfResource, getResourcesFromSpecifiedSource } = require('../../data-dictionary/dd-utils')
const uriZenodo = config.get('url.zenodo')
const uriZenodeo = config.get('url.zenodeo')
const querystring = require('qs')
const fetch = require('node-fetch')
const { zql } = require('../../lib/zql/')
const crypto = require('crypto')
const JSON5 = require('json5')
const log = require('../../lib/utils')('API:V3:UTILS')
const acf = require('../../lib/abstract-cache-file')

const handlerFactory = (resource) => {

    // The following handler function is returned to 
    // make the route to this resource
    return async function(request, reply) {

        // get queryparams and querystring from the original URL
        const { op, qs } = getOriginalUrl(request)

        // get a referene to the cache
        const cache = acf({
            base: '',
            segment: resource,
            duration: cacheDuration
        })

        let data

        const cacheKey =  crypto
            .createHash('md5')
            .update(`${resource}/${qs}`)
            .digest('hex')

        const qp = {
            request: request, 
            resource: resource, 
            cache: cache, 
            originalParams: op, 
            cacheKey: cacheKey
        }

        if (request.query.$refreshCache) {
            log.info('refreshing cache as requested')
            data = await queryAndCacheData(qp)
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
                data = await queryAndCacheData(qp)
            }
        }

        log.info('sending back data, request complete')
        return data
    }
}

// The parameters submitted in request.query get validated
// and modified by the JSON schema validator. Default params,
// if not submitted by the user, get tacked on to the query.
// Wee need to preserve the orignal parameters by extracting
// them from request.url so we can  use them to make the 
// links and the 'search-params' in the reply
const getOriginalUrl = (request) => {

    const qs_orig = request.url.split('?')[1]
    const op = querystring.parse(qs_orig, { comma: true })

    if ('$refreshCache' in op) delete op.$refreshCache

    const qs = Object.keys(op)
        .sort()
        .map(k => {
            const el = op[k]

            return Array.isArray(el) ? 
                el.sort().map(e => `${k}=${e}`).join('&') : 
                `${k}=${el}`
        })
        .join('&')

    return { op, qs }
}

const queryAndCacheData = async (o) => {
    const { request, resource, cache, originalParams, cacheKey } = o

    // Query for new data
    const qp = { request, resource, originalParams }
    const sourceOfResource = getSourceOfResource(resource)
    let data

    // A resource on Zenodo is queried differntly (using `fetch`)
    // as opposed to a resource on Zenodeo (using `SQL`)
    if (sourceOfResource === 'zenodo') {
        data = await getDataFromZenodo(qp)
    }
    else if (sourceOfResource === 'zenodeo') {
        data = await getDataFromZenodeo(qp)
    }

    // since we are storing data in the cache for the first
    // time, let's fake a cache entry
    const cacheEntry = {
        item: data,
        stored: Date.now(),
        ttl: cacheDuration
    }

    // Now we need to store this data in the cache
    // flag for mkdir success/failure
    log.info(`storing data in cache under key: ${cacheKey}`)
    cache.set(cacheKey, cacheEntry)
    
    return cacheEntry
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

const packageResult = ({ resource, params, result, url, uriRemote }) => {
    log.info(`packaging ${resource} result for delivery`)

    const uri = `${url}/${resource.toLowerCase()}`
    
    const sourceOfResource = getSourceOfResource(resource)

    const data = {
        'search-criteria': params,
        count: result.d1[0].count || 0,
        _links: {}
        // prevpage: '',
        // nextpage: ''
    }

    const resourceId = getResourceId(resource)

    const foo = (params, resourceId, data, uri, uriRemote) => {
        const q = JSON5.stringify(params)
        const thisq = JSON5.parse(q)

        if (resourceId.name in params) {

            // add link to self and we are done
            data._links.self = { href: `${uri}?${querystring.stringify(thisq)}` }
        }
        else {
            let prevq
            let nextq
            let thispage

            if (Object.keys(params).length) {

                // add links to prev and next
                prevq = JSON5.parse(q)
                nextq = JSON5.parse(q)

                if ('$page' in params) {
                    data._links.self = { href: `${uri}?${querystring.stringify(thisq)}` }
                    thispage = params.$page
                }
                else {
                    data._links.self = { href: `${uri}` }
                    thispage = getQueryableParamsWithDefaults(resource)
                        .filter(p => p.name === '$page')[0].schema.default
                }
            }
            else {

                // add links to prev and next
                prevq = {}
                nextq = {}

                data._links.self = { href: `${uri}` }
                thispage = getQueryableParamsWithDefaults(resource)
                    .filter(p => p.name === '$page')[0].schema.default
            }

            prevq.$page = thispage === 1 ? 1 : thispage - 1
            nextq.$page = thispage + 1

            data._links.prev = { href: `${uri}?${querystring.stringify(prevq)}` }
            data._links.next = { href: `${uri}?${querystring.stringify(nextq)}` }
        }
        
        if (debug) {
            data.debug = {
                count: {
                    query: result.queries ? result.queries.count.debug.join(' ') : '',
                    time: result.t1
                },
                records: {
                    query: result.queries ? result.queries.records.debug.join(' ') : uriRemote,
                    time: result.t2
                }
            }
        }
    }

    if (sourceOfResource === 'zenodo') {
        data.records = data.count ? result.d2 : []
    }
    else if (sourceOfResource === 'zenodeo') {
        data.records = data.count ?
            halify(result.d2, resource, resourceId.name, url) :
            []
    }

    foo(params, resourceId, data, uri, uriRemote)

    return data
}

const getRequestedResourceFromZenodeo = ({ request, resource }) => {

    // first, we query for the primary dataset.
    // ZQL gives us the queries and the params to bind therein
    const { queries, runparams } = zql({
        resource: resource, 
        params: request.query
    })

    return runZenodeoQueries({ resource, queries, runparams })

    
}

const getRelatedResourcesFromZenodeo = async ({ request, resource, params }) => {

    const relatedResources = {}
            
    // if resource is 'treatments' then the related records 
    // are fetched from all other (zenodeo) resources
    if (resource === 'treatments') {

        const zenodeoResources = getResourcesFromSpecifiedSource('zenodeo')

        // Go through every resource…
        for (let i = 0, j = zenodeoResources.length; i < j; i++) {
            const r = zenodeoResources[i]
            const relatedResource = r.name

            log.info(`getting related "${relatedResource}" for this ${resource}`)
            relatedResources[relatedResource] = getRelatedRecords(primaryResourceIdName, primaryResourceIdValue, relatedResource)
        }
    }

    // if the (zenodeo) resource is any other than 'treatments'
    // then related record is only the parent treatment
    else {
        const relatedResource = 'treatments'
        const q = { resource: relatedResource, params: {} }
        const relatedResourceId = getResourceId(relatedResource)
        q.params[relatedResourceId.name] = result.d2[0][relatedResourceId.name]
        
        const { queries, runparams } = zql(q)

        relatedResources[relatedResource] = runZenodeoQueries({ relatedResource, queries, runparams })  
        // data = packageResult({
        //     resource: relatedResource, 
        //     params: q.params, 
        //     result: result,
        //     url: uriZenodeo
        // })
    }

    return relatedResources
}

const getDataFromZenodeo = async ({ request, resource, originalParams }) => {

    // First we get the requested resource
    const requestedResource = getRequestedResourceFromZenodeo({ request, resource, originalParams })
    
    
    const data = packageResult({
        resource: resource, 
        params: originalParams, 
        result: requestedResource,
        url: uriZenodeo
    })

    // then we check if related records are also needed,  
    // and query for and package them, adding them 
    // to a key called 'related-records'. Related records
    // are *only* required if there is a resourceId in the 
    // the query.
    data['related-records'] = {}
    const requestedResourceIdName = getResourceId(resource).name
    if (requestedResourceIdName in request.query) {
        const requestedResourceIdValue = request.query[requestedResourceIdName]

        // related records will exist only if  
        // anything was found in thefirst query
        const requestedResourceResult = requestedResource.d2
        if (requestedResourceResult.length) {
            
            if (resource === 'treatments') {

                const zenodeoResources = getResourcesFromSpecifiedSource('zenodeo')
        
                // Go through every resource…
                for (let i = 0, j = zenodeoResources.length; i < j; i++) {
                    const r = zenodeoResources[i]
                    const relatedResource = r.name

                    if (relatedResource !== 'treatments') {
        
                        log.info(`getting related "${relatedResource}" for this ${resource}`)
                        data['related-records'][relatedResource] = getRelatedRecords(requestedResourceIdName, requestedResourceIdValue, relatedResource)
                    }
                }
            }
        
            // if the (zenodeo) resource is any other than 'treatments'
            // then related record is only the parent treatment
            else {
                const relatedResource = 'treatments'
                const q = { resource: relatedResource, params: {} }
                const relatedResourceId = getResourceId(relatedResource)
                q.params[relatedResourceId.name] = requestedResourceResult[0][relatedResourceId.name]
                
                const { queries, runparams } = zql(q)
                const relatedResourceResult = runZenodeoQueries({ resource: relatedResource, queries, runparams })
                
                const packagedRelatedResource = packageResult({
                    resource: relatedResource, 
                    params: q.params, 
                    result: relatedResourceResult,
                    url: uriZenodeo
                })

                data['related-records'][relatedResource] = packagedRelatedResource
            }
        }
    }
    
    
    return data
}

const sqlRunner = (sql, params) => {
    
    try {
        let t = process.hrtime()
        console.log(sql)
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

const runZenodeoQueries = (o) => {
    const { resource, queries, runparams } = o

    // This is where we pack all the results
    const res = {}

    // First we find out the total number of records 
    // returned from the query
    let sql = queries.count.binds.join(' ')
    const [ d1, t1 ] = sqlRunner(sql, runparams)
    res.d1 = d1
    res.t1 = t1

    // if the total number of records is more than 1,
    // we run the query for getting the actual records
    // but we use limit and offset to get only a small 
    // set of records so we an page through the result
    if (d1[0].count) {
        log.info(`${resource} count is ${d1[0].count}, so getting actual records`)
        sql = queries.records.binds.join(' ')
        const [ d2, t2 ] = sqlRunner(sql, runparams)
        res.d2 = d2
        res.t2 = t2
    }
    else {
        log.info(`"${resource}" count is 0, so returning []`)
        res.d2 = []
        res.t2 = null
    }

    res.queries = queries
    return res
}

const getRelatedRecords = (primaryResourceIdName, primaryResourceIdValue, relatedResource) => {

    const params = {}
    params[primaryResourceIdName] = primaryResourceIdValue

    const queryableParamsWithDefaults = getQueryableParamsWithDefaults(relatedResource)
    queryableParamsWithDefaults.forEach(p => params[p.name] = p.schema.default)
    
    const { queries, runparams } = zql({ 
        resource: relatedResource, 
        params: params 
    })
    
    const result = runZenodeoQueries({ relatedResource, queries, runparams })

    if (result.d1[0].count) {
        return packageResult({
            resource: relatedResource, 
            params: params, 
            result: result,
            url: uriZenodeo
        })
    }
    else {
        return []
    }
}

const getDataFromZenodo = async ({ request, resource, originalParams }) => {
    request.log.info('getting data from zenodo')

    // clean up request.query
    const params = JSON5.parse(JSON5.stringify(request.query))

    // add type by removing the last 's' from resource name
    // images -> image
    // publications -> publication
    params.type = resource.slice(0, -1)
    
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
            const payload = await response.text()
            const result = JSON5.parse(payload)

            t = process.hrtime(t)

            const d1 = [{ count: result.hits.total }]
            res.d1 = d1
            res.t1 = null
            
            res.d2 = result.hits.hits
            res.t2 = Math.round((t[0] * 1000) + (t[1] / 1000000))

            return packageResult({
                resource: resource,
                params: originalParams,
                result: res,
                url: uriZenodeo,
                uriRemote: uriRemote
            })
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
    handlerFactory: handlerFactory,
}