'use strict';

import fs from 'fs';
import path from 'path';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;

import Database from 'better-sqlite3';
import { databases } from '../bin/truebug/lib/database/dbs/index.js';

const logOpts = JSON.parse(JSON.stringify(config.truebug.log));
logOpts.name = 'DBCONNECT';
logOpts.level = 'info';
import { Zlogger } from '@punkish/zlogger';
const log = new Zlogger(logOpts);

const createDbs = () => {

    /**
     * dbtype is "main" or "attached"
     */
    for (let [ dbtype, dbs ] of Object.entries(databases)) {
        const tgt = Object.keys(dbs).length > 1 
            ? 'databases' 
            : 'database';

        log.info(`Creating ${dbtype} ${tgt}`);

        for (let [ alias, schema ] of Object.entries(dbs)) {
            const dbfile = config.db[dbtype][alias];
            const dbfilePath = dbfile.split('/').slice(-2).join('/');
            log.info(`  - database './${dbfilePath}' with alias '${alias}'`);

            // if db doesn't exist, it will be created
            const db = new Database(dbfile);

            // now we create all the tables if they don't exist
            for (let [ dbcomp, ddl ] of Object.entries(schema)) {
                if (dbcomp === 'tables') {
                    ddl.forEach(t => {
                        log.info(`    - creating table '${t.name}'`);
                        db.prepare(t.create).run();
                    });
                }
            }
        }
    }

    log.info('all databases created\n');    
}

const createTriggers = (db) => {
    log.info(`Creating triggers`);

    Object.values(databases).forEach(dbs => {
        Object.values(dbs).forEach(schema => {
            for (let [ dbcomp, ddl ] of Object.entries(schema)) {
                if (dbcomp === 'triggers') {
                    ddl.forEach(t => {
                        log.info(`    - creating trigger ${t.name}`);
                        db.prepare(t.create).run();
                    });
                }
            }
        })
    })

    log.info('all triggers are ready\n');
}

/** 
 * ATTACH external databases
 * 
 * https://github.com/JoshuaWise/better-sqlite3/issues/102#issuecomment-369468174
 */
const attachDbs = (db) => {
    log.info('Now attaching databases');

    const databases = config.db.attached;
    Object.keys(databases).forEach(alias => {
        const dbfile = config.db.attached[alias];
        const p = dbfile.split('/').slice(-2).join('/');
        log.info(`  - attaching './${p}' AS '${alias}'`);
        db.prepare(`ATTACH DATABASE '${dbfile}' AS ${alias}`).run();
    })

    log.info('all external databases are attached\n');
}

// Now, let's prepare the insert statements for use later
const createInserts = (db) => {
    log.info('Preparing insert statements for future use');

    Object.values(databases).forEach(dbs => {
        Object.values(dbs).forEach(schema => {
            for (let [ dbcomp, ddl ] of Object.entries(schema)) {
                if (dbcomp === 'tables') {
                    ddl.forEach(t => {
                        if (t.insert) {
                            log.info(`  - inserts for table '${t.name}'`);
                            //t.preparedinsert = db.prepare(t.insert);
                        }
                    });
                }
            }
        })
    })

    log.info('all insert statements are prepared\n');
}

const initDb = () => {
    createDbs();

    /** 
     * Now, prepare the master db connection, set a couple of 
     * pragmas to speed up operation, a pragma to turn on FKs,
     * and return the connection
     */
    const dbfile = config.db.main.z3;
    const db = new Database(dbfile);
    db.pragma('synchronous = OFF');
    //db.pragma('journal_mode = MEMORY');
    db.pragma('journal_mode = WAL');
    db.prepare('PRAGMA foreign_keys = ON').run();

    attachDbs(db);
    createTriggers(db);
    //createInserts(db);
    return db;
}

const db = initDb();

export { db, createTriggers }