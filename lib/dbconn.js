'use strict';

import fs from 'fs';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;

const logOpts = JSON.parse(JSON.stringify(config.truebug.log));
logOpts.name = 'DBCONN';
logOpts.level = 'error';
import { Zlogger } from '@punkish/zlogger';
const log = new Zlogger(logOpts);

import Database from 'better-sqlite3';
import { ddutils } from '../data-dictionary/utils/index.js';

const checkDirs = (dir) => {
    log.info(`checking if ${dir} directory exists… `, 'start');

    const exists = fs.existsSync(dir);

    if (exists) {
        log.info('yes, it does\n', 'end');
    }
    else {
        log.info("it doesn't exist… making it\n", 'end');
        fs.mkdirSync(dir, { recursive: true })
    }
}

const prepareTables = (tables, db) => {
    const tablesWithTriggers = [
        'bibRefCitations', // fails
        'figureCitations', // works
        'materialCitations', // fails
        'treatments' // fails
    ];
    
    tables.forEach(t => {
        log.info(`  - table "${t.name}"`);
        try {
            db.conn.prepare(t.createStmt).run();
        }
        catch (error) {
            console.log(error);
            console.log(t.createStmt);
        }

        // if (Object.keys(t.triggers).length) {
        //     log.info('  - triggers');

        //     // Check if this is the first time the db is being created
        //     const { c } = db.conn.prepare(`
        //         SELECT Count(*) AS c FROM ${t.name}
        //     `).get();

        //     for (let [tType, triggers] of Object.entries(t.triggers)) {
                
        //         if (c) {

        //             // There are rows in the table, so we can 
        //             // make both immediate and delayed triggers
        //             log.info(`      - "${tType}" triggers`);

        //             for (let [name, stmt] of Object.entries(triggers)) {
        //                 log.info(`        - trigger "${name}`);
        //                 try {
        //                     db.conn.prepare(stmt).run();
        //                 }
        //                 catch (error) {
        //                     console.log(error);
        //                     console.log(stmt);
        //                 }
        //             }

        //         }
        //         else {

        //             // The table is empty. This means the db 
        //             // has been freshly created and a full load will be 
        //             // performed. So, for performance reasons, we don't 
        //             // create any delayed triggers
        //             if (tType === 'immediate') {
        //                 log.info(`      - "${tType}" triggers`);

        //                 for (let [name, stmt] of Object.entries(triggers)) {
        //                     log.info(`        - trigger "${name}`);
        //                     db.conn.prepare(stmt).run();
        //                 }
        //             }

        //         }
                
        //     }
        // }


        if (tablesWithTriggers.includes(t.name)) {
            log.info('  - triggers');

            for (let [name, stmt] of Object.entries(t.triggers)) {
                log.info(`    - trigger "${name}"`);
                db.conn.prepare(stmt).run();
            }
        }

        if (t.insertFuncs) {
            log.info('  - insert functions');

            for (let [name, func] of Object.entries(t.insertFuncs)) {
                log.info(`    - function "${name}"`);
                db.insertFuncs[name] = func;
            }
        }

        if (t.indexes) {
            log.info('  - indexes');

            for (const [name, stmt] of Object.entries(t.indexes)) {
                log.info(`    - index "${name}"`)
                db.indexes[name] = stmt;
            }
        }
        
    })
}

const createDbJson = () => {
    log.info(`creating "zenodeo" JSON database`);

    const dbJson = new Database(`${config.dataDir}/zenodeo-json.sqlite`);
    dbJson.prepare(`CREATE TABLE IF NOT EXISTS treatments (
    treatmentId TEXT NOT NULL PRIMARY KEY,
    timeTaken INTEGER NOT NULL
) WITHOUT rowid;
    `).run();

    dbJson.prepare('PRAGMA journal_mode = MEMORY').run();
    return dbJson;
}

const createDbs = () => {
    log.info(`creating "zenodeo" database`);
    const schemas = ddutils.getTableSchemas();

    const dbName = `${config.dataDir}/zenodeo.sqlite`;
    log.info(`  "${dbName}"`);
    const db = {
        conn: new Database(dbName),
        insertFuncs: {},
        indexes: {}
    }

    for (let { database, tables } of schemas) {
        prepareTables(tables, db);
    }
    
    return db;
}

/** 
 * ATTACH external databases
 * 
 * https://github.com/JoshuaWise/better-sqlite3/issues/102#issuecomment-369468174
 */
// const attachDbs = (db) => {
//     log.info('Now attaching databases');


//     Object.keys(db)
//         .filter(dbName => dbName !== 'main')
//         .forEach(d => {
//             const dbConn = db[dbName];

//         })

//     for (const [dbName, dbConn] of Object.entries(db)) {
//         pragmas.forEach(p => {
//             log.info(`- ${dbName}: ${p}`);
//             db[dbConn].prepare(p).run()
//         });
//     }

//     console.log(`- attaching 'treatments' AS 'tr'`);
//     db.prepare(`ATTACH DATABASE '${dataDir}/attached/treatments.sqlite' AS tr`).run();
//     console.log(`- attaching 'materialcitations' AS 'mc'`);
//     db.prepare(`ATTACH DATABASE '${dataDir}/attached/materialcitations.sqlite' AS mc`).run();
// }

const setPragmas = (db) => {
    log.info('setting pragmas for performance and FK support');

    const pragmas = [
        'PRAGMA foreign_keys = ON',
        'PRAGMA synchronous = OFF',
        'PRAGMA journal_mode = MEMORY',
        //'PRAGMA journal_mode = WAL'
    ];

    pragmas.forEach(pragma => {
        log.info(`- ${pragma}`);
        db.conn.prepare(pragma).run()
    });
    
}

const initDb = () => {
    checkDirs(config.dataDir);
    const db = createDbs();
    setPragmas(db);

    //const dbJson = createDbJson();
    
    return { db, dbJson: '' };
}

const { db, dbJson } = initDb();

export { db, dbJson }