'use strict';

import { dispatch as ddutils } from '../../data-dictionary/dd-utils.js';
import * as zUtils from './z-utils.js';
import { format } from 'sql-formatter';
import { sampleQueries } from './sample-queries.js';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;

/** 
 * prepare and connect to the database (only for testing)
**/
import Database from 'better-sqlite3';
const db = new Database(config.db.treatments);

/** 
 * ATTACH external databases
 * 
 * https://github.com/JoshuaWise/better-sqlite3/issues/102#issuecomment-369468174
**/
const gbifcollections = config.db.gbifcollections;
db.prepare(`ATTACH DATABASE '${gbifcollections}' AS gbifcollections`).run();

const facets = config.db.facets;
db.prepare(`ATTACH DATABASE '${facets}' AS facets`).run();

const stats = config.db.stats;
db.prepare(`ATTACH DATABASE '${stats}' AS stats`).run();

/**
 * A SQL SELECT statement is made up of following clauses
 *
 * SELECT   [<columns>]                    <- getColumns()
 * FROM     [<tables>]                     <- getTables()
 * WHERE    [<constraints>]                <- getConstraints()
 * ORDER BY [<col> <dir>, <col> <dir> …]   <- getSortOrder()
 * LIMIT    <int: limit>                   <- getLimitAndOffset()
 * OFFSET   <int: offset>                  <- getLimitAndOffset()
 *
 * The first two clauses (SELECT and FROM) are mandatory.
 * The remaining clauses are optional
**/
const getCountSql = ({ columns, tables, constraints }) => {
    const sqlClauses = [ `SELECT Count(DISTINCT ${columns[0]}) AS num_of_records` ];
    const rest = _getSql({ tables, constraints });
    sqlClauses.push(...rest);
    return sqlClauses.join(' ');
}

const getFullSql = ({ columns, tables, constraints, sortorder, limit, offset }) => {
    const sqlClauses = [ `SELECT ${columns.join(', ')}` ];
    const rest = _getSql({ tables, constraints, sortorder, limit, offset });
    sqlClauses.push(...rest);
    return sqlClauses.join(' ');
}

const _getSql = ({ tables, constraints, sortorder, limit, offset }) => {
    const parts = [ `FROM ${tables.join(' ')}` ];

    if (constraints.length) {
        parts.push(`WHERE ${constraints.join(' AND ')}`);
    }

    if (sortorder && sortorder.length) {
        parts.push(`ORDER BY ${sortorder.join(', ')}`);
    }

    if (limit) {
        parts.push(`LIMIT ${limit}`);
    }

    if (offset !== undefined) {
        parts.push(`OFFSET ${offset}`);
    }

    return parts;
}

const queries = ({ resource, params }) => {

    /**
     * if the user sent any empty 'cols' keys –
     * for example, in `cols=&col=foo` the first 
     * 'cols' is empty – remove such empty cols
    **/
    params.cols = params.cols.filter(c => c != '');

    const columns = zUtils.getSelect({ resource, params });
    const tables = zUtils.getFrom({ resource, params });
    const { constraints, runparams } = zUtils.getWhere({ resource, params });
    
    /**
     * count sql is always created, and we don't 
     * need sortorder and limit for it
    **/
    const inputs = { columns, tables, constraints };
    const count = getCountSql(inputs);
    
    /**
     * 'cols' can be specified explicitly with an empty value
     * to force only a count SQL. So we check 'cols' and 
     * return fullSql **only** if 'cols' is not empty
    **/
    let full = '';

    const resourceId = ddutils.getResourceid(resource);
    const resourceIdName = resourceId.split('.')[1];

    if (params.cols.length) {

        /**
         * if resourceId exists in params – for example,
         * `treatmentId=000040332F2853C295734E7BD4190F05` – 
         * only one record is going to be returned from the 
         * query, so we don't need sortorder, limit and offset 
         * because they make no sense
        **/
        inputs.type = 'full';

        if (resourceIdName in params) {
            full = getFullSql(inputs);
        }

        /**
         * resourceId is not in the params, so we need sortorder, 
         * limit and offset
        **/
        else {
            const sortorder = zUtils.getOrderBy(params);
            const { limit, offset } = zUtils.getLimitAndOffset(params);
            
            inputs.sortorder = sortorder;
            inputs.limit = limit;
            inputs.offset = offset;

            full = getFullSql(inputs);
        }
    }

    return { 
        sql: { count, full }, 
        runparams 
    }
}

