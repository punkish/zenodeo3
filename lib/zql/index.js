'use strict';

const { logger } = require('../../lib/utils');
const log = logger('ZQL');
const ddUtils = require('../../data-dictionary/dd-utils');
const zUtils = require('./z-utils.js');
const sqlFormatter = require('sql-formatter-plus');

/*
    A SQL SELECT statement is made up of following clauses

    SELECT   [<columns>]                    <- getColumns()
    FROM     [<tables>]                     <- getTables()
    WHERE    [<constraints>]                <- getConstraints()
    ORDER BY [<col> <dir>, <col> <dir> …]   <- getSortOrder()
    LIMIT    <int: limit>                   <- getLimitAndOffset()
    OFFSET   <int: offset>                  <- getLimitAndOffset()

    The first two clauses (SELECT and FROM) are mandatory.
    The remaining clauses are optional
*/
const getSql = (o) => {
    const { type, columns, tables, constraints, sortorder, limit, offset } = o;

    const parts = [
        type === 'count' ? 
            `SELECT Count(DISTINCT ${columns[0]}) AS num_of_records` : 
            `SELECT ${columns.join(', ')}`,
        
        `FROM ${tables.join(' ')}`
    ]

    if (constraints.length) {
        parts.push(`WHERE ${constraints.join(' AND ')}`);
    }

    if (type === 'full') {
        if (sortorder && sortorder.length) {
            parts.push(`ORDER BY ${sortorder.join(', ')}`);
        }

        if (limit) {
            parts.push(`LIMIT ${limit}`);
        }

        if (offset !== undefined) {
            parts.push(`OFFSET ${offset}`);
        }
    }

    return parts.join(' ')
}

const queries = (o) => {
    const { resource, params } = o;

    /*
        if the user sent any empty 'cols' keys –
        for example, in `cols=&col=foo` the first 
        'cols' is empty – remove such empty cols
    */
    params.cols = params.cols.filter(c => c != '');

    const columns = zUtils.getSelect(o);
    const tables = zUtils.getFrom(o);
    const { constraints, runparams } = zUtils.getWhere(o);
    
    /*
        count sql is always created, and we don't 
        need sortorder and limit for it
    */
    const inputs = { 
        type: 'count', 
        columns, 
        tables, 
        constraints 
    };

    const count = getSql(inputs);
    
    /*
        'cols' can be specified explicitly with an empty value
        to force only a count SQL. So we check 'cols' and 
        return fullSql **only** if 'cols' is not empty
    */
    let full = '';

    const resourceId = ddUtils.getResourceid(resource);
    if (params.cols.length) {

        /*
            if resourceId exists in params – for example,
            `treatmentId=000040332F2853C295734E7BD4190F05` – 
            only one record is going to be returned from the 
            query, so we don't need sortorder, limit and offset 
            because they make no sense
        */
        inputs.type = 'full';
        if (resourceId in params) {
            full = getSql(inputs);
        }

        /*
            resourceId is not in the params, so we need sortorder, 
            limit and offset
        */
        else {
            const sortorder = zUtils.getOrderBy(params);
            const { limit, offset } = zUtils.getLimitAndOffset(params);
            
            inputs.sortorder = sortorder;
            inputs.limit = limit;
            inputs.offset = offset;

            full = getSql(inputs);
        }
    }

    return { 
        sql: { count, full }, 
        runparams 
    }
}

const mainQueries = ({ resource, params }) => {
    
    /*
        validated params are different from the params 
        submitted via the REST query
    */
    params = zUtils.validate({ resource, params });
    
    /*
        if validation failed, no params are returned, 
        so return false
    */
    if (!params) {
        return false;
    }

    return queries({ resource, params });
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

const relatedQueries = ({ resource, params }) => {

    // validated params are different from the params submitted to validate()
    params = zUtils.validate({ resource, params });

    // if validation failed, no params are returned, so return false
    if (!params) {
        return false;
    }

    //const treatmentId = params.treatmentId;
    //log.info(`relatedQueries() -> resource: ${resource}, treatmentId: ${treatmentId}`);
    return queries({ resource, params });
}

const zql = ({ resource, params }) => {
    const { sql, runparams } = mainQueries({ resource, params });

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
                const o = {
                    resource, 
                    params: { treatmentId }
                };

                const { sql, runparams } = relatedQueries(o);
                result.queries.related[resource] = sql;
            })
        }
    }

    if (params.facets) {
        result.queries.facets = facetQueries(resource)
    }

    return result;
}

/*
    preZql() is used only when testing zql from 
    the command line or via jest
*/
const preZql = ({ resource, searchparams }) => {
    const params = {};
    const sp = new URLSearchParams(searchparams);

    /*
        https://stackoverflow.com/a/67111094/183692
        Set will return only unique keys()
    */
    new Set([...sp.keys()])
        .forEach(key => {
            params[key] = sp.getAll(key).length > 1 ?  

            // get multiple values
            sp.getAll(key) : 

            // get single value
            sp.get(key); 
        });

    return zql({ resource, params });
}

// https://stackoverflow.com/questions/6398196/detect-if-called-through-require-or-directly-by-command-line?rq=1
if (require.main === module) {
    const test = ({ resource, searchparams }) => {

        const printQuery = (header, sql, params) => {
            console.log(header);
            console.log('-'.repeat(50));
            console.log(sqlFormatter.format(sql, { params }));
            console.log('\n');
        }

        const res = preZql({ resource, searchparams });

        console.log('REST query');
        console.log('-'.repeat(50));
        console.log(`resource: ${resource}`);
        console.log(`qs: ${searchparams}`)
        console.log('\n');
    
        printQuery('count query', res.queries.main.count, res.runparams);
        printQuery('full query', res.queries.main.full, res.runparams);

        console.log('related queries');
        console.log('='.repeat(50));
        if (res.queries.related) {
            for (let [key, val] of Object.entries(res.queries.related)) {
                console.log(`queries for: ${key}`);
                console.log('*'.repeat(50));

                printQuery('count query', val.count, res.runparams);
                printQuery('full query', val.full, res.runparams);
            }
        }
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
        "searchparams": "checkinTime=since(yesterday)&page=2&size=50&httpUri=ne()&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=captionText"
    }

    input = {
        "resource": "treatments",
        "searchparams": "treatmentId=000040332F2853C295734E7BD4190F05&cols=treatmentTitle&relatedRecords=true"
    }

    input = {
        "resource": "treatmentImages",
        "searchparams": "treatmentDOI=http://doi.org/10.5281/zenodo.3854772&cols=treatmentTitle&cols=zenodoDep&cols=treatmentId"
    },

    input = {
        "resource": "treatmentImages",
        "searchparams": "q=acamar&refreshCache=true&page=1&size=30"
    }

    test(input);
    
}
else {
    module.exports = { zql, preZql };
}