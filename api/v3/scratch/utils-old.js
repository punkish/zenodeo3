'use strict'

const config = require('config')
const Database = require('better-sqlite3')
const db = new Database(config.get('data.treatments'))

// https://github.com/JoshuaWise/better-sqlite3/issues/102#issuecomment-369468174
db.prepare(`ATTACH DATABASE '${config.get('data.collections')}' AS z3collections`).run()
db.prepare(`ATTACH DATABASE '${config.get('data.facets')}' AS z3facets`).run()

const debug = config.get('debug')
const cacheOn = config.get('cacheOn')
const cacheDuration = config.get('v3.cache.duration')
const { getResourceid, getQueryableParamsWithDefaults, getSourceOfResource, getResourcesFromSpecifiedSource } = require('../../data-dictionary/dd-utils')
const uriZenodo = config.get('url.zenodo')
const uriZenodeo = config.get('url.zenodeo')
const querystring = require('querystring')
const fetch = require('node-fetch')
const { zql } = require('../../lib/zql/')
const crypto = require('crypto')
const JSON5 = require('json5')

const { logger, timerFormat } = require('../../lib/utils')
const log = logger('API:V3:UTILS')

const acf = require('../../lib/abstract-cache-file')

const handlerFactory = (resource) => {

    // The following handler function is returned to 
    // make the route to this resource
    return async function(request, reply) {

        const validatedSearchParams = request.query
        console.log(validatedSearchParams)
 
        const p = request.context.config.url
        const u = request.url
        const originalSearchParams = new URLSearchParams(u.replace(`${p}?`, ''))
        if (originalSearchParams.has('$refreshCache')) {
            originalSearchParams.delete('$refreshCache')
        }

        const searchCriteria = {}
        originalSearchParams.forEach((value, name) => {
            searchCriteria[name] = value
        })

        // this will hold all the data to return

        const data = {
            result: {
                "search-criteria": searchCriteria,
                count
            },
            ttl,
            stored
        }

        if (cacheOn) {

            // get a referene to the cache
            const cache = acf({
                base: '',
                segment: resource,
                duration: cacheDuration
            })

            const cacheKey =  crypto
                .createHash('md5')
                .update(`${resource}/${originalSearchParams.sort()}`)
                .digest('hex')

            const query = {
                request, 
                resource, 
                cache, 
                cacheKey
            }

            if ('$refreshCache' in validatedSearchParams) {
                log.info('refreshing cache as requested')
                data.result = await queryAndCacheResults(query)
            }
            else {

                let cacheContent

                // check the cache for existing data
                try {
                    log.info(`72: checking cache under key: ${cacheKey}`)
                    cacheContent = await cache.get(cacheKey)
                }

                // there is no data in the cache so log the error
                // and continue on
                catch (error) {
                    log.info(`79: ${error.code === 'ENOENT' ? 'no data in cache' : error}`)
                    log.info('80: querying the db for new data')
                }

                if (cacheContent) {
                    log.info('84: found data in cache')
                    data.result = JSON5.parse(cacheContent)
                }
                else {

                    // if we reached here, that means no data was 
                    // found in the cache. So we get new data
                    data.result = await queryAndCacheData(query)
                }
            }
        }
        else {
            //const query = { request, resource }
            data.result = await queryData({ resource, params: validatedSearchParams })
        }

        log.info('105: sending back data, request complete')
        return data
    }
}

const queryAndCacheResults = async (o) => {
    const { request, resource, cache, cacheKey } = o
    //const { request, resource, cache, originalParams, cacheKey } = o
    
    // Query for new data
    const query = { request, resource }
    const sourceOfResource = getSourceOfResource(resource)
    
    let data

    // A resource on Zenodo is queried differntly (using `fetch`)
    // as opposed to a resource on Zenodeo (using `SQL`)
    if (sourceOfResource === 'zenodo') {
        data = await getDataFromZenodo(query)
    }
    else if (sourceOfResource === 'zenodeo') {
        data = await getDataFromZenodeo(query)
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
    log.info(`169: storing data in cache under key: ${cacheKey}`)
    cache.set(cacheKey, cacheEntry)
    
    return cacheEntry
}

const queryData = async (query) => {
    //const { request, resource, originalParam } = o

    // Query for new data
    //const qp = { request, resource, originalParams }
    const sourceOfResource = getSourceOfResource(query)
    let data

    // log.info(`183-184: query`)
    // log.info(query)

    // A resource on Zenodo is queried differntly (using `fetch`)
    // as opposed to a resource on Zenodeo (using `SQL`)
    if (sourceOfResource === 'zenodo') {
        data = await getDataFromZenodo(query)
    }
    else if (sourceOfResource === 'zenodeo') {
        data = await getDataFromZenodeo(query)
    }

    // we won't be storing data in the cache because 
    // cache is off, so we will fake a cache entry
    const cacheEntry = {
        item: data,
        stored: Date.now(),
        ttl: cacheDuration
    }

    return cacheEntry
}

// make HAL links for the record(s)
const halify = (data, resource, resourceId, url) => {
    log.info('217: halifying the records')

    for (let i = 0; i < data.length; i++) {
        const record = data[i]
        record._links = {
            self: { href: `${url}/${resource.toLowerCase()}?${resourceId}=${record[resourceId]}` }
        }
    }

    return data
}

const packageResult = ({ resource, params, result }) => {
    log.info(`230: packaging ${resource} result for delivery`)

    const uri = `${uriZenodeo}/${resource.toLowerCase()}`
    const sourceOfResource = getSourceOfResource(resource)

    const data = {
        'search-criteria': params,
        count: result.d1[0].count || 0,
        _links: {}
        // prevpage: '',
        // nextpage: ''
    }

    const resourceId = getResourceid(resource)

    if (sourceOfResource === 'zenodo') {
        data.records = data.count ? result.d2 : []
    }
    else if (sourceOfResource === 'zenodeo') {
        data.records = data.count ?
            halify(result.d2, resource, resourceId.name, url) :
            []
    }

    //_packageResult(params, resourceId, data, uri, uriRemote)
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
                query: result.queries ? result.queries.countSql : '',
                time: result.t1
            },
            records: {
                query: result.queries ? result.queries.fullSql : uriRemote,
                time: result.t2
            }
        }
    }

    return data
}

