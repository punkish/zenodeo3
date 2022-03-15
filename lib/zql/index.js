'use strict'

const { logger } = require('../../lib/utils');
const log = logger('ZQL');
const ddUtils = require('../../data-dictionary/dd-utils');
const zUtils = require('./z-utils.js');
const querystring = require('querystring');
const sqlFormatter = require('sql-formatter-plus');

/**********************************************************
** 
** A SQL SELECT statement is made up of following clauses
** 
** SELECT   [<cols>]                       <- getColumns()
** FROM     [<table or tables with JOINs>] <- getTables()
** WHERE    [<constraints>]                <- getConstraints()
** ORDER BY [<col> <dir>, <col> <dir> …]   <- getSortOrder()
** LIMIT    <int> OFFSET <int>             <- getLimitAndOffset()
** 
** The first two clauses (SELECT and FROM) are mandatory.
** The remaining clauses are optional
************************************************************/
const getSql = ({ type, columns, tables, constraints, sortorder, limit, offset }) => {
    const parts = [
        type === 'count' ? 
            `SELECT Count(DISTINCT ${columns[0]}) AS num_of_records` : 
            `SELECT ${columns.join(', ')}`,
        
        `FROM ${tables.join(' ')}`
    ]

    if (constraints.length) parts.push(`WHERE ${constraints.join(' AND ')}`)
    if (type === 'full') {
        if (sortorder && sortorder.length) parts.push(`ORDER BY ${sortorder.join(', ')}`)
        if (limit) parts.push(`LIMIT ${limit}`)
        if (offset !== undefined) parts.push(`OFFSET ${offset}`)
    }

    return parts.join(' ')
}

const queries = ({resource, params}) => {

    // remove any empty columns
    params.cols = params.cols.filter(c => c != '');

    const columns = zUtils.getSelect(resource, params);
    const tables = zUtils.getFrom(resource, params);
    const {constraints, runparams} = zUtils.getWhere({resource, params});
    
    
    // count sql is always created, and we don't need sortorder and limit for it
    const count = getSql({type: 'count', columns, tables, constraints});
    
    /*
    * 'cols' can be specified explicitly with an empty value
    * to force only a count SQL. So we check 'cols' and 
    * return fullSql **only** if 'cols' is not empty
    */
    let full = '';

    const resourceId = ddUtils.getResourceid(resource);
    if (params.cols.length) {

        /*
         * if resourceId exists in params, we don't need 
         * sortorder, limit and offset because they make no sense
         */
        if (resourceId.name in params) {
            full = getSql({type: 'full', columns, tables, constraints});
        }

        /*
         * resourceId is not in the params, so we need sortorder, limit and offset
         */
        // else if (params.cols.length === 1) {
        //     const {limit, offset} = zUtils.getLimitAndOffset(params);
        //     full = getSql({type: 'full', columns, tables, constraints, limit, offset});
        // }
        else {
            const sortorder = zUtils.getOrderBy(params);
            const {limit, offset} = zUtils.getLimitAndOffset(params);
            
            full = getSql({type: 'full', columns, tables, constraints, sortorder, limit, offset});
        }
    }

    return { 
        sql: {count, full}, 
        runparams 
    }
}

const mainQueries = ({resource, params}) => {
    
    // validated params are different from the params submitted to validate()
    params = zUtils.validate({resource, params});
    
    // if validation failed, no params are returned, so return false
    if (!params) return false;
    return queries({resource, params});
}

const facetQueries = (resource) => {
    log.info(`facetQueries() -> ${resource}`)

    const facets = {}
    const columns = ddUtils.getFacetCols(resource);
    
    columns.forEach(c => {
        const tables = [ resource ]
        if (c.tables) {
            tables.push(c.tables);
        }

        facets[c.name] = `SELECT ${c.name}, count FROM (SELECT ${c.name}, Count(${c.name}) AS count FROM ${tables.join(' JOIN ')} WHERE ${c.name} != '' GROUP BY ${c.name} HAVING ${c.facet} ORDER BY count DESC LIMIT 50) AS t ORDER BY ${c.name} ASC`;
    })

    return facets;
}

const relatedQueries = ({resource, params}) => {

    // validated params are different from the params submitted to validate()
    params = zUtils.validate({resource, params});

    // if validation failed, no params are returned, so return false
    if (!params) {
        return false;
    }

    const treatmentId = params.treatmentId;
    log.info(`relatedQueries() -> resource: ${resource}, treatmentId: ${treatmentId}`);
    return queries({resource, params});
}

const zql = ({resource, params}) => {
    const {sql, runparams} = mainQueries({resource, params});

    const result = {
        queries: {
            main: sql,
            related: {},
            facets: {},
        },
        runparams,
    }
    
    if (resource === 'treatments' && 'treatmentId' in params) {
        if (params.relatedRecords) {
            const treatmentId = params.treatmentId;
            const relatedResources = [
                'bibRefCitations',
                'figureCitations',
                'materialsCitations',
                'treatmentCitations',
                //'treatmentAuthors'
            ]
        
            relatedResources.forEach(resource => {
                const {sql, runparams} = relatedQueries({resource, params: { treatmentId }});
                result.queries.related[resource] = sql;
            })
        }
    }

    if (params.facets) {
        result.queries.facets = facetQueries(resource)
    }

    return result;
}

const preZql = ({ resource, searchparams }) => {

    //const params = querystring.parse(searchparams);
    const params = {};
    const sp = new URLSearchParams(searchparams);

    // https://stackoverflow.com/a/67111094/183692
    // Set will return only unique keys()
    new Set([...sp.keys()])
        .forEach(key => {
            params[key] = sp.getAll(key).length > 1 ?  
            sp.getAll(key) : // get multiple values
            sp.get(key); // get single value
        });

    return zql({ resource, params });
}

const test = ({ resource, searchparams }) => {
    const res = preZql({ resource, searchparams });

    console.log('count query');
    console.log('-'.repeat(50));
    console.log(sqlFormatter.format(res.queries.main.count, { params: res.runparams }));
    console.log('\n');

    console.log('full query');
    console.log('-'.repeat(50));
    console.log(sqlFormatter.format(res.queries.main.full, { params: res.runparams }));
    console.log('\n');
}

let input = {
    "resource": "figureCitations",
    "searchparams": "treatmentId=000040332F2853C295734E7BD4190F05&cols=httpUri&cols=captionText"
};

input = {
    "resource": "treatments",
    "searchparams": "q=phylogeny&page=1&size=30&httpUri=ne()&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=captionText"
}

input = {
    "resource": "treatments",
    "searchparams": "checkinTime=since(yesterday)"
}

//test(input);

module.exports = { zql, preZql };