'use strict';

const config = require('config');
const truebug = config.get('truebug');

const Logger = require('../../utils');
const log = new Logger(truebug.log);

const Database = require('better-sqlite3');
//const db = new Database(config.get('db.main'));
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

        /***** 
         * 'database' is either 'treatments' or 'stats' and 'dbdesc' is an 
         * object of 'tables' and 'indexes' 
         */
        log.info(`preparing database ${database}`);

        for (let [k, v] of Object.entries(dbdesc)) {

            //****** 'k' is an array of either 'tables' or 'indexes' */
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
 * Convert an array of single treatments into 
 * flattened array of arrays of treatment parts 
 * suitable for transaction insert in the db
 */
const repackageTreatment = (treatment) => {
    dbs.treatments.tables.forEach(t => {
        if (truebug.run === 'real') {
            if (t.type === 'normal') {

                //****** note the name of the table is 'treatments' (plural) */
                if (t.name === 'treatments') {
                    t.data.push(treatment.treatment);
                }
                else {
                    try {
                        t.data.push(...treatment[t.name]);
                    }
                    catch (error) {
                        log.error(error);
                        log.error('*****************************');
                        log.error(treatment);
                        log.error('*****************************');
                    }
                }
            }
        }
    })
}

/*
 * Resets the data structure by emptrying it.
 * This is very important as without this step,
 * nodejs will run out of memory and crash.
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
                * Create a transaction function that takes an 
                * array of rows and inserts them in the db 
                * row by row.
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
                db.treatments.prepare(i).run()
            }
            catch(error) {
                log.error(error)
                log.error(i)
            }
        }
    })
}

const selCountOfTreatments = () => db.treatments.prepare('SELECT Count(*) AS c FROM treatments').get().c
const selMaxrowidVtable = (vtable) => db.treatments.prepare(`SELECT Max(rowid) AS c FROM ${vtable}`).get().c

const storeMaxrowid = () => {
    dbs.treatments.tables.forEach(t => {
        if (truebug.run === 'real') {
            if (t.type === 'virtual') {
                const maxrowid = selMaxrowidVtable(t.name) || 0;
                log.info(`storing maxrowid ${maxrowid} of the virtual table ${t.name}`);

                t.maxrowid = maxrowid;
            }
        }
    })
}

const getLastUpdate = () => {
    const s = "SELECT Max(started) AS lastUpdate FROM etlstats WHERE process = 'etl'";
    return db.stats.prepare(s).get().lastUpdate
}

const insertStats = (stats) => {
    log.info(`inserting etl stats`);

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

module.exports = {
    prepareDatabases,
    selCountOfTreatments,
    storeMaxrowid,
    repackageTreatment,
    dropIndexes,
    buildIndexes,
    insertData,
    insertFTS,
    insertStats,
    getDaysSinceLastEtl,
    getLastUpdate
}