const getDataFromZenodeo = async ({ request, resource }) => {

    // First we get the requested resource
    //const requestedResource = getRequestedResourceFromZenodeo({ request, resource, originalParams })
    
    // first, we query for the primary dataset.
    // ZQL gives us the queries and the params to bind therein
    //log.info(request.query)
    const { queries, runparams } = zql({
        resource, 
        params: request.query
    })
    // log.info(queries)
    // log.info(runparams)

    const result = await runZenodeoQueries({ resource, queries, runparams })
    
    const data = packageResult({
        resource, 
        params: new URL(request.url, uriZenodeo).searchParams,
        //params: originalParams, 
        result
        //url: uriZenodeo
    })

    // then we check if related records are also needed,  
    // and query for and package them, adding them 
    // to a key called 'related-records'. Related records
    // are *only* required if there is a resourceId in the 
    // the query.
    data['related-records'] = {}
    const requestedResourceIdName = getResourceid(resource).name
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
                const relatedResourceId = getResourceid(relatedResource)

                relatedResourceId.value = requestedResourceResult[0][relatedResourceId.name]

                if (relatedResourceId.value) {
                    q.params[relatedResourceId.name] = relatedResourceId.value
                    
                    const { queries, runparams } = zql(q)
                    
                    const relatedResourceResult = await runZenodeoQueries({ resource: relatedResource, queries, runparams })
                    
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
    }
    
    // get facets
    data.facets = {}
    if (queries.facets) {
        for (let f in queries.facets) {
            log.info(`getting facet ${f}`)
            data.facets[f] = sqlRunner(queries.facets[f], runparams)
        }
    }

    return data
}

const sqlRunner = (sql, params) => {
    // console.log(sql, params)
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

// const foo = async function(record) {
//     const collectionCode = record.collectionCode
//     try {
//         let t = process.hrtime()

//         log.info('awaiting response from GRSciColl')
//         const response = await fetch(`https://api.gbif.org/v1/grscicoll/lookup?institutionCode=${collectionCode}`)

//         // if HTTP-status is 200-299
//         if (response.ok) {
    
//             //request.log.info('awaiting response.text')
//             const payload = await response.text()
//             const result = JSON5.parse(payload)

//             // {
//             //     "institutionMatch": {
//             //       "matchType": "FUZZY",
//             //       "status": "DOUBTFUL",
//             //       "reasons": [
//             //         "CODE_MATCH"
//             //       ],
//             //       "entityMatched": {
//             //         "key": "1a69e6fc-4a8d-44d5-90a6-a7dc7a1aa7c7",
//             //         "selfLink": "http://api.gbif.org/v1/grscicoll/institution/1a69e6fc-4a8d-44d5-90a6-a7dc7a1aa7c7",
//             //         "name": "University of Copenhagen",
//             //         "code": "C"
//             //       }
//             //     },
//             //     "collectionMatch": {
//             //       "matchType": "NONE"
//             //     }
//             //   }

//             t = process.hrtime(t)
//             record.collectionName = result.institutionMatch.entityMatched.name
//             console.log(`name: ${record.collectionName}`)
//         } 
//         else {
//             log.info("HTTP-Error: " + response.status)
//         }
//     }
//     catch (error) {
//         log.error(error)
//     }
// }

const runZenodeoQueries = async (o) => {
    const { resource, queries, runparams } = o

    // This is where we pack all the results
    const res = {}

    // First we find out the total number of records 
    // returned from the query
    //let sql = queries.count.binds.join(' ')
    const [ d1, t1 ] = sqlRunner(queries.countSql, runparams)
    res.d1 = d1
    res.t1 = t1

    // if the total number of records is more than 1,
    // we run the query for getting the actual records
    // but we use limit and offset to get only a small 
    // set of records so we an page through the result
    if (d1[0].count) {
        log.info(`502: ${resource} count is ${d1[0].count}, so getting actual records`)
        //sql = queries.records.binds.join(' ')
        
        const [ d2, t2 ] = sqlRunner(queries.fullSql, runparams)
        res.d2 = d2
        res.t2 = t2

        // console.log(`sql: ${queries.records.debug.join(' ')}`)

        // if (resource === 'materialsCitations') {
        //     const records = res.d2
        //     for (let i = 0, j = records.length; i < j; i++) {
        //         const record = records[i]
        //         await foo(record)
        //     }
        // }
    }
    else {
        log.info(`520: "${resource}" count is 0, so returning []`)
        res.d2 = []
        res.t2 = null
    }

    res.queries = queries
    log.info(res)
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
    request.log.info('559: getting data from zenodo')

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

    log.info(params)
    const qs = querystring.stringify(params)
    //const qs = JSON5.stringify(params)
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