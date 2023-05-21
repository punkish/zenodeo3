'use strict'

import minimist from 'minimist';
import { preZql } from './index.js';
import { sampleQueries } from './sample-queries.js';
import { printQuery } from '../testInfra.js';
import tap from 'tap';

const tests = [ ...sampleQueries ];

const argv = minimist(process.argv.slice(2));

if (argv.help) {
    console.log(`
zql USAGE:
${'*'.repeat(79)}

node lib/zql/index.js --format=true --results=true --list=true queryNum
 
    --format=false|true  (format sql)
    --results=false|true (query db)
    --list=false|true    (list available queries)`);
}
        
else if (argv.list) {
    sampleQueries.forEach((q, i) => {
        console.log(`query ${i}`);
        console.log('-'.repeat(50));
        console.log(q.input, '\n');
    })
}
else if (argv.test) {
    tap.test('ZQL', tap => {
    
        tests.forEach((t, i) => {
            const res = JSON.stringify(preZql(t.input));
            const exp = JSON.stringify(t.output);
    
            tap.equal(
                res,
                exp,
                t.desc
            );
        });
    
        tap.end();
    });
}
else {
    const queryNum = process.argv.slice(2)[0];
    
    if (queryNum) {
        const t = tests[queryNum];
        const { resource, searchparams } = t.input;
    
        const { queries, runparams } = preZql({ resource, searchparams });
    
        const format = argv.format || false;
        const results = argv.results || false;

        const obj = { 
            header: 'REST query', 
            body: `resource: ${resource}
    qs: ${searchparams}
    runparams: ${JSON.stringify(runparams, null, 4)}`,
            sql: null, 
            runparams: null, 
            format, 
            results 
        };
    
        printQuery(obj);
    
        obj.header = 'count query';
        obj.body = null;
        obj.sql = queries.count;
        obj.runparams = runparams;

        printQuery(obj);
    
        obj.header = 'full query';
        obj.sql = queries.full;

        printQuery(obj);
    
        if (queries.related) {
            console.log('related queries');
            console.log('='.repeat(50));
    
            for (let [key, val] of Object.entries(queries.related)) {
    
                console.log(`queries for: ${key}`);
                console.log('-'.repeat(50));
    
                obj.header = 'count query';
                obj.sql = val.count;
                obj.runparams = runparams;

                printQuery(obj);
    
                obj.header = 'full query';
                obj.sql = val.full;
                
                printQuery(obj);
            }
        }
    
        if (queries.facets) {
            if (Object.keys(queries.facets).length) {
    
                console.log('facet queries');
                console.log('='.repeat(50));
    
                for (let [key, val] of Object.entries(queries.facets)) {

                    obj.header = `queries for: ${key}`;
                    obj.sql = val;
                    obj.runparams = runparams;

                    printQuery(obj);
                }
            }
        }
    
        if (queries.stats) {
            if (Object.keys(queries.stats).length) {
    
                console.log('stats queries');
                console.log('='.repeat(50));
    
                for (let [key, val] of Object.entries(queries.stats)) {

                    obj.header = `queries for: ${key}`;
                    obj.sql = val;
                    obj.runparams = runparams;

                    printQuery(obj);
                }
            }
        }
    }
    else {
        console.log(`
zql USAGE:
${'*'.repeat(79)}

node lib/zql/index.js --format=true --results=true --list=true queryNum
 
    --format=false|true  (format sql)
    --results=false|true (query db)
    --list=false|true    (list available queries)`);
    }
}