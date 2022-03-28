'use strict';

// The following two lines make "require" available
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// const config = require('config');
import config from 'config';
const truebug = config.get('truebug');

// const Logger = require('../../utils');
// const log = new Logger(truebug.log);
import { Zlogger } from '@punkish/zlogger';
const logOpts = JSON.parse(JSON.stringify(config.get('truebug.log')));
logOpts.name  = 'TRUEBUG:DATABASE';
const log     = new Zlogger(logOpts);

const isSea = require('is-sea');
const Database = require('better-sqlite3');

const db = {
    treatments: new Database(config.get('db.treatments')),
    stats: new Database(config.get('db.stats')),
}

const dbs = require('./dbs');

const setPragmas = () => {
    db.treatments.pragma('synchronous = OFF');
    db.treatments.pragma('journal_mode = MEMORY');
}

const prepareDatabases = () => {
    setPragmas();

    for (let [database, dbdesc] of Object.entries(dbs)) {

        /*
            'database' is either 'treatments' or 'stats' and 
            'dbdesc' is an object of 'tables' and 'indexes' 
        */
        log.info(`preparing database ${database}`);

        for (let [k, v] of Object.entries(dbdesc)) {

            //'k' is an array of either 'tables' or 'indexes'
            if (k === 'tables') {
                log.info('creating tables and preparing insert statements')

                v.forEach(t => {
                    log.info(`  - ${database}.${t.name}`);

                    if (truebug.run === 'real') {
                        db[database].prepare(t.create).run();
    
                        if (t.insert) {
                            t.preparedinsert = db[database].prepare(t.insert);
                        }
                    }
                    
                })
            }
        }
    }
}

/*
    Convert an array of single treatments into 
    flattened array of arrays of treatment parts 
    suitable for transaction insert in the db
*/
const repackageTreatment = (treatment) => {
    dbs.treatments.tables.forEach(t => {
        if (truebug.run === 'real') {
            if (t.type === 'normal') {

                // note the name of the table is 'treatments' (plural)
                if (t.name === 'treatments') {
                    t.data.push(treatment.treatment);
                }
                else {
                    try {
                        t.data.push(...treatment[t.name]);
                    }
                    catch (error) {
                        log.error(error);
                        log.error(treatment);
                    }
                }
            }
        }
    })
}

/*
    Resets the data structure by emptrying it.
    This is very important as without this step,
    nodejs will run out of memory and crash.
*/
const resetData = () => {
    dbs.treatments.tables.forEach(t => {
        if (truebug.run === 'real') {
            if (t.type === 'normal') {
                t.data.length = 0;
            }
        }
    })
}

const insertData = () => {
    dbs.treatments.tables.forEach(t => {
        if (truebug.run === 'real') {
            if (t.type === 'normal') {

                /*
                    Create a transaction function that takes an 
                    array of rows and inserts them in the db 
                    row by row.
                */
                const insertMany = db.treatments.transaction((rows) => {
                    for (const row of rows) {  
                        try {
                            t.preparedinsert.run(row);
                        }
                        catch(error) {
                            log.error(error);
                            log.info(`table ${t.name}`);
                            log.info(`row: ${JSON.stringify(row)}`);
                        }
                    }
                })
                
                insertMany(t.data);
            }
        }
    })

    resetData();
}

const insertFTS = () => {
    dbs.treatments.tables.forEach(t => {
        if (truebug.run === 'real') {
            if (t.type === 'virtual') {
                log.info(`inserting data in virtual table ${t.name}`);

                try {
                    t.preparedinsert.run({maxrowid: t.maxrowid});
                }
                catch(error) {
                    log.error(error);
                }
            }
        }
    })
}

const insertDerived = () => {
    dbs.treatments.tables.forEach(t => {
        if (truebug.run === 'real') {
            if (t.type === 'derived') {
                log.info(`inserting data in derived table ${t.name}`);

                try {
                    //t.preparedinsert.run({maxrowid: t.maxrowid});
                    t.preparedinsert.run();
                }
                catch(error) {
                    log.error(error);
                }
            }
        }
    })
}

