import { initDb } from './dbconn.js';
const db = initDb();
import { formatDialect, sqlite as dialect } from 'sql-formatter';
import * as utils from './utils.js';

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
};

// write the string in the defined color
const r = (str) => c(str, 'red');
const g = (str) => c(str, 'green');
const b = (str) => c(str, 'blue');

const formatter = (sql, runparams, format, runtime, results) => {
    console.log(format 
        ? formatDialect(sql, { params: runparams, dialect, tabWidth: 4 }) 
        : sql);

    if (results) {
        process.stdout.write(`\n`);
        console.log(`time taken: ${runtime}`);
    }
    
    console.log('-'.repeat(50));
}

const counts = (sql, rp) => {
    const dbres = db.conn.prepare(sql).all(rp);
    //console.log(dbres)
    if (dbres && dbres[0].num_of_records) {
        return dbres[0].num_of_records;
    }
    else {
        false;
    }
}

function runQueriesInTransaction(queries, runparams) {

    const queriesForTxn = [];

    if (queries.dropTmp) {
        queriesForTxn.push({
            queryName: 'dropTmp',
            preparedQuery: db.conn.prepare(queries.dropTmp),
            runparams: '',
            type: ''
        })
    }

    if (queries.createTmp) {
        queriesForTxn.push({
            queryName: 'createTmp',
            preparedQuery: db.conn.prepare(queries.createTmp),
            runparams,
            type: ''
        })
    }

    if (queries.count) {
        queriesForTxn.push({
            queryName: 'count',
            preparedQuery: db.conn.prepare(queries.count),
            runparams,
            type: 'get'
        })
    }

    if (queries.full) {

        if (queries.count) {
            queriesForTxn.push({
                queryName: 'count',
                preparedQuery: db.conn.prepare(queries.count),
                runparams,
                type: 'get'
            })
        }
        else {

        }

        queriesForTxn.push({
            queryName: 'full',
            preparedQuery: db.conn.prepare(queries.full),
            runparams,
            type: 'all'
        })
    }
    else {
        if (queries.count) {
            queriesForTxn.push({
                queryName: 'count',
                preparedQuery: db.conn.prepare(queries.count),
                runparams,
                type: 'get'
            })
        }
    }

    if (queries.yearlyCounts) {
        queriesForTxn.push({
            queryName: 'yearlyCounts',
            preparedQuery: db.conn.prepare(queries.yearlyCounts),
            runparams,
            type: 'all'
        })
    }

    const queryPkg = db.transaction((queriesForTxn) => {
        const results = [];

        for (const { queryName, preparedQuery, runparams, type } of queriesForTxn) {
            if (type === 'all' || type === 'get') {
                const res = runparams
                    ? preparedQuery[type](runparams)
                    : preparedQuery[type]();

                results.push({
                    queryName,
                    res
                })
            }
            else {
                runparams
                    ? preparedQuery.run(runparams)
                    : preparedQuery.run();
            }
        }
    });

    queryPkg(queriesForTxn);
}

function runQuery({ query, runparams, type }) {
    let t = process.hrtime();
    let res;

    try {
        if (type === 'all' || type === 'get') {
            res = runparams
                ? db.conn.prepare(query)[type](runparams)
                : db.conn.prepare(query)[type]();
        }
        else {
            runparams
                ? db.conn.prepare(query).run(runparams)
                : db.conn.prepare(query).run();
        }
    }
    catch(error) {
        console.log(error);
        console.log(query);
        console.log(runparams)
    }

    t = process.hrtime(t);
    const runtime = utils.timerFormat(t);

    return { res, runtime, t };
}

// const printQuery = ({ header, body, sql, runparams, format, results }) => {
//     r(header.toUpperCase());
//     console.log('-'.repeat(50));

//     if (body) {
//         console.log(body);
//         console.log('='.repeat(50), '\n');
//     }

//     let dbres;
    
//     if (sql) {

//         const rp = {};
        
//         if (runparams) {
//             for (const [key, val] of Object.entries(runparams)) {
//                 rp[key] = val;
//             }
//         }

        
//         if (typeof(sql) === 'string') {
            
//             console.log(formatter(sql, rp, format));
//             console.log('='.repeat(50), '\n');

//             if (results) {
                
//                 dbres = db.conn.prepare(sql).all(rp);
                
//                 if (dbres && dbres[0].num_of_records) {
//                     console.log(`records found: ${dbres[0].num_of_records}`);
//                 }
//                 else {
//                     console.log(`records found: none`);
//                 }
//             }
//             else {
//                 dbres = db.conn.prepare(sql).run();
//             }
            

//         }
//         else {
            
//             for (let [k, stmt] of Object.entries(sql)) {
                
