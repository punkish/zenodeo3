'use strict'

const { logger } = require('../../lib/utils')
const log = logger('ZQL')
const ddUtils = require('../../data-dictionary/dd-utils')
const zUtils = require('./z-utils.js')

const regularQueries = (resource, params) => {
    //log.info(`regularQueries() -> ${resource}, ${JSON.stringify(params)}`)

    let fullSql = ''
    const resourceId = ddUtils.getResourceid(resource)

    /*
     * SELECT collumns will always include the resourceId
     * and all other columns specified in $cols
     */
    const columns = [ 
        resourceId.selname, 
        ...params.cols.filter(col => col !== resourceId.name)
            .map(col => ddUtils.getSelname(resource, col)) 
    ]

    // FROM tables will always include the main resource table
    const tables_tmp = [ resource ];

    // FROM tables may also include tables in JOIN clause for certain columns
    params.cols.forEach(c => {
        const t = ddUtils.getJoin(resource, c, 'select');
        if (t) tables_tmp.push(...t);
    });

    const constraints = []
    const runparams = {}
    
    // params that are not columns
    const notCols = [
        'refreshCache',
        'facets',
        'page',
        'size',
        'sortby',
        'cols'
    ];

    Object.keys(params)
        //.filter(p => p.substring(0, 1) !== '$')
        .filter(p => !notCols.includes(p))
        .forEach(p => {

            /*
             * Get any tables that may need to be in the FROM … JOIN clause
             * for every parameter
             */
            const t = ddUtils.getJoin(resource, p, 'query');
            if (t) tables_tmp.push(...t)

            const {constraint, runparam} = zUtils.getConstraint(resource, p, params[p])
            
            /*
             * for every k,v pair, an array of constraints is returned.
             * most of the times this array contains only one constraint
             * (hence singular) but sometimes it can contain more than 
             * one constraint for one k,v pair. We flatten the array and 
             * push it in the main constraints array
             */
            constraints.push(...constraint)

            /*
             * we do the same for the runparam for each k,v pair
             * adding it to the main runparams object
             */
            for (let [key, val] of Object.entries(runparam)) {
                runparams[key] = val
            }
        })

    // remove duplicates from tables
    // https://stackoverflow.com/a/15868720
    const tables = [ ...new Set(tables_tmp) ];

    const countSql = zUtils.getSql({type: 'count', columns, tables, constraints})
    if (resourceId.name in params) {
        fullSql = zUtils.getSql({type: 'full', columns, tables, constraints})
    }
    else {

        /*
         * 'cols' can be specified explicitly with an empty value
         * to force only a count SQL. So we check 'cols' and 
         * return fullSql **only** if 'cols' is not empty
         */
        if (params.cols.length) {
            const sortorder = ((params) => {
                if ('sortby' in params) {
                    return params.sortby.split(',').map(o => {
                        o = o.trim()
                        const arr = o.split(/:/)
                        if (arr) return [ `${arr[0]} ${arr[1].toUpperCase()}` ]
                    })
                }
            })(params)

            const limit = params.size
            const offset = params.page - 1

            fullSql = zUtils.getSql({type: 'full', columns, tables, constraints, sortorder, limit, offset})
        }
    }

    return { 
        queries: {countSql, fullSql}, 
        runparams 
    }
}

const facetQueries = (resource) => {
    log.info(`facetQueries() -> ${resource}`)

    const facetsSql = {}
    const columns = ddUtils.getFacetCols(resource)
    
    columns.forEach(c => {
        const tables = [ resource ]
        if (c.tables) {
            tables.push(c.tables)
        }

        facetsSql[c.name] = `SELECT ${c.name}, count FROM (SELECT ${c.name}, Count(${c.name}) AS count FROM ${tables.join(' JOIN ')} WHERE ${c.name} != '' GROUP BY ${c.name} HAVING ${c.facet} ORDER BY count DESC LIMIT 50) AS t ORDER BY ${c.name} ASC`
    })

    return facetsSql
}

const relatedQueries = (treatmentId) => {
    log.info(`relatedQueries() -> treatmentId: ${treatmentId}`);
    const queries = {}
    const relatedRecords = [
        'bibRefCitations',
        'figureCitations',
        'materialsCitations',
        'treatmentCitations',
        //'treatmentAuthors'
    ]

    relatedRecords.forEach(r => {
        const sql = zql({
            resource: r,
            params: { treatmentId }
        });
        queries[r] = sql;
    })

    return queries;
}

const zql = ({resource, params}) => {

    // validated params are different from the params submitted to validate()
    params = zUtils.validate({resource, params})

    if (params) {
        const { queries, runparams } = regularQueries(resource, params);

        if (resource === 'treatments' && 'treatmentId' in params) {
            queries.relatedSql = relatedQueries(params.treatmentId);
        }

        if (params.facets) {
            queries.facetsSql = facetQueries(resource)
        }

        return { queries, runparams }
    }

    // if validation failed, no params are returned, so return false
    else {
        return false
    }
}

// const res = zql({
//     resource: 'treatments',
//     params: { 
//         //treatmentTitle: 'starts_with(Ichneumonidae)',
//         treatmentId: 'BF8A576EC3F6661E96B5590C108213BA',
//         facets: true
//     }
// })

// // const res = zql({
// //     resource: 'materialsCitations',
// //     params: { 
// //         //treatmentTitle: 'starts_with(Ichneumonidae)',
// //         treatmentId: 'BF8A576EC3F6661E96B5590C108213BA',
// //         //facets: true
// //     }
// // })

// if (res) {
//     console.log(JSON.stringify(res, null, 4))
// }

module.exports = zql