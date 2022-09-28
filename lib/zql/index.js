'use strict';

import { dispatch as ddutils } from '../../data-dictionary/dd-utils.js';
import * as zUtils from './z-utils.js';
import process from 'node:process';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;

/**
 * Detect if this program is called as a module or 
 * directly from the command line
 * 
 * https://stackoverflow.com/a/66309132/183692
**/
import path from 'path';
import { fileURLToPath } from 'url';
import { format as sqlFormat } from 'sql-formatter';
import { sampleQueries } from './sample-queries.js';

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
const getSql = (obj, sqlType) => {
    const { columns, tables, constraints, sortorder, limit, offset, group, having } = obj;

    const sqlClauses = [];

    if (sqlType === 'count') {
        sqlClauses.push(`SELECT Count(DISTINCT ${columns[0]}) AS num_of_records`);
    }
    else {
        sqlClauses.push(`SELECT ${columns.join(', ')}`);
    }

    sqlClauses.push(`FROM ${tables.join(' ')}`);

    if (constraints && constraints.length) {
        sqlClauses.push(`WHERE ${constraints.join(' AND ')}`);
    }

    if (group !== undefined) {
        sqlClauses.push(`GROUP BY ${group}`);
    }

    if (having !== undefined) {
        sqlClauses.push(`HAVING ${having}`);
    }

    if (sortorder && sortorder.length) {
        sqlClauses.push(`ORDER BY ${sortorder.join(', ')}`);
    }

    if (limit) {
        sqlClauses.push(`LIMIT ${limit}`);
    }

    if (offset !== undefined) {
        sqlClauses.push(`OFFSET ${offset}`);
    }
    
    return sqlClauses.join(' ');
}

const mainQueries = ({ resource, params }) => {

    /**
     * if the user sent any empty 'cols' keys –
     * for example, in `cols=&col=foo` the first 
     * 'cols' is empty – remove such empty cols
    **/
    params.cols = params.cols.filter(c => c != '');

    const columns = zUtils.getSelect({ resource, params });
    const tables = zUtils.getFrom({ resource, params });
    const { constraints, runparams } = zUtils.getWhere({ resource, params });

    const queries = { runparams };

    /**
     * count sql is always created, and we don't 
     * need sortorder and limit for it
    **/
    queries.count = getSql({ columns, tables, constraints }, 'count');

    /**
     * 'cols' can be specified explicitly with an empty value
     * to force only a count SQL. So we check 'cols' and 
     * return fullSql **only** if 'cols' is not empty
    **/
    if (params.cols.length) {

        /**
         * if resourceId exists in params – for example,
         * `treatmentId=000040332F2853C295734E7BD4190F05` – 
         * only one record is going to be returned from the 
         * query, so we don't need sortorder, limit and offset 
         * because they make no sense
        **/
        const resourceId = ddutils.getResourceid(resource);
        const resourceIdName = resourceId.split('.')[1];
        const obj = {
            columns, 
            tables, 
            constraints
        }

        /**
         * resourceId is not in the params, so we need sortorder, 
         * limit and offset
        **/
        if (!(resourceIdName in params)) {
            obj.sortorder = zUtils.getOrderBy(params);
            const { limit, offset } = zUtils.getLimitAndOffset(params);
            obj.limit = limit;
            obj.offset = offset;
        }

        queries.full = getSql(obj, 'full');
    }

    /**
     * get dashboard stats only if explicitly requested *and*
     * the resource is treatments
    **/
     if (params.stats && resource === 'treatments') {
        queries.stats = statsQueries({ tables, constraints });
    }

    return queries;
}