const mainQueries = ({ resource, params }) => {

    /**
     * validated params are different from the params 
     * submitted via the REST query
    **/
    params = zUtils.validate({ resource, params });
    
    /**
     * if validation failed, no params are returned, 
     * so return false
    **/
    if (!params) {
        return false;
    }

    return queries({ resource, params });
}

const facetQueries = (resource) => {
    const facets = {};
    const table = ddutils.tableFromResource(resource);
    const tables = [ table ];
    
    const columns = ddutils.getFacetCols(resource);
    
    columns.forEach(c => {
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

    return queries({ resource, params });
}

const statsQueries = ({ resource, params }) => {

    /**
     * validated params are different from the params 
     * submitted via the REST query
    **/
    params = zUtils.validate({ resource, params });
    
    /**
     * if validation failed, no params are returned, 
     * so return false
    **/
    if (!params) {
        return false;
    }

    /**
     * if the user sent any empty 'cols' keys –
     * for example, in `cols=&col=foo` the first 
     * 'cols' is empty – remove such empty cols
    **/
    params.cols = params.cols.filter(c => c != '');

    //const columns = zUtils.getSelect({ resource, params });
    const tables = zUtils.getFrom({ resource, params });
    const { constraints, runparams } = zUtils.getWhere({ resource, params });
    
    /**
     * count sql is always created, and we don't 
     * need sortorder and limit for it
    **/
    //const inputs = { columns, tables, constraints };

    const statsTables = [
        { tb: 'treatments',         pk: 'treatmentId'         },
        { tb: 'materialsCitations', pk: 'materialsCitationId' },
        { tb: 'figureCitations',    pk: 'figureCitationId'    },
        { tb: 'treatmentCitations', pk: 'treatmentCitationId' }
    ];
    
    const stats = {};

    for (let i = 0, j = statsTables.length; i < j; i++) {
        const tb = statsTables[i].tb;
        const pk = statsTables[i].pk;
        const t = JSON.parse(JSON.stringify(tables));

        if (tb !== 'treatments') {
            t.push(`JOIN ${tb} ON ${tb}.treatmentId = treatments.treatmentId`);
        }
    
        for (let i = 0, j = years.length; i < j; i++) {
            const year = years[i];

            const c = JSON.parse(JSON.stringify(constraints));
            c.push(`treatments.checkinTime BETWEEN strftime('%s', '${year}-01-01') * 1000 AND strftime('%s', '${year}-12-31') * 1000`);

            stats[`${tb}-${year}`] = `SELECT Count(DISTINCT ${tb}.${pk}) AS num_of_records FROM ${t.join(' ')} WHERE ${c.join(' AND ')}`;
        }
    }

    return stats;
}

const zql = ({ resource, params }) => {

    /**
     * always get the main queries
    **/
    const { sql, runparams } = mainQueries({ resource, params });

    const result = {
        queries: {
            main: sql,
            related: {},

            /**
             * the following two will be created if requested
            **/
            // facets: {},
            // stats: {}
        },

        runparams,
    }
    
    /**
     * related records make sense only if a single treatment  
     * is being queried
    **/
    if (resource === 'treatments' && 'treatmentId' in params) {

        /** 
         * get related records only if explicitly requested
        **/
        if (params.relatedRecords) {
            const treatmentId = params.treatmentId;

            /** 
             * note the name of 'materialCitations' as opposed 
             * to 'materialsCitations'
            **/
            const relatedResources = [
                'bibRefCitations',
                'figureCitations',
                'materialCitations',
                'treatmentCitations',
                //'treatmentAuthors'
            ]
        
            relatedResources.forEach(resource => {
                const { sql, runparams } = relatedQueries({ 
                    resource, 
                    params: { treatmentId } 
                });
                
                result.queries.related[resource] = sql;
            })
        }
    }

    /**
     * get facets only if explicitly requested
    **/
    if (params.facets) {
        result.queries.facets = facetQueries(resource)
    }

    /**
     * get dashboard stats only if explicitly requested *and*
     * the resource is treatments
    **/
    if (params.stats && resource === 'treatments') {
        result.queries.stats = statsQueries({ resource, params });
    }

    return result;
}

/**
 * preZql() is used only when testing zql from 
 * the command line or via jest
**/
const preZql = ({ resource, searchparams }) => {
    const params = {};
    const sp = new URLSearchParams(searchparams);

    /**
     * https://stackoverflow.com/a/67111094/183692
     * Set will return only unique keys()
    **/
    new Set([...sp.keys()])
        .forEach(key => {
            params[key] = sp.getAll(key).length > 1 
            
                /**
                 * get multiple values 
                **/ 
                ? sp.getAll(key) 
                
                /**
                 * get single value 
                **/
                : sp.get(key);
        });
        
    return zql({ resource, params });
}

const colors = {
    black : '\u001b[30m',
    red   : '\u001b[31m',
    green : '\u001b[32m',
    orange: '\u001b[33m',
    blue  : '\u001b[34m',
    purple: '\u001b[35m',
    cyan  : '\u001b[36m',
    white : '\u001b[37m',
    reset : '\u001b[39m'
};

// set the color, write the str, reset the color
const c = (str, color) => {
    process.stdout.write(colors[color]);
    process.stdout.write(str);
    process.stdout.write(`${colors.reset}\n`);
}

// write the string in the defined color
const r = (str) => c(str, 'red');
const g = (str) => c(str, 'green');
const b = (str) => c(str, 'blue');

const test = ({ resource, searchparams }) => {

    const res = preZql({ resource, searchparams });
    const sqlformatterOpts = { params: res.runparams, language: 'sqlite' };

    const printQuery = ({ header, body, sql }) => {
        r(header);
        console.log('-'.repeat(50));

        if (body) {
            console.log(body);
            console.log('\n');
        }
        
        if (sql) {
            console.log(format(sql, sqlformatterOpts));
            console.log('\n');
        }
    }

    const str = [
        `resource: ${resource}`,
        `qs: ${searchparams}`,
        `runparams: ${JSON.stringify(res.runparams, null, 4)}`
    ];

    printQuery({ header: 'REST query', body: str.join('\n') });
    printQuery({ header: 'count query', sql: res.queries.main.count });

    // let dbres = db.prepare(res.queries.main.count).all(res.runparams);
    // console.log(`records found: ${dbres.length}`);
    // console.log('\n');

    printQuery({ header: 'full query', sql: res.queries.main.full });

    // dbres = db.prepare(res.queries.main.full).all(res.runparams);
    // console.log(`records found: ${dbres.length}`);
    // console.log('\n');

    if (Object.keys(res.queries.related).length) {

        console.log('related queries');
        console.log('='.repeat(50));

        for (let [key, val] of Object.entries(res.queries.related)) {

            console.log(`queries for: ${key}`);
            console.log('-'.repeat(50));

            printQuery({ header: 'count query', sql: val.count });
            printQuery({ header: 'full query', sql: val.full });
        }
    }

    if (res.queries.facets) {
        if (Object.keys(res.queries.facets).length) {

            console.log('facet queries');
            console.log('='.repeat(50));

            for (let [key, val] of Object.entries(res.queries.facets)) {
                printQuery({ header: `queries for: ${key}`, sql: val });
            }
        }
    }

    if (res.queries.stats) {
        if (Object.keys(res.queries.stats).length) {

            console.log('stats queries');
            console.log('='.repeat(50));

            for (let [key, val] of Object.entries(res.queries.stats)) {
                printQuery({ header: `queries for: ${key}`, sql: val });
            }
        }
    }
}

/**
 * Detect if this program is called as a module or 
 * directly from the command line
 * 
 * https://stackoverflow.com/a/66309132/183692
**/
import path from 'path';
import { fileURLToPath } from 'url';

const path1 = path.resolve(process.argv[1]);
const path2 = path.resolve(fileURLToPath(import.meta.url));
const nodePath = path1.split('/').pop().split('.')[0];
const modulePath = path2.split('/').pop().split('.')[0];

if (nodePath === modulePath) {
    test(sampleQueries[9].input);
}

export { zql, preZql }