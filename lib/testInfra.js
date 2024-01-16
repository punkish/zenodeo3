import { initDb } from './dbconn.js';
const db = initDb();
import { formatDialect, sqlite as dialect } from 'sql-formatter';

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

const formatter = (sql, runparams, format) => format 
    ? formatDialect(sql, { params: runparams, dialect, tabWidth: 4 }) 
    : sql;

const counts = (sql, rp) => {
    //console.log(sql,rp)
    const dbres = db.conn.prepare(sql).all(rp);
    //console.log(dbres)
    if (dbres && dbres[0].num_of_records) {
        return dbres[0].num_of_records;
    }
    else {
        false;
    }
}

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
        
        if (runparams) {
            for (const [key, val] of Object.entries(runparams)) {
                rp[key] = val;
            }
        }
        

        if (typeof(sql) === 'string') {
            
            console.log(formatter(sql, rp, format));
            console.log('='.repeat(50), '\n');

            if (results) {
                dbres = db.conn.prepare(sql).all(rp);
                
                if (dbres && dbres[0].num_of_records) {
                    console.log(`records found: ${dbres[0].num_of_records}`);
                }
                else {
                    console.log(`records found: none`);
                }
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

export {
    printQuery,
    counts,
    r, g, b
}