const zql = ({ resource, params }) => {

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

    const { runparams, count, full, stats } = mainQueries({ resource, params });

    /**
     * the result datastructure to be returned
    **/
    const result = {
        queries: {
            count
            
            /**
             * the following will be created if requested
            **/
            // full,
            // related: {},
            // facets: {},
            // stats: {}
        },

        runparams
    };

    if (full) result.queries.full = full;
    if (stats) result.queries.stats = stats;

    /**
     * related records make sense only if a single treatment  
     * is being queried
    **/
    if (resource === 'treatments' && ('treatmentId' in params)) {

        /** 
         * get related records only if explicitly requested
        **/
        if (params.relatedRecords) {
            result.queries.related = {};

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
                const params = { treatmentId };
                const sql = relatedQueries({ resource, params });
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

    return result;
}

const facetQueries = (resource) => {
    const facets = {};
    const table = ddutils.tableFromResource(resource);
    const tables = [ table ];
    
    const columns = ddutils.getFacetCols(resource);
    
    columns.forEach(c => {
        let obj = {
            columns: [ c.name, `Count(${c.name}) AS count` ],
            tables,
            constraints: [ `${c.name} != ''` ],
            group: c.name,
            having: c.facet,
            sortorder: [ `count DESC` ],
            limit: 50
        }
        const innerSql = getSql(obj);

        obj = {
            columns: [ c.name, 'count' ],
            tables: [ `(${innerSql}) AS t` ],
            sortorder: [ `${c.name} ASC` ]
        }

        //facets[c.name] = `SELECT ${c.name}, count FROM (SELECT ${c.name}, Count(${c.name}) AS count FROM ${tables.join(' JOIN ')} WHERE ${c.name} != '' GROUP BY ${c.name} HAVING ${c.facet} ORDER BY count DESC LIMIT 50) AS t ORDER BY ${c.name} ASC`;
        facets[c.name] = getSql(obj);
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

    return mainQueries({ resource, params });
}

const statsQueries = ({ tables, constraints }) => {
    const entities = [
        { tb: 'treatments',         pk: 'treatmentId'         },
        { tb: 'materialsCitations', pk: 'materialsCitationId' },
        { tb: 'figureCitations',    pk: 'figureCitationId'    },
        { tb: 'treatmentCitations', pk: 'treatmentCitationId' },
        { tb: 'bibRefCitations',    pk: 'bibRefCitationId'    },
    ];
    
    const stats = {
        charts: {}
    };

    for (let i = 0, j = entities.length; i < j; i++) {
        const tb = entities[i].tb;
        const pk = entities[i].pk;

        const t = JSON.parse(JSON.stringify(tables));
        const c = JSON.parse(JSON.stringify(constraints));
        
        if (tb !== 'treatments') {
            t.push(`JOIN ${tb} ON ${tb}.treatmentId = treatments.treatmentId`);
        }

        const obj = {
            columns: [ 'checkInYear', `Count(DISTINCT ${tb}.${pk}) AS num` ],
            tables: t,
            constraints: c,
            group: 1
        }

        stats.charts[tb] = getSql(obj);
    }

    /**
     * now lets make the SQL for locations
    **/
    let t = JSON.parse(JSON.stringify(tables));
    const c = JSON.parse(JSON.stringify(constraints));
    
    /** 
     * We need to modify 'tables' but not the constraints.
     * 'tables' need to be modified *only* if they don't 
     * already contain 'materialsCitations'
    **/
    if (t.filter(e => e.search(/materialsCitations/) === -1)) {

        /**
         * OK, t doesn't have 'materialsCitations', but let's check 
         * if t has 'treatments' as that will provide a path to 
         * JOINing with 'materialsCitations'
        **/
        if (t.filter(e => e.search(/treatments/) > -1)) {
            t.push('JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId');
        }
        else {

            /**
             * 't' doesn't have 'treatments', so we have to JOIN with 
             * 'materialCitations' via 'treatments' JOINed to the 
             * main resource table, that is, the first table in 't'
            **/
            const resource = t[0];
            const resourceId = ddutils.getResourceid(resource);
            t.push(`JOIN treatments ON ${resourceId} = treatments.treatmentId`);
            t.push('JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId');
        }
    }

    /**
     * now, remove duplicates from t
     * https://stackoverflow.com/a/15868720
    **/
    t = [ ...new Set(t) ];
    
    const obj = {
        columns: [
            'materialsCitations.country',
            'Count(materialsCitations.materialsCitationId) AS num'
        ],
        tables: t,
        constraints: c,
        sortorder: [ 'num DESC' ],
        group: 'country'
    }

    stats.locations = getSql(obj);

    return stats;
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
// const g = (str) => c(str, 'green');
// const b = (str) => c(str, 'blue');

const test = ({ resource, searchparams }, format = false) => {

    const res = preZql({ resource, searchparams });
    const sqlformatterOpts = { 
        params: res.runparams, 
        language: 'sqlite',
        tabWidth: 4
    };

    const formatter = (sql) => format ? sqlFormat(sql, sqlformatterOpts) : sql;

    const printQuery = ({ header, body, sql }) => {
        r(header);
        console.log('-'.repeat(50));

        if (body) console.log(body, '\n');
        
        if (sql) {
            if (typeof(sql) === 'string') {
                console.log(formatter(sql));
                console.log('='.repeat(50));
            }
            else {
                for (let [k, v] of Object.entries(sql)) {
                    const sql = v;
                    console.log(k);
                    console.log('-'.repeat(50));
                    console.log(formatter(sql));
                    console.log('='.repeat(50));
                    console.log('\n');
                }
            }
        }
    }

    const str = [
        `resource: ${resource}`,
        `qs: ${searchparams}`,
        `runparams: ${JSON.stringify(res.runparams, null, 4)}`
    ];

    printQuery({ header: 'REST query', body: str.join('\n') });
    printQuery({ header: 'count query', sql: res.queries.count });

    // let dbres = db.prepare(res.queries.count).all(res.runparams);
    // console.log(`records found: ${dbres.length}`);
    // console.log('\n');

    //printQuery({ header: 'full query', sql: res.queries.full });

    // dbres = db.prepare(res.queries.full).all(res.runparams);
    // console.log(`records found: ${dbres.length}`);
    // console.log('\n');

    if (res.queries.related) {
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

const path1 = path.resolve(process.argv[1]);
const path2 = path.resolve(fileURLToPath(import.meta.url));
const nodePath = path1.split('/').pop().split('.')[0];
const modulePath = path2.split('/').pop().split('.')[0];

if (nodePath === modulePath) {
    const args = process.argv;

    if (args.includes('--format')) {
        const queryNum = args[3];
        const query = sampleQueries[queryNum].input;
        test(query, true);
    }
    else if (args.includes('--list')) {
        sampleQueries.forEach((q, i) => {
            console.log(`query ${i}`);
            console.log('-'.repeat(50));
            console.log(q.input)
            console.log('='.repeat(50));
        })
    }
    else {
        const queryNum = args[2];
        const query = sampleQueries[queryNum].input;
        test(query);
    }
}

export { zql, preZql }