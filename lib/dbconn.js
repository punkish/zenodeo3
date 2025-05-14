import { Config } from '@punkish/zconfig';
const config = new Config().settings;

const logOpts = JSON.parse(JSON.stringify(config.zlogger));
logOpts.name = 'DBCONN';
import Zlogger from '@punkish/zlogger';
const log = new Zlogger(logOpts);

import * as utils from './utils.js';
import Database from 'better-sqlite3';
import { ddutils } from '../data-dictionary/utils/index.js';

function initDb() {
    log.info(`Initializing "zenodeo" database`);
    utils.checkDir({
        dir: config.dataDir,
        removeFiles: false
    });

    const schemas = ddutils.getTableSchemas();
    const dbName = `${config.dataDir}/zenodeo.sqlite`;
    log.info(`- preparing "${dbName}"`);
    const mainDb = schemas.filter(el => el.database.schema === 'main')[0];

    const db = {
        "class": Database,
        "conn": new Database(dbName),
        "insertFuncs": {},
        "indexes": {},
        //queries: {}
    }

    for (const table of mainDb.tables) {
        prepareTables(table, db);
    }

    const geoDb = `${config.dataDir}/geodata.sqlite`;
    log.info(`- attaching database '${geoDb}' AS geodata`);
    db.conn.prepare(`ATTACH DATABASE '${geoDb}' AS geodata`).run();
    setPragmas(db);
    return db;
}

function prepareTables(table, db) {    

    // create tables
    log.info(`  - table "${table.name}"`);
    try {
        db.conn.prepare(table.createStmt).run();
    }
    catch (error) {
        console.log(error);
        console.log(table.createStmt);
    }

    // create triggers, if they exist
    if (Object.entries(table.triggers).length) {
        log.info('    - triggers');

        for (let [name, stmt] of Object.entries(table.triggers)) {
            log.info(`      - trigger "${name}"`);
            try {
                db.conn.prepare(stmt).run();
            }
            catch (error) {
                console.log(error);
                console.log(stmt);
            }
        }
    }

    // collect the insert functions and store them in the db object
    if (table.insertFuncs) {
        log.info('    - insert functions');

        for (let [name, func] of Object.entries(table.insertFuncs)) {
            log.info(`      - function "${name}"`);
            db.insertFuncs[name] = func;
        }
    }

    // collect the index statements and store them in the db object
    if (table.indexes) {
        log.info('    - indexes');

        for (const [name, stmt] of Object.entries(table.indexes)) {
            log.info(`      - index "${name}"`)
            db.indexes[name] = stmt;
        }
    }
}

function setPragmas(db) {
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

export { initDb }