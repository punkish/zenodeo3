'use strict'

import minimist from 'minimist';
import { preZql } from './index.js';
import { 
    imageQueries, 
    treatmentQueries, 
    foreignKeys, 
    ecoregionQueries 
} from './tests/index.js';
import { printQuery, counts } from '../testInfra.js';
import tap from 'tap';

const tests = [ 
    ...imageQueries, 
    ...treatmentQueries, 
    ...foreignKeys,
    ...ecoregionQueries
];

const argv = minimist(process.argv.slice(2));

// choose an emoji to depict speed of query
const emoji = (ms) => {
    let e;

    if (ms < 300) e = '🚀'
    else if (ms >= 300 && ms < 500) e = '💨'
    else e = '💤';
    
    return e;
}

// convert nanoseconds to ms
const duration = (start, end) => (Number(end - start) * 1e-6).toFixed(0);

// print out a row of '-' or text
const row = (cols) => {
    const width = {
        col1: 57,
        col2: 9,
        col3: 9
    };

    if (cols === '-') {
        const headerCol1 = '-'.repeat(width.col1);
        const headerCol2 = '-'.repeat(width.col2);
        const headerCol3 = '-'.repeat(width.col3);

        return `${headerCol1}  ${headerCol2}  ${headerCol3}`;
    }
    else {
        const dataCol1 = cols[0].padEnd(width.col1, ' ');
        const dataCol2 = cols[1].padEnd(width.col2, ' ');
        const dataCol3 = cols[2].padEnd(width.col3, ' ');

        return `${dataCol1}  ${dataCol2}  ${dataCol3}`;
    }
}

const usage = `
zql USAGE:
${'*'.repeat(79)}

node lib/zql/index.test.js 
    --format=false|true  (format sql)
    --results=false|true (query db)
    --list=false|true    (list available queries)
    queryNum             (number or 'all')`;

const testAll = () => {
    //tap.test('ZQL', tap => {
        
    console.log(row(['desc', 'count', 'full']));
    console.log(row('-'));

    tests.forEach((t, i) => {
        const res = preZql(t.input);
        const queryCount = res.queries.count;
        const queryFull = res.queries.full;
        const rp = res.runparams || {};

        let start = process.hrtime.bigint();
        const numOfRecordsCount = counts(queryCount, rp);
        let end = process.hrtime.bigint();
        const durationCount = duration(start, end);

        let numOfRecordsFull = 0;
        let durationFull = 0;

        if (numOfRecordsCount && queryFull) {
            start = process.hrtime.bigint();
            numOfRecordsFull = counts(queryFull, rp);
            end = process.hrtime.bigint();
            durationFull = duration(start, end);
        }

        const exp = t.output;

        const inp = [ numOfRecordsCount, numOfRecordsFull];
        const out = [ 
            exp.num_of_records, 
            numOfRecordsFull
        ];
        
        // How to compare arrays in JavaScript?
        // https://stackoverflow.com/a/19746771/183692
        // const cond1 = inp.length === out.length;
        // const cond2 = inp.every((value, index) => value === out[index]);

        // const cond3 = t.output.queries.main.count === queryCount;
        // const cond4 = t.output.queries.main.full === queryFull;

        // //const status = cond1 && cond2 ? 'ok' : 'failed';
        // const status = cond3 && cond4 ? 'ok' : 'failed';
        
        const len = 40;
        let desc = `${String(i).padStart(2, ' ')}. ok - `;
        desc += t.input.resource.substring(0, 6) + ': ';
        desc += t.desc.length > len
            ? `${t.desc.substring(0, len - 1)}…`
            : t.desc.padEnd(len, ' ');
        
        const countStr = emoji(durationCount) + 
            String(durationCount).padStart(7, ' ');
        const fullStr  = emoji(durationFull) + 
            String(durationFull).padStart(7, ' ');

        console.log(row([desc, countStr, fullStr])); 
        
    });
}

if (argv.help) {
    console.log(usage);
}       
else if (argv.list) {
    
    const sampleQueries = {
        '🖼️ images'      : imageQueries,
        '⊤ treatments'  : treatmentQueries,
        '🗝️ foreign keys': foreignKeys,
        '🌎 ecoregions'  : ecoregionQueries
    };

    const len = 100;
    let counter = 0;

    const printQueryList = (queryGroup, q, i) => {

        if (i < 1) {
            console.log(`\n${queryGroup}\n${'-'.repeat(60)}`);
        }
        
        const query = q.input.searchparams.length > len 
            ? `${q.desc}\n    qs: ${q.input.searchparams.substring(0, len)}…`
            : `${q.desc}\n    qs: ${q.input.searchparams}`;

        console.log(`${String(counter).padStart(2, ' ')}: ${query}`);
        counter++;
    }

    for (const [queryGroup, queries] of Object.entries(sampleQueries)) {
        queries.forEach((q, i) => printQueryList(queryGroup, q, i));
    }

}
else {
    const argv = minimist(process.argv.slice(2));
    const queryNum = argv._[0];
    
    if (typeof(queryNum) === 'number') {
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
    
        if (queries.dropTmp) {
            obj.header = 'drop tmp query';
            obj.body = null;
            obj.sql = queries.dropTmp;
            //obj.runparams = runparams;
            printQuery(obj);
        }
        
        if (queries.createTmp) {
            obj.header = 'create tmp query';
            //obj.body = null;
            obj.sql = queries.createTmp;
            obj.runparams = runparams;
            printQuery(obj);
        }
        
        if (queries.count) {
            obj.header = 'count query';
            //obj.body = null;
            obj.sql = queries.count;
            obj.runparams = runparams;
            printQuery(obj);
        }
        
        if (queries.full) {
            obj.header = 'full query';
            obj.sql = queries.full;
            printQuery(obj);
        }
        
        if (queries.yearlyCounts) {
            console.log('yearly counts queries');
            console.log('='.repeat(50));

            for (let [key, val] of Object.entries(queries.yearlyCounts)) {
                console.log(`queries for: ${key}`);
                console.log('-'.repeat(50));
    
                obj.header = 'yearly count query';
                obj.sql = val.count;
                obj.runparams = runparams;

                printQuery(obj);
            }
        }

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
    else if (queryNum === 'all') {
        testAll();
    }
    else {
        console.log(usage);
    }
}