const dropIndexes = () => {
    log.info('dropping indexes');

    dbs.treatments.indexes.forEach(i => {
        if (truebug.run === 'real') {
            const ix = i.match(/\w+\.ix_\w+/);
            let idx;
            if (ix) idx = ix[0];
            db.treatments.prepare(`DROP INDEX IF EXISTS ${idx}`).run();
        }
    })
}

const buildIndexes = () => {
    log.info('building indexes');

    dbs.treatments.indexes.forEach(i => {
        if (truebug.run === 'real') {
            try {
                db.treatments.prepare(i).run();
            }
            catch(error) {
                log.error(error);
                log.error(i);
            }
        }
    })
}

const selCountOfTreatments = () => db.treatments.prepare('SELECT Count(*) AS c FROM treatments').get().c;

const selMaxrowidVirtualTable = (table) => db.treatments.prepare(`SELECT Max(rowid) AS c FROM ${table}`).get().c;

//const selMaxrowidDerivedTable = (table) => db.treatments.prepare(`SELECT Max(figureCitationRowid) AS c FROM ${table}`).get().c;

const storeMaxrowid = () => {
    dbs.treatments.tables.forEach(t => {
        if (truebug.run === 'real') {
            if (t.type === 'virtual') {
                const maxrowid = selMaxrowidVirtualTable(t.name) || 0;
                log.info(`storing maxrowid ${maxrowid} of the virtual table ${t.name}`);

                t.maxrowid = maxrowid;
            }
            // else if (t.type === 'derived') {
            //     const maxrowid = selMaxrowidDerivedTable(t.name) || 0;
            //     log.info(`storing maxrowid ${maxrowid} of the derived table ${t.name}`);

            //     t.maxrowid = maxrowid;
            // }
        }
    })
}

const getLastUpdate = (typeOfArchive) => {
    const s = `SELECT Max(started) AS lastUpdate FROM etlstats WHERE process = 'etl' AND typeOfArchive = '${typeOfArchive}'`;
    return db.stats.prepare(s).get().lastUpdate;
}

const insertStats = (stats) => {
    log.info(`inserting ${stats.process} stats`);

    if (truebug.run === 'real') {
        db.stats.prepare(dbs.stats.tables[0].insert).run(stats);
    }
}

const getDaysSinceLastEtl = () => {
    const s = `SELECT ((strftime('%s','now') - Max(ended)/1000)/3600/24) AS daysSinceLastEtl
    FROM etlstats 
    WHERE process = 'etl'`;
    return db.stats.prepare(s).get().daysSinceLastEtl
}

const updateIsOnLand = () => {
    log.info(`updating column isOnLand in table materialsCitations`);

    /*
    | lat/lng             | validGeo | isOnLand |
    |---------------------|----------|----------|
    | lat/lng are empty   | 0        | NULL     |
    | lat/lng are wrong   | 0        | NULL     |
    | lat/lng are correct | 1        | 1 or 0   | <- were updated previously
    | lat/lng are correct | 1        | NULL     | <- need to be updated
    */
    const select = db.treatments.prepare('SELECT id, latitude, longitude, isOnLand FROM materialsCitations WHERE deleted = 0 AND validGeo = 1 AND isOnLand IS NULL').all();
    const update = db.treatments.prepare('UPDATE materialsCitations SET isOnLand = @isOnLand WHERE id = @id');

    let count = 0;

    for (const rec of select) {

        // default params
        const params = {id: rec.id};

        if (isSea(rec.latitude, rec.longitude)) {

            // point is in sea so set isOnLand to 0
            params.isOnLand = 0;
        }
        else {
            params.isOnLand = 1;
            count++;
        }
        
        update.run(params);
    }

    log.info(`updated ${count} rows as being on land`);
}

export {
    prepareDatabases,
    selCountOfTreatments,
    storeMaxrowid,
    repackageTreatment,
    dropIndexes,
    buildIndexes,
    insertData,
    insertFTS,
    insertDerived,
    insertStats,
    getDaysSinceLastEtl,
    getLastUpdate,
    updateIsOnLand
}