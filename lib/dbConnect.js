'use strict';

import fs from 'fs';
import path from 'path';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;

import Database from 'better-sqlite3';
const dbType = config.dbType;

const logOpts = JSON.parse(JSON.stringify(truebug.log));
logOpts.name = 'DBCONNECT';
logOpts.level = 'error';
import { Zlogger } from '@punkish/zlogger';
const log = new Zlogger(logOpts);

import { dbs } from '../bin/truebug/lib/database/dbs/index.js';

/** 
`* consolidated database with all the tables within
 */
const db = dbType === 'consolidated' 
    ? new Database(config.db.treatments.consolidated)
    : new Database(config.db.treatments.exploded);

const createExplodedDbs = () => {

    // check if the z3 directory exists
    const z3 = truebug.dirs.z3;
    if (!fs.existsSync(z3)) {
        log.info("dir 'z3' doesn't exist so creating…", 'start');
        fs.mkdirSync(z3);
        log.info('done\n');
    }

    for (const [database, schema] of Object.entries(dbs)) {
        log.info(`preparing db ${database}`);

        if (database === 'stats') {
            for (const [obj, def] of Object.entries(schema)) {
                if (obj === 'tables') {
                    def.forEach(t => {
                        log.info(`    - creating table ${t.name}`);
                        db.prepare(t.create).run();
                    })
                }
            }
        }
        else {
            const p = path.join(z3, `${database}.sqlite`);
            const d = new Database(p);

            for (const [obj, def] of Object.entries(schema)) {
                if (obj === 'tables') {
                    def.forEach(t => {
                        log.info(`    - creating ${t.type} table ${t.name}`);
                        d.prepare(t.create).run();
                    })
                }
            }
        }
        // const p = database === 'stats'
        //     ? path.join(truebug.dirs.data, 'z3-stats.sqlite')
        //     : path.join(z3, `${database}.sqlite`);
    }

    // set pragmas to speed up operation
    db.pragma('synchronous = OFF');
    db.pragma('journal_mode = MEMORY');
    log.info('all databases are ready');
}

const createTriggers = () => {
    for (const [database, schema] of Object.entries(dbs)) {
        log.info(`creating triggers in db ${database}`);

        for (const [obj, def] of Object.entries(schema)) {
            if (createTriggers) {
                if (obj === 'triggers') {
                    def.forEach(t => {
                        log.info(`    - creating trigger ${t.name}`);
                        db.prepare(t.create).run();
                    })
                }
            }
        }
    }

    log.info('all triggers are ready');
}

/** 
 * ATTACH external databases
 * 
 * https://github.com/JoshuaWise/better-sqlite3/issues/102#issuecomment-369468174
 */
const attachDbs = () => {
    log.info('Now attaching databases');

    const treatmentParts = config.db.treatmentParts;
    for (const [alias, dbfile] of Object.entries(treatmentParts)) {
        log.info(`    - attaching '${dbfile}' AS '${alias}'`);
        db.prepare(`ATTACH DATABASE '${dbfile}' AS ${alias}`).run();
    }

    const supporting = config.db.supporting;
    for (const [alias, dbfile] of Object.entries(supporting)) {
        log.info(`    - attaching '${dbfile}' AS '${alias}'`);
        db.prepare(`ATTACH DATABASE '${dbfile}' AS ${alias}`).run();
    }

    // Now, let's prepare the insert statements for use later
    Object.values(dbs).forEach(schema => {
        for (const [obj, def] of Object.entries(schema)) {
            if (obj === 'tables') {
                def.forEach(t => {
                    if (t.insert) {
                        log.info(`    - preparing insert statement for table ${t.name} for later use`);
                        t.preparedinsert = db.prepare(t.insert);
                    }
                })
            }
        }
    })
}

createExplodedDbs();
attachDbs();

export { db, createTriggers }