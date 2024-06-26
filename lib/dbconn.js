import { Config } from '@punkish/zconfig';
const config = new Config().settings;

const logOpts = JSON.parse(JSON.stringify(config.truebug.log));
logOpts.name = 'DBCONN';
logOpts.level = 'ERROR';
import Zlogger from '@punkish/zlogger';
const log = new Zlogger(logOpts);

import * as utils from './utils.js';
import Database from 'better-sqlite3';
import { ddutils } from '../data-dictionary/utils/index.js';

const prepareTables = (tables, db) => {    
    tables.forEach(t => {

        // create tables
        log.info(`  - table "${t.name}"`);
        try {
            db.conn.prepare(t.createStmt).run();
        }
        catch (error) {
            console.log(error);
            console.log(t.createStmt);
        }

        // create triggers, if they exist
        if (Object.entries(t.triggers).length) {
            log.info('  - triggers');

            for (let [name, stmt] of Object.entries(t.triggers)) {
                log.info(`    - trigger "${name}"`);
                try {
                    db.conn.prepare(stmt).run();
                }
                catch (error) {
                    console.log(error);
                    console.log(t.stmt);
                }
            }
        }

        // collect the insert functions and store them in the db object
        if (t.insertFuncs) {
            log.info('  - insert functions');

            for (let [name, func] of Object.entries(t.insertFuncs)) {
                log.info(`    - function "${name}"`);
                db.insertFuncs[name] = func;
            }
        }

        // collect the index statements and store them in the db object
        if (t.indexes) {
            log.info('  - indexes');

            for (const [name, stmt] of Object.entries(t.indexes)) {
                log.info(`    - index "${name}"`)
                db.indexes[name] = stmt;
            }
        }

        // collect the queries and store them in the db object
        // if (t.queries) {
        //     log.info(`  - queries`);

        //     for (const [name, query] of Object.entries(t.queries)) {
        //         log.info(`    - query "${name}"`)
        //         db.queries[name] = query;
        //     }
        // }
        
    })
}

const createDbs = () => {
    log.info(`creating "zenodeo" database`);
    const schemas = ddutils.getTableSchemas();

    const dbName = `${config.dataDir}/zenodeo.sqlite`;
    const geoDb = `${config.dataDir}/geodata.sqlite`;
    log.info(`  db: "${dbName}", geodb: "${geoDb}"`);

    const db = {
        "class": Database,
        "conn": new Database(dbName),
        "insertFuncs": {},
        "indexes": {},
        //queries: {}
    }

    db.conn.prepare(`ATTACH DATABASE '${geoDb}' AS geodata`).run();

    for (const { database, tables } of schemas) {
        prepareTables(tables, db);
    }
    
    return db;
}

const setPragmas = (db) => {
    log.info('setting pragmas for performance and FK support');

    const pragmas = [
        'PRAGMA cache_size = 10240',
        'PRAGMA foreign_keys = ON',
        'PRAGMA synchronous = OFF',
        //'PRAGMA journal_mode = MEMORY',
        'PRAGMA journal_mode = WAL'
    ];

    pragmas.forEach(pragma => {
        log.info(`- ${pragma}`);
        db.conn.prepare(pragma).run()
    });
    
}

const initDb = () => {
    utils.checkDir({
        dir: config.dataDir,
        removeFiles: false
    });

    const db = createDbs();
    setPragmas(db);
    
    return db;
}

export { initDb }