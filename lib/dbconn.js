import { Config } from '@punkish/zconfig';
const config = new Config().settings;
import * as utils from './utils.js';
import Database from 'better-sqlite3';
import { ddutils } from '../data-dictionary/utils/index.js';

function initDb({ zlog }) {
    zlog.setLevel('error');
    zlog.info(`Initializing "zenodeo" database`);
    utils.checkDir({
        dir: config.dataDir,
        removeFiles: false,
        zlog
    });

    const schemas = ddutils.getTableSchemas();
    const dbName = `${config.dataDir}/zenodeo.sqlite`;
    zlog.info(`- preparing "${dbName}"`);
    const mainDb = schemas.filter(el => el.database.schema === 'main')[0];

    const db = {
        "class": Database,
        "conn": new Database(dbName),
        "insertFuncs": {},
        "indexes": {},
        //queries: {}
    }

    for (const table of mainDb.tables) {
        prepareTables(table, db, zlog);
    }

    const geoDb = `${config.dataDir}/geodata.sqlite`;
    zlog.info(`- attaching database '${geoDb}' AS geodata`);
    db.conn.prepare(`ATTACH DATABASE '${geoDb}' AS geodata`).run();
    setPragmas(db, zlog);
    zlog.setLevel('info');
    return db;
}

function prepareTables(table, db, zlog) {    

    // create tables
    zlog.info(`  - table "${table.name}"`);
    try {
        db.conn.prepare(table.createStmt).run();
    }
    catch (error) {
        console.log(error);
        console.log(table.createStmt);
    }

    // create triggers, if they exist
    if (Object.entries(table.triggers).length) {
        zlog.info('    - triggers');

        for (let [name, stmt] of Object.entries(table.triggers)) {
            zlog.info(`      - trigger "${name}"`);
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
        zlog.info('    - insert functions');

        for (let [name, func] of Object.entries(table.insertFuncs)) {
            zlog.info(`      - function "${name}"`);
            db.insertFuncs[name] = func;
        }
    }

    // collect the index statements and store them in the db object
    if (table.indexes) {
        zlog.info('    - indexes');

        for (const [name, stmt] of Object.entries(table.indexes)) {
            zlog.info(`      - index "${name}"`)
            //db.indexes[name] = stmt;
            try {
                db.conn.prepare(stmt).run();
            }
            catch (error) {
                console.log(error);
                console.log(stmt);
            }
        }
    }
}

function setPragmas(db, zlog) {
    zlog.info('setting pragmas for performance and FK support');

    const pragmas = [
        'PRAGMA cache_size = 10240',
        'PRAGMA foreign_keys = ON',
        'PRAGMA synchronous = OFF',
        //'PRAGMA journal_mode = MEMORY',
        'PRAGMA journal_mode = WAL'
    ];

    pragmas.forEach(pragma => {
        zlog.info(`- ${pragma}`);
        db.conn.prepare(pragma).run()
    });
    
}

export { initDb }