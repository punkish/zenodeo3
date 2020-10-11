'use strict'

const config = require('config')
const Database = require('better-sqlite3')
const db = new Database(config.get('data.treatments'))

const { zql } = require('../../lib/zql/')
const { getResourceId, getQueryableParamsWithDefaults, getResourcesFromSpecifiedSource } = require('../../data-dictionary/dd-utils')
const uriZenodeo = config.get('url.zenodeo')

const log = require('../../utils')('API:V3:UTILS-ZENODEO')

const getPrimaryResourceFromZenodeo = async ({ request, resource, originalParams }) => {

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

    const primaryResource = getPrimaryResourceFromZenodeo({ request, resource, originalParams })
    // const data = packageResult({
    //     resource: resource, 
    //     params: originalParams, 
    //     result: result,
    //     url: uriZenodeo
    // })

    // then we check if related records are also needed,  
    // and query for and package them, adding them 
    // to a key called 'related-records'. Related records
    // are *only* required if there is a resourceId in the 
    // the query.
    let relatedResources
    const primaryResourceIdName = getResourceId(resource).name
    if (primaryResourceIdName in request.query) {

        // related records will exist only if anything was found in the 
        // first query
        if (primaryResource.d2.length) {
            const primaryResourceIdValue = primaryResource.d2[0][primaryResourceIdName]
            const params = {}
            params[primaryResourceIdName] = primaryResourceIdValue
            relatedResources = getRelatedResourcesFromZenodeo({ request, resource, params})
        }
    }
    
    
    return { primaryResource, relatedResources }
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
        []
    }
}

module.exports = {
    getDataFromZenodeo: getDataFromZenodeo,
    //getPrimaryResourceFromZenodeo: getPrimaryResourceFromZenodeo
}