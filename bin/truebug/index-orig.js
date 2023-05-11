'use strict';

import process from 'node:process';
import util from 'util';
import minimist from 'minimist';
import fs from 'fs';

import * as preflight from './lib/preflight.js';
import * as postflight from './lib/postflight.js';
import * as download from './lib/download.js';
import * as database from './lib/database/index.js';
import * as parse from './lib/parse.js';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;
const ts = truebug.steps.database;

import * as utils from './lib/utils.js';

const logOpts = JSON.parse(JSON.stringify(truebug.log));
logOpts.name = 'TB           ';
import { Zlogger } from '@punkish/zlogger';
const log = new Zlogger(logOpts);

const stats = {
    archives: {
        typeOfArchive: '',
        timeOfArchive: 0,
        sizeOfArchive: 0
    },
    downloads: {
        started: 0,
        ended: 0
    },
    unzip: {
        started: 0,
        ended: 0,
        numOfFiles: 0
    },
    etl: {
        started: 0,
        ended: 0,
        treatments: 0,
        treatmentCitations: 0,
        materialCitations: 0,
        collectionCodes: 0,
        figureCitations: 0,
        bibRefCitations: 0,
        treatmentAuthors: 0,
        journals: 0
    }
};

const calcRows = (stats) => {
    const rowsInserted = Object.keys(stats.etl)
        .filter(key => key !== 'started' && key !== 'ended')
        .map(key => stats.etl[key])
        .reduce((a, b) => a + b);

    return rowsInserted;
}

const processFiles = (archive_name, files, stats) => {
    utils.incrementStack(logOpts.name, 'processFiles');

    //
    // If totalFiles is less than ${defaultBatch} then we insert 1/10th of 
    // totalFiles at a time. This is the ${batch}. But if totalFiles is 
    // more than ${defaultBatch}, we insert ${defaultBatch} files at a time.
    //const totalFiles = files.length;
    const totalFiles = 50005;
    const strTotalFilesLen = String(totalFiles).length;
    const defaultBatch = 5000;
    const batch = totalFiles < defaultBatch 
        ? Math.floor(totalFiles / 10) 
        : defaultBatch;
    
    // We print a progress dot on the console every 1/10th of the ${batch}
    const dot = batch / 10;

    log.info(`parsing/inserting ${totalFiles} XMLs ${batch} at a time`);
    log.info(`${'~'.repeat(120)}\n`, 'end');

    //
    // we time the process using hrtime.bigint() which returns 
    // time in nanoseconds

    // when the ETL process started
    let startETLTime = process.hrtime.bigint();

    // when this batch transaction started. This includes reading and parsing 
    // the files and inserting the rows
    let startTransactionTime = startETLTime;

    // stores when the actual db insert started
    let startInsertTime = 0;

    const treatments = [];

    for (let i = 0; i < totalFiles; i++) {
        const xml = files[i];
        const treatment = parse.parseOne(archive_name, xml);

        if (treatment) {
            parse.calcStats(treatment, stats);
            treatments.push(treatment);
            
            if (i > 0) {
                
                // last file
                if (i === (totalFiles - 1)) {

                    // initialize db insert time
                    startInsertTime = process.hrtime.bigint();
                    database.insertTreatments(treatments);
                    database.insertTreatmentJSON(treatmentJSON);
                    
                    const str = utils.progressBar({ 
                        startETLTime,
                        startTransactionTime, 
                        startInsertTime,
                        i, 
                        strTotalFilesLen, 
                        batch,
                        rowsInserted: calcRows(stats)
                    });

                    treatments.length = 0;

                    // finished processing all files
                    log.info(`${str}\n`, 'end');
                }

                // every ${batch} files
                else if ((i % batch) === 0) {
                    startInsertTime = process.hrtime.bigint();
                    database.insertTreatments(treatments);

                    const str = utils.progressBar({ 
                        startETLTime,
                        startTransactionTime, 
                        startInsertTime,
                        i, 
                        strTotalFilesLen, 
                        batch,
                        rowsInserted: calcRows(stats)
                    });

                    treatments.length = 0;

                    // reset time counters
                    startTransactionTime = process.hrtime.bigint();

                    log.info(str, 'end');
                }

                // print a dot every batch/10 files
                else if ((i % dot) === 0) {
                    log.info('.', 'end');
                }
            }
            
            postflight.cpFile(archive_name, xml);
            postflight.rmFile(archive_name, xml);
        }
    }

    log.info(`${'~'.repeat(120)}\n`, 'end');
};

