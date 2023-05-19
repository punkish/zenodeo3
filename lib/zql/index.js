// @ts-check

'use strict';

import process from 'node:process';
import minimist from 'minimist';
import { validate } from './queryMaker/utils.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { formatDialect, sqlite as dialect } from 'sql-formatter';
import { sampleQueries } from './sample-queries.js';

import { 
    mainQueries, facetQueries, relatedQueries, statsQueries 
} from './queries/index.js';

//  
// connect to the database (only for testing)
// 
import { db } from '../dbconn.js';

const zql = ({ resource, params }) => {
    
    // 
    // validated params are different from the params submitted via the REST 
    // query
    //
    params = validate({ resource, params });

    // 
    // if validation failed, no params are returned, so return false
    // 
    if (!params) return false;

    const { runparams, count, full, stats } = mainQueries({ resource, params });

    // 
    // the result datastructure to be returned
    //
    const result = {
        queries: {
            count
            
            //*****************************/
            // the following will be created as requested
            //*****************************/
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
    // get related records only if explicitly requested
    //
    if (params.relatedRecords) {

        // 
        // related records make sense only if a single treatment is being 
        // queried
        // 
        if (resource === 'treatments' && ('treatmentId' in params)) {
            result.queries.related = {};

            const treatmentId = params.treatmentId;
            const relatedResources = [
                'bibRefCitations',
                'figureCitations',
                'materialCitations',
                'treatmentCitations',
                'treatmentAuthors'
            ];
        
            relatedResources.forEach(resource => {
                const params = { treatmentId };
                const sql = relatedQueries({ resource, params });
                result.queries.related[resource] = sql;
            });
        }
    }

    // 
    // get facets only if explicitly requested
    //
    if (params.facets) {
        result.queries.facets = facetQueries(resource)
    }

    return { queries: result.queries, runparams };
}

/**
 * preZql() is used only when testing zql from the command line or via a 
 * testing framework such as jest or tap. preZql() converts the querystring 
 * to URLSearchParams, which is what zql() expects.
 */
const preZql = ({ resource, searchparams }) => {
    const params = {};
    const sp = new URLSearchParams(searchparams);

    //
    // https://stackoverflow.com/a/67111094/183692
    // Set will return only unique keys()
    //
    new Set([...sp.keys()])
        .forEach(key => {
            params[key] = sp.getAll(key).length > 1 
            
                //
                // get multiple values 
                //
                ? sp.getAll(key) 
                
                //
                // get single value 
                //
                : sp.get(key);
        });
        
    const { queries, runparams } = zql({ resource, params });
    return { queries, runparams };
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

    const { queries, runparams } = preZql({ resource, searchparams });

    printQuery({ 
        header: 'REST query', 
        body: `resource: ${resource}
qs: ${searchparams}
runparams: ${JSON.stringify(runparams, null, 4)}`,
        sql: null, 
        runparams: null, 
        format: null, 
        results: null
    });

    printQuery({ 
        header: 'count query', 
        body: null,
        sql: queries.count, 
        runparams: runparams, 
        format,
        results 
    });

    printQuery({ 
        header: 'full query', 
        body: null,
        sql: queries.full, 
        runparams: runparams, 
        format,
        results
    });

    if (queries.related) {
        console.log('related queries');
        console.log('='.repeat(50));

        for (let [key, val] of Object.entries(queries.related)) {

            console.log(`queries for: ${key}`);
            console.log('-'.repeat(50));

            printQuery({ 
                header: 'count query', 
                body: null,
                sql: val.count, 
                runparams: runparams, 
                format,
                results 
            });

            printQuery({ 
                header: 'full query', 
                body: null,
                sql: val.full, 
                runparams: runparams, 
                format,
                results 
            });
        }
    }

    if (queries.facets) {
        if (Object.keys(queries.facets).length) {

            console.log('facet queries');
            console.log('='.repeat(50));

            for (let [key, val] of Object.entries(queries.facets)) {
                printQuery({ 
                    header: `queries for: ${key}`, 
                    body: null,
                    sql: val, 
                    runparams: runparams, 
                    format,
                    results 
                });
            }
        }
    }

    if (queries.stats) {
        if (Object.keys(queries.stats).length) {

            console.log('stats queries');
            console.log('='.repeat(50));

            for (let [key, val] of Object.entries(queries.stats)) {
                printQuery({ 
                    header: `queries for: ${key}`, 
                    body: null,
                    sql: val, 
                    runparams: runparams, 
                    format,
                    results 
                });
            }
        }
    }
}

const init = () => {

    // 
    // Detect if this program is called as a module or directly from the 
    // command line https://stackoverflow.com/a/66309132/183692
    // 
    const path1 = path.resolve(process.argv[1]);
    const path2 = path.resolve(fileURLToPath(import.meta.url));
    const nodePath = path1.split('/').pop().split('.')[0];
    const modulePath = path2.split('/').pop().split('.')[0];

    if (nodePath === modulePath) {
        const argv = minimist(process.argv.slice(2));
        
        if (argv.help) {
            console.log(`
zql USAGE:
${'*'.repeat(79)}

node lib/zql/index.js --format=true --results=true --list=true queryNum
 
    --format=false|true  (format sql)
    --results=false|true (query db)
    --list=false|true    (list available queries)`);
            return;
        }
        
        else if (argv.list) {
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