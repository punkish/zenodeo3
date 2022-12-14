'use strict';

import * as utils from '../utils.js';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;
const ts = truebug.steps.database;

const logOpts = JSON.parse(JSON.stringify(config.truebug.log));
logOpts.name = 'TRUEBUG:DATABASE';
import { Zlogger } from '@punkish/zlogger';
const log = new Zlogger(logOpts);

import isSea from 'is-sea';

/** 
 * connect to the database
 */
import { db } from '../../../../lib/dbConnect.js';
import { databases } from './dbs/index.js';

/**
 *   Convert an array of single treatments into a
 *   flattened array of arrays of treatment parts 
 *   suitable for transaction insert in the db
 */
const repackageTreatment = (treatment) => {
    const fn = 'repackageTreatment';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    if (truebug.runMode === 'real') {

        /**
         * Object.values(dbs) is [ treatments, treatmentcitations … ]
         */
        const dbs = databases.attached;
        Object.values(dbs).forEach(schema => {

            /**
             * schema is { tables, indexes, triggers }
             */
            const tables = schema.tables;
            tables.forEach(t => {
                if (t.type === 'normal') {

                    /**
                     * note the name of the table is 
                     * 'treatments' (plural) 
                     */ 
                    if (t.name === 'treatments') {
                        t.data.push(treatment.treatment);
                    }
                    else {
                        if (treatment[t.name].length) {
                            t.data.push(...treatment[t.name]);
                        }
                    }
                }
            })
        })
    }
}

/**
 *   Resets the data structure by emptrying it.
 *   This is very important as without this step,
 *   nodejs will run out of memory and crash.
 */
const resetData = () => {
    const fn = 'resetData';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    if (truebug.runMode === 'real') {

        /**
         * Object.values(dbs) is [ treatments, treatmentcitations … ]
         */
        const dbs = databases.attached;
        Object.values(dbs).forEach(schema => {

            /**
             * schema is { tables, indexes, triggers }
             */
            const tables = schema.tables;
            tables.forEach(t => {
                if (t.type === 'normal') {
                    t.data.length = 0;
                }
            })
        })
    }
}

const insertData = () => {
    const fn = 'insertData';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    if (truebug.runMode === 'real') {

        /**
         * Object.values(dbs) is [ treatments, treatmentcitations … ]
         */
        const dbs = databases.attached;
        Object.values(dbs).forEach(schema => {

            /**
             * schema is { tables, indexes, triggers }
             */
            const tables = schema.tables;
            tables.forEach(t => {
                if (t.type === 'normal') {
                    /**
                     * Create a transaction function that 
                     * takes an array of rows and inserts them 
                     * in the db row by row.
                     */
                     const insertMany = db.transaction((rows) => {
                        for (const row of rows) {  
                            try {
                                t.preparedinsert.run(row);
                            }
                            catch(error) {
                                log.error('TABLE');
                                log.error('-'.repeat(50));
                                log.error(t);
                                log.error(t.preparedinsert);
                                log.error(error);
                            }
                        }
                    })
                    
                    insertMany(t.data);
                }
            })
        })
    }
}

const insertFTS = () => {
    const fn = 'insertFTS';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    if (truebug.runMode === 'real') {

        /**
         * Object.values(dbs) is [ treatments, treatmentcitations … ]
         */
        const dbs = databases.attached;
        Object.values(dbs).forEach(schema => {

            /**
             * schema is { tables, indexes, triggers }
             */
            const tables = schema.tables;
            tables.forEach(t => {
                if (t.type === 'virtual') {
                    log.info(`inserting data in virtual table ${t.name}`);
        
                    try {
                        t.preparedinsert.run({maxrowid: t.maxrowid});
                    }
                    catch(error) {
                        log.error(error);
                    }
                }
            })
        })
    }
}

const insertDerived = () => {
    const fn = 'insertDerived';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    if (truebug.runMode === 'real') {

        /**
         * Object.values(dbs) is [ treatments, treatmentcitations … ]
         */
        const dbs = databases.attached;
        Object.values(dbs).forEach(schema => {

            /**
             * schema is { tables, indexes, triggers }
             */
            const tables = schema.tables;
            tables.forEach(t => {
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
            })
        })
    }
}

const dropIndexes = () => {
    const fn = 'dropIndexes';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    log.info('dropping indexes');
    if (truebug.runMode === 'real') {

        /**
         * Object.values(dbs) is [ treatments, treatmentcitations … ]
         */
        const dbs = databases.attached;
        Object.values(dbs).forEach(schema => {

            /**
             * schema is { tables, indexes, triggers }
             */
            const indexes = schema.tables;
            indexes.forEach(i => {
                const ix = i.name.match(/\w+\.ix_\w+/);
                    
                if (ix) {
                    const idx = ix[0];
                    db.prepare(`DROP INDEX IF EXISTS ${idx}`).run();
                }
            })
        })
    }
}

const buildIndexes = () => {
    const fn = 'buildIndexes';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    if (truebug.runMode === 'real') {

        /**
         * Object.values(dbs) is [ treatments, treatmentcitations … ]
         */
        const dbs = databases.attached;
        Object.values(dbs).forEach(schema => {

            /**
             * schema is { tables, indexes, triggers }
             */
            const indexes = schema.tables;
            indexes.forEach(i => {
                log.info(`building index ${i.name}`);
                try {
                    db.prepare(i.create).run();
                }
                catch(error) {
                    console.log(error);
                    console.log(error.stack);
                }
            })
        })
    }
}

