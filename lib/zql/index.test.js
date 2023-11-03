'use strict'

import minimist from 'minimist';
import { preZql } from './index.js';
import { imageQueries, treatmentQueries, foreignKeys } from './tests/index.js';
import { printQuery, counts } from '../testInfra.js';
import tap from 'tap';

const tests = [ 
    ...imageQueries, 
    ...treatmentQueries, 
    ...foreignKeys 
];

const argv = minimist(process.argv.slice(2));

const emoji = (count) => {

    let e;

    if (count < 300) e = '🚀'
    else if (count >= 300 && count < 500) e = '💨'
    else e = '💤';
    
    return e;
}

const duration = (start, end) => (Number(end - start) * 1e-6).toFixed(0);

const row = (cols) => {
    if (cols === '-') {
        return `${'-'.repeat(57)}  ${'-'.repeat(9)}  ${'-'.repeat(9)}`;
    }
    else {
        return `${cols[0].padEnd(56, ' ')}  ${cols[1].padEnd(9, ' ')}  ${cols[2].padEnd(9, ' ')}`;
    }
}

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
    console.log(`🖼️ images\n${'-'.repeat(60)}`);
    const len = 100;
    let counter = 0;

    imageQueries.forEach((q, i) => {
        const query = q.input.searchparams.length > len 
            ? `${q.input.searchparams.substring(0, len)}…`
            : q.input.searchparams;

        console.log(`${String(counter).padStart(2, ' ')}: ${query}`);
        counter++;
    });

    console.log(`\n✝️ treatments\n${'-'.repeat(60)}`);

    treatmentQueries.forEach((q, i) => {
        const query = q.input.searchparams.length > len 
            ? `${q.input.searchparams.substring(0, len)}…`
            : q.input.searchparams;

        console.log(`${String(counter).padStart(2, ' ')}: ${query}`);
        counter++;
    });

    console.log(`\n🗝️ foreign keys\n${'-'.repeat(60)}`);

    foreignKeys.forEach((q, i) => {
        const query = q.input.searchparams.length > len 
            ? `${q.input.searchparams.substring(0, len)}…`
            : q.input.searchparams;

        console.log(`${counter}: ${query}`);
        counter++;
    });
}
else if (argv.test) {
    //tap.test('ZQL', tap => {
        
        console.log(row(['desc', 'count', 'full']));
        console.log(row('-'));

        tests.forEach((t, i) => {
            // if (i < 13 || i > 15) {
            //     return;
            // }
            
            const res = preZql(t.input);
            const queryCount = res.queries.count;
            const queryFull = res.queries.full;
            const rp = res.runparams;

            // let start = process.hrtime.bigint();
            // const numOfRecordsCount = counts(queryCount, rp);
            // let end = process.hrtime.bigint();
            // const durationCount = duration(start, end);

            // let numOfRecordsFull = 0;
            // let durationFull = 0;

            // if (numOfRecordsCount && queryFull) {
            //     start = process.hrtime.bigint();
            //     numOfRecordsFull = counts(queryFull, rp);
            //     end = process.hrtime.bigint();
            //     durationFull = duration(start, end);
            // }

            // const exp = t.output;

            // const inp = [ numOfRecordsCount, numOfRecordsFull];
            // const out = [ 
            //     exp.num_of_records, 
            //     numOfRecordsFull
            // ];
            
            // How to compare arrays in JavaScript?
            // https://stackoverflow.com/a/19746771/183692
            // const cond1 = inp.length === out.length;
            // const cond2 = inp.every((value, index) => value === out[index]);

            const cond3 = t.output.queries.main.count === queryCount;
            const cond4 = t.output.queries.main.full === queryFull;

            //const status = cond1 && cond2 ? 'ok' : 'failed';
            const status = cond3 && cond4 ? 'ok' : 'failed';
            
            const len = 40;
            let desc = `${String(i).padStart(2, ' ')}. ${status} - `;
            desc += t.input.resource.substring(0, 7) + ': ';
            desc += t.desc.length > len
                ? `${t.desc.substring(0, len - 1)}…`
                : t.desc.padEnd(len, ' ');
            
            const durationCount = 1;
            const durationFull = 1;
            const countStr = emoji(durationCount) + String(durationCount).padStart(7, ' ');
            const fullStr  = emoji(durationFull)  + String(durationFull).padStart(7, ' ');

            console.log(row([desc, countStr, fullStr]));            

            //tap.same(inp, out, desc);

        });
    
        //tap.end();
    //});
}
else {
    const argv = minimist(process.argv.slice(2));
    const queryNum = argv._[0];
    
    if (queryNum) {
        const t = tests[queryNum];
        //console.log(queryNum)
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