const etl = (archive_name, files, stats) => {
    utils.incrementStack(logOpts.name, 'etl');

    const [ typeOfArchive, timeOfArchive ] = archive_name.split('.');
    log.info(`ETL-ing ${typeOfArchive}`);

    // 
    // start ETL
    stats.etl.started = new Date().getTime();

    if (stats.unzip.numOfFiles) {
        log.info(`${files.length} files exist in dump… let's ETL them`);

        processFiles(archive_name, files, stats);
        
        log.info(`parsed ${stats.etl.treatments} XMLs`);
        stats.etl.journals = database.cache.journalIds.size;
        stats.etl.ended = new Date().getTime();
    }
    else {
        log.info('there are no files in the dump to process');
    }

    // Object.keys(stats).
    //     forEach(key => {
    //         const row = stats[key];
    //         database.insertStats(row);
    //     });
}

const update = async (archives, stats, firstRun = false) => {
    utils.incrementStack(logOpts.name, 'update');
    
    //
    // we grab the first in the list of archives
    // one of 'yearly', 'monthly', 'weekly', or 'daily'
    const typeOfArchive = archives.shift();

    if (!firstRun) {
        if (typeOfArchive === 'yearly') {
            firstRun = true;
        }
    }

    stats.archives.type = typeOfArchive;

    //
    // if needed, download archive from remote server
    const archive_name = await download.download(typeOfArchive, stats);

    if (archive_name) {
        database.dropIndexes();

        //
        // unzip archive, if needed, and read the files into an array
        const files = download.unzip(archive_name, stats);
        etl(archive_name, files, stats);
        database.insertStats(stats);

        if (archives.length) {
            log.info(`next up, the "${archives[0].toUpperCase()}" archive`);
            return update(archives, stats, firstRun);
        }
        else {
            log.info('all archives processed');
        }

    }
    else {
        log.info(`There is no "${typeOfArchive}" archive on the server. Wrapping up.`);
    }

    if (firstRun) {
        database.insertVtabs();
    }

    database.buildIndexes();
    
    const utilOpts = { showHidden: false, depth: null, color: true };
    console.log(util.inspect(stats, utilOpts));

    //if (ts.printStack) {
        log.info('STACK');
        log.info('-'.repeat(80));
        log.info(JSON.stringify(utils.stack, null, 4));
    //}
}

/*
archive                   size          datetime                           notes
------------------------- ------------- ---------------------------------- -------------------------
plazi.zenodeo.zip	      2548608 kb	Sat, 01 Jan 2022 02:00:00 GMT+0000
plazi.zenodeo.monthly.zip 1536275 kb	Sun, 02 Oct 2022 02:00:00 GMT+0000 updates since yearly
plazi.zenodeo.weekly.zip    74739 kb	Sun, 30 Oct 2022 02:00:00 GMT+0000 updates since monthly.zip
plazi.zenodeo.daily.zip	   	 4096 kb	Fri, 04 Nov 2022 02:00:00 GMT+0000 updates since weekly.zip

remote                      local                                   unpacked
=========================   =====================================   ============
plazi.zenodeo.zip           plazi.zenodeo.yearly.<timestamp>.zip    dir/yearly/
plazi.zenodeo.monthly.zip   plazi.zenodeo.monthly.<timestamp>.zip   dir/monthly/
plazi.zenodeo.weekly.zip    plazi.zenodeo.weekly.<timestamp>.zip    dir/weekly/
plazi.zenodeo.daily.zip     plazi.zenodeo.daily.<timestamp>.zip     dir/daily/


if no data in table
    process 'yearly', 'monthly', 'weekly', 'daily'
else
    if last archive processed is 'yearly'
        if 'yearly' archive on server is newer than local
            process 'yearly', 'monthly', 'weekly', 'daily'
        else
            process 'monthly', 'weekly', 'daily'
    else if last archive processed is 'monthly'
        if 'monthly' archive on server is newer than local
            process 'monthly', 'weekly', 'daily'
        else
            process 'weekly', 'daily'
    else if last archive processed is 'weekly'
        if 'weekly' archive on server is newer than local
            process 'weekly', 'daily'
        else
            process 'daily'
    else if last archive processed is 'daily'
        if 'daily' archive on server is newer than local
            process 'daily'
        else
            done
    else
        done
*/