const selCountOfTreatments = () => {
    const fn = 'selCountOfTreatments';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    const sql = 'SELECT Count(*) AS c FROM tr.treatments';

    log.info('Getting count of treatments already in the db… ', 'start');
    const num = db.prepare(sql).get().c;
    log.info(`found ${num}\n`, 'end');
    return num;
}

const _selMaxrowidVirtualTable = (table, alias) => {
    const fn = '_selMaxrowidVirtualTable';
    utils.incrementStack(logOpts.name, fn);

    const sql = `SELECT Max(rowid) AS c FROM ${alias}.${table}`;
    return db.prepare(sql).get().c;
}

const getLastUpdate = (typeOfArchive) => {
    const fn = 'getLastUpdate';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    const sql = `SELECT 
    Max(started) AS started,
    datetime(Max(started)/1000, 'unixepoch') AS start, 
    datetime(ended/1000, 'unixepoch') AS end, 
    (ended - started) AS duration,
    datetime(timeOfArchive/1000, 'unixepoch') AS timeOfArchive,
    treatments,
    treatmentCitations,
    materialsCitations,
    figureCitations,
    bibRefCitations
FROM
    etlstats
WHERE
    process = 'etl'
    AND typeOfArchive = ?`;
    return db.prepare(sql).get(typeOfArchive);
}

const insertStats = (stats) => {
    const fn = 'insertStats';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    log.info(`inserting ${stats.process} stats`);

    if (truebug.runMode === 'real') {
        const table = databases.main.z3
            .tables
            .filter(t => t.name === 'etlstats')[0];
            
        db.prepare(table.insert).run(stats);
    }
}

const getDaysSinceLastEtl = () => {
    const fn = 'getDaysSinceLastEtl';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    const s = `SELECT ((strftime('%s','now') - Max(ended)/1000)/3600/24) AS daysSinceLastEtl
    FROM st.etlstats 
    WHERE process = 'etl'`;
    return db.prepare(s).get().daysSinceLastEtl
}

/**
 * queries each table in the db and prints out the 
 * count of rows
 */
const getCounts = () => {
    const fn = 'getCounts';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    const tables = [
        { alias: 'tr', table: 'treatments', count: 0 },
        { alias: 'tr', table: 'ftsTreatments', count: 0 },
        { alias: 'ti', table: 'treatmentimages', count: 0 },
        { alias: 'fc', table: 'figurecitations', count: 0 },
        { alias: 'fc', table: 'ftsFigurecitations', count: 0 },
        { alias: 'mc', table: 'materialscitations', count: 0 },
        { alias: 'mc', table: 'ftsMaterialscitations', count: 0 },
        { alias: 'mc', table: 'rtreeLocations', count: 0 },
        { alias: 'mc', table: 'geopolyLocations', count: 0 },
        { alias: 'bc', table: 'bibrefcitations', count: 0 },
        { alias: 'bc', table: 'ftsBibrefcitations', count: 0 },
        { alias: 'tc', table: 'treatmentcitations', count: 0 },
        { alias: 'ta', table: 'treatmentauthors', count: 0 }
    ]

    tables.forEach(t => {
        try {
            const s = `SELECT Count(*) AS c FROM ${t.alias}.${t.table}`;
            const count = db.prepare(s).get().c;
            t.count = count;
        }
        catch (error) {
            console.log(error);
        }
    })

    console.table(tables);
}

/**
 * prints out updates for full, monthly, weekly and daily archives
 */
const getArchiveUpdates = () => {
    const fn = 'getArchiveUpdates';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

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

        const table = [
            { item: "started",            value: lastUpdate.start },
            { item: "ended",              value: lastUpdate.end },
            { item: "duration",           value: lastUpdate.duration },
            { item: "time of archive",    value: lastUpdate.timeOfArchive },
            { item: "treatments",         value: lastUpdate.treatments },
            { item: "treatmentCitations", value: lastUpdate.treatmentCitations },
            { item: "materialsCitations", value: lastUpdate.materialsCitations },
            { item: "figureCitations",    value: lastUpdate.figureCitations },
            { item: "bibRefCitations",    value: lastUpdate.bibRefCitations }
        ]

        console.log(`archive: ${archive.toUpperCase()}`);
        console.table(table);
    });
}

const updateIsOnLand = () => {
    const fn = 'updateIsOnLand';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    log.info(`updating column isOnLand in table materialsCitations`);

    /*
    | lat/lng             | validGeo | isOnLand |
    |---------------------|----------|----------|
    | lat/lng are empty   | 0        | NULL     |
    | lat/lng are wrong   | 0        | NULL     |
    | lat/lng are correct | 1        | 1 or 0   | <- were updated previously
    | lat/lng are correct | 1        | NULL     | <- need to be updated
    */
    const select = db.prepare(`SELECT 
        id, latitude, longitude, isOnLand 
    FROM 
        mc.materialsCitations 
    WHERE 
        deleted = 0 AND 
        validGeo = 1 AND 
        isOnLand IS NULL`).all();

    const update = db.prepare(`UPDATE 
        mc.materialsCitations 
    SET 
        isOnLand = @isOnLand 
    WHERE id = @id`);

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
    repackageTreatment,
    insertData,
    resetData,
    insertFTS,
    insertDerived,
    dropIndexes,
    buildIndexes,
    selCountOfTreatments,
    getLastUpdate,
    insertStats,
    getDaysSinceLastEtl,
    getCounts,
    getArchiveUpdates,
    updateIsOnLand
}