'use strict';

import { ddutils } from '../../data-dictionary/utils/index.js';
import * as zu from './z-utils.js';
import process from 'node:process';
import minimist from 'minimist';

/**
 * Detect if this program is called as a module or 
 * directly from the command line
 * 
 * https://stackoverflow.com/a/66309132/183692
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { formatDialect, sqlite as dialect } from 'sql-formatter';
import { sampleQueries } from './sample-queries.js';

/** 
 * connect to the database (only for testing)
 */
import { db } from '../dbconn.js';

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
 */
const getSql = (obj, sqlType) => {
    const { 
        columns, tables, constraints, sortorder, 
        limit, offset, groupby, having 
    } = obj;

    const sqlClauses = [];

    if (sqlType === 'count') {
        //sqlClauses.push(`SELECT Count(DISTINCT ${columns[0]}) AS num_of_records`);
        sqlClauses.push(`SELECT Count(*) AS num_of_records`);
    }
    else {
        sqlClauses.push(`SELECT ${columns.join(', ')}`);
    }

    sqlClauses.push(`FROM ${tables.join(' ')}`);

    if (constraints && constraints.length) {
        sqlClauses.push(`WHERE ${constraints.join(' AND ')}`);
    }

    if (groupby !== undefined) {
        sqlClauses.push(`GROUP BY ${groupby}`);
    }

    if (having !== undefined) {
        sqlClauses.push(`HAVING ${having}`);
    }

    if (sortorder && sortorder.length) {
        sqlClauses.push(`ORDER BY +${sortorder.join(', ')}`);
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
    const columns = zu.getSelect({ resource, params });
    const tables = zu.getFrom({ resource, params });
    const { constraints, runparams } = zu.getWhere({ resource, params });

    const isFts = constraints
        .filter(constraint => constraint.indexOf('MATCH') > -1);

    let t = tables;
    if (!isFts.length) {
        t = tables.filter(table => table.indexOf('Fts') === -1);
    }

    const queries = { runparams };

    /**
     * count sql is always created, and we don't 
     * need sortorder and limit for it
     */
    queries.count = getSql({ columns, tables: t, constraints }, 'count');

    /**
     * 'cols' can be specified explicitly with an empty value
     * to force only a count SQL. So we check 'cols' and 
     * return fullSql **only** if 'cols' is not empty
     */
    if (params.cols) {

        /**
         * if resourceId exists in params – for example,
         * `treatmentId=000040332F2853C295734E7BD4190F05` – 
         * only one record is going to be returned from the 
         * query, so we don't need sortorder, limit and offset 
         * because they make no sense
         */
        const { resourceId, resourceIdName } = ddutils.getResourceId(resource);
        const obj = {
            columns, 
            tables: t, 
            constraints
        }

        /**
         * resourceId is not in the params, so we need sortorder, 
         * limit and offset
         */
        if (!(resourceIdName in params)) {
            obj.sortorder = zu.getOrderBy({ resource, params });
            obj.groupby = zu.getGroupBy({ resource, params });
            const { limit, offset } = zu.getLimitAndOffset({ resource, params });
            obj.limit = limit;
            obj.offset = offset;
        }

        queries.full = getSql(obj, 'full');
    }

    /**
     * get dashboard stats only if explicitly requested *and*
     * the resource is treatments
     */
    if (params.stats && resource === 'treatments') {
        queries.stats = statsQueries({ tables, constraints });
    }

    return queries;
}

const zql = ({ resource, params }) => {
    
    // 
    // validated params are different from the params 
    // submitted via the REST query
    params = zu.validate({ resource, params });

    // 
    // if validation failed, no params are returned, 
    // so return false
    if (!params) return false;

    const { runparams, count, full, stats } = mainQueries({ resource, params });

    // 
    // the result datastructure to be returned
    const result = {
        queries: {
            count
            
            // 
            // the following will be created if requested
            // full,
            // related: {},
            // facets: {},
            // stats: {}
        },

        runparams
    };

    if (full) result.queries.full = full;
    if (stats) result.queries.stats = stats;

    // 
    // related records make sense only if a single treatment  
    // is being queried
    if (resource === 'treatments' && ('treatmentId' in params)) {

        //  
        // get related records only if explicitly requested
        if (params.relatedRecords) {
            result.queries.related = {};

            const treatmentId = params.treatmentId;

            //  
            // note the name of 'materialCitations' as opposed 
            // to 'materialCitations'
            const relatedResources = [
                'bibRefCitations',
                'figureCitations',
                'materialCitations',
                'treatmentCitations',
                'treatmentAuthors'
            ]
        
            relatedResources.forEach(resource => {
                const params = { treatmentId };
                const sql = relatedQueries({ resource, params });
                result.queries.related[resource] = sql;
            })
        }
    }

    // 
    // get facets only if explicitly requested
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
    params = zu.validate({ resource, params });

    // if validation failed, no params are returned, so return false
    if (!params) {
        return false;
    }

    return mainQueries({ resource, params });
}

const statsQueries = ({ tables, constraints }) => {
    const entities = [
        { tb: 'treatments',         pk: 'treatmentId'         },
        { tb: 'materialCitations',  pk: 'materialCitationId'  },
        { tb: 'figureCitations',    pk: 'figureCitationId'    },
        { tb: 'treatmentCitations', pk: 'treatmentCitationId' },
        { tb: 'bibRefCitations',    pk: 'bibRefCitationId'    },
        { tb: 'treatmentAuthors',   pk: 'treatmentAuthorId'   }
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
            columns: [ 
                'treatments.checkInYear', 
                `Count(DISTINCT ${tb}.${pk}) AS num` 
            ],
            tables: t,
            constraints: c,
            group: 1
        }

        stats.charts[tb] = getSql(obj);
    }

    /**
     * now lets make the SQL for locations
     */
    const t = JSON.parse(JSON.stringify(tables));
    const c = JSON.parse(JSON.stringify(constraints));
    
    /** 
     * We need to modify 'tables' but not the constraints.
     * 'tables' need to be modified *only* if they don't 
     * already contain 'materialCitations'
     */
    if (t.filter(e => e.search(/materialCitations/) === -1)) {

        /**
         * OK, t doesn't have 'materialCitations', but let's check 
         * if t has 'treatments' as that will provide a path to 
         * JOINing with 'materialCitations'
         */
        if (t.filter(e => e.search(/treatments/) > -1)) {
            t.push('JOIN materialCitations ON treatments.treatmentId = materialCitations.treatmentId');
        }
        else {

            /**
             * 't' doesn't have 'treatments', so we have to JOIN with 
             * 'materialCitations' via 'treatments' JOINed to the 
             * main resource table, that is, the first table in 't'
             */
            const { resourceId, resourceIdName } = zu.getResourceId;

            t.push(`JOIN treatments ON ${resourceId} = treatments.treatmentId`);
            t.push('JOIN materialCitations ON treatments.treatmentId = materialCitations.treatmentId');
        }
    }
    
    const obj = {
        columns: [
            'materialCitations.country',
            'Count(materialCitations.materialsCitationId) AS num'
        ],

        /**
         * remove duplicates from t
         * https://stackoverflow.com/a/15868720
         */
        tables: [ ...new Set(t) ],
        constraints: c,
        limit: 10,
        offset: 0,
        sortorder: [ 'num DESC' ],
        group: 'country'
    }

    stats.locations = getSql(obj);

    return stats;
}

