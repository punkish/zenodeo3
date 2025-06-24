'use strict'

import minimist from 'minimist';
import { preZql } from './index.js';
import { initDb } from '../dbconn.js';
const db = initDb();
import { 
    imageQueries, 
    treatmentQueries, 
    foreignKeys, 
    ecoregionQueries,
    fasterQueries
} from './tests/index.js';
import { printQuery, counts, runQuery } from '../testInfra.js';
import { getDataFromZenodeo } from '../dataFromZenodeo.js';
const tests = {
    all: [
        ...imageQueries, 
        ...treatmentQueries, 
        ...foreignKeys,
        ...ecoregionQueries,
        ...fasterQueries
    ],
    imageQueries: [ ...imageQueries ], 
    treatmentQueries, 
    foreignKeys,
    ecoregionQueries,
    fasterQueries: [ ...fasterQueries ]
};

const argv = minimist(process.argv.slice(2));
import * as utils from '../utils.js';
import { ddutils } from "../../data-dictionary/utils/index-ng.js";
import { getQueryType } from '../../utils.js';

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
        col2: 10,
        col3: 9,
        col4: 9,
        col5: 13
    };

    if (cols === '-') {
        const hCol1 = '-'.repeat(width.col1);
        const hCol2 = '-'.repeat(width.col2);
        const hCol3 = '-'.repeat(width.col3);
        const hCol4 = '-'.repeat(width.col4);
        const hCol5 = '-'.repeat(width.col5);

        return `${hCol1}  ${hCol2}  ${hCol3}  ${hCol4}  ${hCol5}`;
    }
    else {
        const dCol1 = cols[0].padEnd(width.col1, ' ');
        const dCol2 = cols[1].padEnd(width.col2, ' ');
        const dCol3 = cols[2].padEnd(width.col3, ' ');
        const dCol4 = cols[3].padEnd(width.col4, ' ');
        const dCol5 = cols[4].padEnd(width.col5, ' ');

        return `${dCol1}  ${dCol2}  ${dCol3}  ${dCol4}  ${dCol5}`;
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

const testAll = (testGroup) => {
    console.log(row(['desc', 'create tmp', 'count', 'full', 'yearly counts']));
    console.log(row('-'));

    let i = 0;
    const j = tests[testGroup].length;

    for (;i < j; i++) {
        const t = tests[testGroup][i];
        const { queries, runparams, params } = preZql(t.input.searchparams);

        let totaltime = 0;
        let createTmpTime = 0;
        let countTime = 0;
        let fullTime = 0;
        let yearlyCountsTime = 0;

        if (queries.dropTmp) {
            const { res, runtime, t } = runQuery({ 
                query: queries.dropTmp, 
                runparams
            });

            totaltime += utils.t2ms(t);
        }

        if (queries.createTmp) {
            const { res, runtime, t } = runQuery({ 
                query: queries.createTmp, 
                runparams
            });

            const res2 = runQuery({ 
                query: queries.createIndex, 
                runparams
            });

            createTmpTime = utils.t2ms(t);
            totaltime += createTmpTime;
        }

        let num_of_records = 0;

        if (queries.full) {
            const { res, runtime, t } = runQuery({ 
                query: queries.full, 
                runparams, 
                type: 'all' 
            });

            fullTime = utils.t2ms(t);
            totaltime += fullTime;

            if (queries.count) {
                const { res, runtime, t } = runQuery({ 
                    query: queries.count, 
                    runparams, 
                    type: 'get' 
                });

                countTime = utils.t2ms(t);
                totaltime += countTime;
                num_of_records = res.num_of_records;
            }
            else {
                if (res) {
                    num_of_records = 1;
                }
            }
        }
        else {
            const { res, runtime, t } = runQuery({ 
                query: queries.count, 
                runparams, 
                type: 'get' 
            });

            countTime = utils.t2ms(t);
            totaltime += countTime;
            num_of_records = res.num_of_records;
        }

        if (queries.yearlyCounts) {            
            const { res, runtime, t } = runQuery({ 
                query: queries.yearlyCounts, 
                runparams, 
                type: 'all' 
            });

            yearlyCountsTime = utils.t2ms(t);
            totaltime += yearlyCountsTime;
        }
        
        const len = 40;
        let desc = `${String(i).padStart(2, ' ')}. ok - `;
        desc += t.input.resource.substring(0, 6) + ': ';
        desc += t.desc.length > len
            ? `${t.desc.substring(0, len - 1)}…`
            : t.desc.padEnd(len, ' ');
        
        let createTmpStr = '-';

        if (queries.createTmp) {
            createTmpStr  = emoji(createTmpTime.toFixed(0)) + 
                String(createTmpTime.toFixed(2)).padStart(7, ' ');
        }
        
        let countStr = '-';

        if (queries.count) {
            countStr = emoji(countTime.toFixed(0)) + 
                String(countTime.toFixed(2)).padStart(7, ' ');
        }

        let fullStr = '-';

        if (queries.full) {
            fullStr  = emoji(fullTime) + 
                String(fullTime.toFixed(2)).padStart(7, ' ');
        }

        let yearlyCountsStr = '-';

        if (queries.yearlyCounts) {
            yearlyCountsStr  = emoji(yearlyCountsTime) + 
                String(yearlyCountsTime.toFixed(2)).padStart(11, ' ');
        }

        console.log(row([
            desc, createTmpStr, countStr, fullStr, yearlyCountsStr
        ]));
    }
}

if (argv.help) {
    console.log(usage);
}       
else if (argv.list) {
    
    const sampleQueries = {
        '🖼️ images'      : imageQueries,
        '⊤ treatments'  : treatmentQueries,
        '🗝️ foreign keys': foreignKeys,
        '🌎 ecoregions'  : ecoregionQueries,
        'faster queries': fasterQueries
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
    const format = argv.format || false;
    const results = argv.results || false;
    
    if (typeof(queryNum) === 'number') {
        const test = tests.all[queryNum];
        const { resource, searchparams } = test.input;
        const params = preZql(searchparams);
        const res = getDataFromZenodeo({
            request: {
                query: params
            },
            resource,
            fastify: {
                betterSqlite3: db.conn
            }
        });

        const queries = Object.keys(res.debug).filter(q => q !== 'runparams');
        console.log(`queries: ${queries.join(', ')}`);

        let secs = 0;
        let msecs = 0;

        queries.forEach(q => {
            const t = res.debug[q].runtime.match(/(?<secs>\d+)s (?<msecs>\d+\.\d\d)ms/);
            secs += Number(t.groups.secs);
            msecs += Number(t.groups.msecs);
            
        });

        console.log(`this took: ${secs}s ${msecs}ms`);
    }
    else if (Object.keys(tests).includes(queryNum)) {
        testAll(queryNum);
    }
    else {
        console.log(usage);
    }
    
}