/** 
 * `truebug` starts here
 */
const init = (stats) => {
    utils.incrementStack(logOpts.name, 'init');

    const argv = minimist(process.argv.slice(2));
    
    if (argv.help) {
        const prompt = fs.readFileSync('./bin/truebug/lib/prompt.txt', 'utf8');
        console.log(prompt);
        return;
    }
    
    //
    // query the tables and return current counts
    if (argv.run === 'counts') {
        database.getCounts();
    }

    //
    // query the tables and return the details of each 
    // kind of archive update
    else if (argv.run === 'archiveUpdates') {
        database.getArchiveUpdates();
    }
    
    //
    // run etl
    else if (argv.run === 'etl' || typeof(argv.run) === 'undefined') {
        const runMode = argv.runMode || truebug.runMode;
        const source = argv.source || truebug.source;
        
        log.info('='.repeat(80));
        log.info(`STARTING TRUEBUG (runMode: ${runMode})`);

        if (source === 'xml') {
            const single = argv.xml || truebug.archives.xml;
            const xml = `${single}.xml`;
            const typeOfArchive = 'xmls';
            preflight.checkDir(typeOfArchive, true);
            preflight.copyXmlToDump(typeOfArchive, xml);

            const treatment = parse.parseOne(typeOfArchive, xml);
        
            //
            // deep print object to the console
            //
            // https://stackoverflow.com/a/10729284/183692
            const utilOpts = { showHidden: false, depth: null, color: true };
            console.log(util.inspect(treatment, utilOpts));
        }
        else {
            preflight.checkDir('archive');
            preflight.checkDir('dumps');
            preflight.backupOldDB();

            //
            // This is the first time we are running update, so
            // let's see if there are any treatments already in 
            // the db
            const numOfTreatments = database.selCountOfTreatments();
            let archives;

            if (numOfTreatments) {
                
                //
                // There are treatments in the db already. So we need
                // to determine the type of archive and timestamp of
                // archive that should be processed
                archives = utils.determinePeriodAndTimestamp();
            }
            else {
                log.info('-'.repeat(80));
                log.info('since there are no treatments in the db, we will start with a "YEARLY" archive');
                archives = [
                    'yearly', 
                    //'monthly', 
                    //'weekly', 
                    //'daily'
                ];
            }

            update(archives, stats);

            // let took = 0;
            // let mspf = 0;
            // let fps = 0;
        
            // if (stats.download.numOfFiles) {
            //     took = stats.etl.ended - stats.etl.started;
            //     mspf = (took / stats.etl.treatments).toFixed(2);
            //     fps = (stats.etl.treatments * 1000 / took).toFixed(2);
            // }

            // log.info('='.repeat(80));

            // if (ts.printStats) {
            //     console.log(util.inspect(stats, false, null, true));
            // }

            

            // log.info('-'.repeat(80));
            // log.info(`ETL took: ${took} ms = (${mspf} ms/XML or ${fps} XMLs/s)`);
            // log.info('TRUEBUG DONE');
            // log.info('='.repeat(80));
        }
    }
}

init(stats);

/*
etl                     	                 3
treatments             	               748,804
treatmentsFts           	           748,804
collectionCodes          	            17,845
treatments_x_collectionCodes    	   385,309
materialCitations_x_collectionCodes    944,118
journals              	                   777
journals_x_year                          2,052
bibRefCitations                      3,202,798
bibRefCitationsFts                   3,202,798
figureCitations                      1,997,412
figureCitationsFts                   1,997,412
materialCitations                    1,330,672
materialCitationsFts                 1,330,672
treatmentCitations                     632,052
treatmentAuthors                     2,707,766
==============================================
	                                19,249,294

                                    71909s	267.689635511549 rows/s
*/