/**
 * preZql() is used only when testing zql from 
 * the command line or via jest
 */
const preZql = ({ resource, searchparams }) => {
    const params = {};
    const sp = new URLSearchParams(searchparams);

    //
    // https://stackoverflow.com/a/67111094/183692
    // Set will return only unique keys()
    new Set([...sp.keys()])
        .forEach(key => {
            params[key] = sp.getAll(key).length > 1 
            
                // get multiple values 
                ? sp.getAll(key) 
                
                // get single value 
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

const formatter = (sql, runparams, format) => format 
    ? formatDialect(sql, { params: runparams, dialect, tabWidth: 4 }) 
    : sql;

const printQuery = ({ header, body, sql, runparams, format, results }) => {
    r(header.toUpperCase());
    console.log('-'.repeat(50));

    if (body) {
        console.log(body);
        console.log('='.repeat(50), '\n');
    }

    let dbres;
    
    if (sql) {

        const rp = {};
        
        for (const [key, val] of Object.entries(runparams)) {
            rp[key] = val;
        }

        if (typeof(sql) === 'string') {
            console.log(formatter(sql, rp, format));
            console.log('='.repeat(50), '\n');

            if (results) {
                dbres = db.conn.prepare(sql).all(rp);
                console.log(`records found: ${JSON.stringify(dbres, null, 4)}`, '\n');

                // if (res.queries.full) {
                //     dbres = db.prepare(res.queries.full).all(rp);
                //     console.log(`records found: ${JSON.stringify(dbres, null, 4)}`, '\n');
                // }
            }

        }
        else {
            for (let [k, stmt] of Object.entries(sql)) {
                console.log(k);
                console.log('-'.repeat(50));
                console.log(formatter(stmt, rp, format));
                console.log('='.repeat(50), '\n');

                if (results) {
                    dbres = db.prepare(stmt).all(rp);
                    console.log(`records found: ${JSON.stringify(dbres, null, 4)}`, '\n');
                }
            }
        }
    }
    
}

const test = ({ resource, searchparams }, format = false, results = false) => {

    const res = preZql({ resource, searchparams });

    printQuery({ 
        header: 'REST query', 
        body: `resource: ${resource}
qs: ${searchparams}
runparams: ${JSON.stringify(res.runparams, null, 4)}` 
    });

    printQuery({ 
        header: 'count query', 
        sql: res.queries.count, 
        runparams: res.runparams, 
        format,
        results 
    });

    printQuery({ 
        header: 'full query', 
        sql: res.queries.full, 
        runparams: res.runparams, 
        format,
        results 
    });

    if (res.queries.related) {
        console.log('related queries');
        console.log('='.repeat(50));

        for (let [key, val] of Object.entries(res.queries.related)) {

            console.log(`queries for: ${key}`);
            console.log('-'.repeat(50));

            printQuery({ 
                header: 'count query', 
                sql: val.count, 
                runparams: res.runparams, 
                format,
                results 
            });

            printQuery({ 
                header: 'full query', 
                sql: val.full, 
                runparams: res.runparams, 
                format,
                results 
            });
        }
    }

    if (res.queries.facets) {
        if (Object.keys(res.queries.facets).length) {

            console.log('facet queries');
            console.log('='.repeat(50));

            for (let [key, val] of Object.entries(res.queries.facets)) {
                printQuery({ 
                    header: `queries for: ${key}`, 
                    sql: val, 
                    runparams: res.runparams, 
                    format,
                    results 
                });
            }
        }
    }

    if (res.queries.stats) {
        if (Object.keys(res.queries.stats).length) {

            console.log('stats queries');
            console.log('='.repeat(50));

            for (let [key, val] of Object.entries(res.queries.stats)) {
                printQuery({ 
                    header: `queries for: ${key}`, 
                    sql: val, 
                    runparams: res.runparams, 
                    format,
                    results 
                });
            }
        }
    }
}

const init = () => {
    const path1 = path.resolve(process.argv[1]);
    const path2 = path.resolve(fileURLToPath(import.meta.url));
    const nodePath = path1.split('/').pop().split('.')[0];
    const modulePath = path2.split('/').pop().split('.')[0];

    if (nodePath === modulePath) {
        const argv = minimist(process.argv.slice(2));
        
        if (argv.help || argv._.length === 0) {
            console.log(`
zql USAGE:
${'*'.repeat(79)}

node lib/zql/index.js --format=true --results=true queryNum

notes: 
- whether or not SQL is formatted
    --format=false|true ('false' is default)
    --results=false|true ('false' is default)`);
            return;
        }
        
        if (argv.list) {
            sampleQueries.forEach((q, i) => {
                console.log(`query ${i}`);
                console.log('-'.repeat(50));
                console.log(q.input, '\n');
            })
        }
        else {
            const format = argv.format || false;
            const results = argv.results || false;
            const queryNum = argv._[0];
            const query = sampleQueries[queryNum].input;
            test(query, format, results);
        }
    }
}

init();

export { zql, preZql }