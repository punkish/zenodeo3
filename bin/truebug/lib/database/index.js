'use strict';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;

const truebug = config.truebug;
import { Zlogger } from '@punkish/zlogger';
const logOpts = JSON.parse(JSON.stringify(config.truebug.log));
logOpts.name = 'TRUEBUG:DATABASE';
const log = new Zlogger(logOpts);

import isSea from 'is-sea';

import Database from 'better-sqlite3';
const db = {
    treatments: new Database(config.db.treatments),
    stats: new Database(config.db.stats)
};
import { dbs } from './dbs/index.js';

const setPragmas = () => {
    db.treatments.pragma('synchronous = OFF');
    db.treatments.pragma('journal_mode = MEMORY');
}

const prepareDatabases = () => {
    setPragmas();

    for (let [database, dbdesc] of Object.entries(dbs)) {

        /**
         *   'database' is either 'treatments' or 'stats' and 
         *   'dbdesc' is an object of 'tables' and 'indexes' 
         */
        log.info(`preparing database ${database}`);

        for (let [k, v] of Object.entries(dbdesc)) {

            /**
             * 'k' is an array of either 'tables' or 'indexes'
             */
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

/**
*   Convert an array of single treatments into a
*   flattened array of arrays of treatment parts 
*   suitable for transaction insert in the db
*/
const repackageTreatment = (treatment) => {
    dbs.treatments.tables.forEach(t => {
        if (truebug.run === 'real') {
            if (t.type === 'normal') {

                /**
                 * note the name of the table is 'treatments' (plural) 
                 */ 
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

/**
 *   Resets the data structure by emptrying it.
 *   This is very important as without this step,
 *   nodejs will run out of memory and crash.
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

                /**
                 *   Create a transaction function that takes an 
                 *   array of rows and inserts them in the db 
                 *   row by row.
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
    //const s = `SELECT Max(started) AS lastUpdate FROM etlstats WHERE process = 'etl' AND typeOfArchive = '${typeOfArchive}'`;
    const s = `SELECT 
    Max(started) AS started,
    datetime(Max(started)/1000, 'unixepoch') AS start, 
    datetime(ended/1000, 'unixepoch') AS end, 
    (ended - started) AS duration,
    datetime(timeOfArchive/1000, 'unixepoch') AS timeOfArchive, 
    "result"
FROM
    etlstats
WHERE
    process = 'etl'
    AND typeOfArchive = ?;`
    return db.stats.prepare(s).get(typeOfArchive);
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

/**
 * queries each table in the db and prints out the 
 * count of rows
**/
const getCounts = () => {
    const tables = [
        { table: 'treatments', count: 0 },
        { table: 'treatmentimages', count: 0 },
        { table: 'figurecitations', count: 0 },
        { table: 'materialscitations', count: 0 },
        { table: 'bibrefcitations', count: 0 },
        { table: 'treatmentcitations', count: 0 },
        { table: 'treatmentauthors', count: 0 }
    ]

    tables.forEach(t => {
        const s = `SELECT Count(*) AS c FROM ${t.table}`;
        const count = db.treatments.prepare(s).get().c;
        t.count = count;
    })

    console.table(tables);
}

/**
 * prints out updates for full, monthly, weekly and daily archives
**/
const getArchiveUpdates = () => {
    const typesOfArchives = { 
        'full': 0,
        'monthly': 0,
        'weekly': 0,
        'daily': 0
    };
    
    // https://stackoverflow.com/a/9763769/183692
    const msToTime = (s) => {
    
        // Pad to 2 or 3 digits, default is 2
        function pad(n, z) {
            z = z || 2;
            return ('00' + n).slice(-z);
        }
    
        const ms = s % 1000;
    
        s = (s - ms) / 1000;
        const ss = s % 60;
    
        s = (s - ss) / 60;
        const mm = s % 60;
    
        const hh = (s - mm) / 60;
      
        return `${pad(hh)}h ${pad(mm)}m ${pad(ss)}s ${pad(ms, 3)}ms`;
    }
    
    Object.keys(typesOfArchives).forEach(archive => {
        const lastUpdate = getLastUpdate(archive);
        lastUpdate.duration = msToTime(lastUpdate.duration);
        const result = JSON.parse(lastUpdate.result);

        const table = [
            { item: "started",            value: lastUpdate.start},
            { item: "ended",              value: lastUpdate.end},
            { item: "duration",           value: lastUpdate.duration},
            { item: "time of archive",    value: lastUpdate.timeOfArchive},
            { item: "treatments",         value: result.treatments},
            { item: "treatmentCitations", value: result.treatmentCitations},
            { item: "materialsCitations", value: result.materialsCitations},
            { item: "figureCitations",    value: result.figureCitations},
            { item: "bibRefCitations",    value: result.bibRefCitations}
        ]

        console.log(`archive: ${archive.toUpperCase()}`);
        console.table(table);
    });
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
    updateIsOnLand,
    getCounts,
    getArchiveUpdates
}