//                 console.log(k);
//                 console.log('-'.repeat(50));
//                 console.log(formatter(stmt, rp, format));
//                 console.log('='.repeat(50), '\n');

//                 if (results) {
//                     dbres = db.prepare(stmt).all(rp);
//                     console.log(`records found: ${JSON.stringify(dbres, null, 4)}`, '\n');
//                 }
                
//             }
//         }
//     }
    
// }

const printQuery = ({
    queryType,
    resource,
    searchparams,
    runparams,
    queries,
    format,
    results
}) => {

    function printHeader(msg) {
        process.stdout.write(`\n`);
        r(msg);
        b('='.repeat(50));
    }

    printHeader('REST QUERY');
    console.log(`resource: ${resource}`);
    console.log(`qs: ${searchparams}`);
    console.log(`runparams: ${JSON.stringify(runparams, null, 4)}`);
    console.log(`type of query: ${queryType}`);
    console.log('Queries: ');
    for (const [queryName, stmt] of Object.entries(queries)) {
        if (stmt) {
            console.log(`- ${queryName}`);
        }
    }

    if (results) {
        let totaltime = 0;

        if (queries.dropTmp) {
            printHeader('DROPTMP QUERY');
            const { res, runtime, t } = runQuery({ query: queries.dropTmp });
            totaltime += utils.t2ms(t);
            formatter(queries.dropTmp, null, format, runtime, results);
        }

        if (queries.createTmp) {
            printHeader('CREATETMP QUERY');
            const { res, runtime, t } = runQuery({ 
                query: queries.createTmp, 
                runparams 
            });

            totaltime += utils.t2ms(t);
            formatter(queries.createTmp, runparams, format, runtime, results);

            if (queries.createIndex) {
                printHeader('CREATEINDEX QUERY');
                const res2 = runQuery({ 
                    query: queries.createIndex, 
                    runparams
                });
                
                totaltime += utils.t2ms(res2.t);
                formatter(queries.createIndex, runparams, format, res2.runtime, results);
            }
            
        }

        let num_of_records = 0;
        
        if (queries.full) {
            const { res, runtime, t } = runQuery({ 
                query: queries.full, runparams, type: 'all' 
            });
            totaltime += utils.t2ms(t);

            if (queries.count) {
                printHeader('COUNT QUERY');
                const { res, runtime, t } = runQuery({ 
                    query: queries.count, 
                    runparams, 
                    type: 'get' 
                });
                totaltime += utils.t2ms(t);
                formatter(queries.count, null, format, runtime, results);
                num_of_records = res.num_of_records;
                console.log(`${num_of_records} row(s) found`);
            }
            else {
                if (res) {
                    num_of_records = 1;
                }
            }

            printHeader('FULL QUERY');
            formatter(queries.full, null, format, runtime, results);
            console.log(`${res.length} rows found`);
        }
        else {
            printHeader('COUNT QUERY');
            const { res, runtime, t } = runQuery({ 
                query: queries.count, 
                runparams, 
                type: 'get' 
            });
            totaltime += utils.t2ms(t);
            formatter(queries.count, null, format, runtime, results);
            num_of_records = res.num_of_records;
            console.log(`${num_of_records} row(s) found`);
        }

        if (queries.yearlyCounts) {
            printHeader('YEARLY COUNTS QUERY');
            
            const { res, runtime, t } = runQuery({ 
                query: queries.yearlyCounts, 
                runparams, 
                type: 'all' 
            });
            totaltime += utils.t2ms(t);
            formatter(queries.yearlyCounts, runparams, format, runtime, results);
            console.table(res);
        }

        console.log('*'.repeat(50));
        
        const queryNames = Object.entries(queries).filter(([k, v]) => v).map(([k, v]) => k);

        const q = queryNames.length > 1 ? 'queries' : 'query';
        console.log(`${queryNames.length} ${q} took ${totaltime.toFixed(0)} ms`);
        queryNames.forEach(q => console.log(`- ${q}`));
        console.log('*'.repeat(50));
    }

    // TODO
    else {
        
        for (const [ queryName, stmt ] of Object.entries(queries)) {
            process.stdout.write(`\n`);
            r(queryName.toUpperCase());
            g('='.repeat(50));
            
            if (typeof(stmt) === 'string') {
                formatter(stmt, runparams, format);
            }
            else if (typeof(stmt) === 'boolean') {
                if (stmt === false) {
                    console.log('not needed');
                }
            }
            else {
                for (const [queryName, stmt] of Object.entries(queries.stmt)) {
                    console.log(queryName);
                    g('='.repeat(50));
    
                    formatter(stmt, runparams, format);
                }
            }
        }
    }
    
}

export {
    printQuery,
    counts,
    runQuery,
    r, g, b
}