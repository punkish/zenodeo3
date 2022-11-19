'use strict';

import process from 'node:process';
import { hrtime } from 'process';
import minimist from 'minimist';
import * as preflight from './lib/preflight.js';
import * as postflight from './lib/postflight.js';
import * as download from './lib/download.js';
import * as database from './lib/database/index.js';
import * as parse from './lib/parse.js';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;

import * as utils from './lib/utils.js';

const logOpts = JSON.parse(JSON.stringify(truebug.log));
logOpts.name = 'TRUEBUG';
import { Zlogger } from '@punkish/zlogger';
const log = new Zlogger(logOpts);

const fmtProgress = ({ startTime, i, strTotalFilesLen, batch }) => {

    // calculate time taken in ms (endTime - startTime)
    const took = Number(hrtime.bigint() - startTime) / 1e6;

    let str = ` ${String(i).padStart(strTotalFilesLen, ' ')}`;
    str += ` [${took.toFixed(0)} ms]`;
    str += ` = (${(took / batch).toFixed(2)} ms/file)\n`;

    return str;
}

const processFiles = (typeOfArchive, files) => {
    utils.incrementStack(logOpts.name, 'processFiles');

    /**
     * 
     * update the progress bar every x% of the total num of files
     * but x% of j should not be more than 5000 because we don't 
     * want to insert more than 5K records at a time.
     * 
     */
    const totalFiles = files.length;
    const strTotalFilesLen = String(totalFiles).length;
    const defaultBatch = 5000;
    const batch = totalFiles < defaultBatch 
        ? Math.floor(totalFiles / 10) 
        : defaultBatch;
    
    const dot = batch / 10;

    log.info(`parsing/inserting ${totalFiles} treatments ${batch} at a time`);
    log.info(`${'~'.repeat(80)}\n`, 'end');

    /**
     * we time the process using hrtime.bigint() which returns 
     * time in nanoseconds
     */
    let startTime;

    for (let i = 0; i < totalFiles; i++) {
        const xml = files[i];

        /**
         * we store a single treatment in one variable and then
         * send it for repackaging into exploded treatment parts
         * so they can be inserted 5000 at a time in a db 
         * transaction
         */
        const treatment = parse.parseOne(typeOfArchive, xml);

        if (treatment) {
            parse.calcStats(treatment);
            database.repackageTreatment(treatment);

            if (i === 0) {
                startTime = hrtime.bigint();
                log.info('.', 'end');
            }
            else {
                if (i % batch) {
                    if (i === (totalFiles - 1)) {

                        /** 
                         * the last remaining files 
                         */
                        database.insertData();
                        database.resetData();

                        const progressInfo = {
                            startTime, 
                            i, 
                            strTotalFilesLen, 
                            batch
                        }

                        const str = fmtProgress(progressInfo);

                        // finished processing all files
                        log.info(`${str}\n`, 'end');
                    }
                }

                // i hits the batch because (i % batch === 0)
                else {
                    database.insertData();
                    database.resetData();

                    const progressInfo = {
                        startTime, 
                        i, 
                        strTotalFilesLen, 
                        batch
                    }

                    const str = fmtProgress(progressInfo);

                    log.info(str, 'end');

                    // reset startTime
                    startTime = hrtime.bigint();
                }

                // print a '.' every batch/10 files (usually every 500 files)
                if ((i % dot) === 0) {
                    log.info('.', 'end');
                }
            }
            
            postflight.cpFile(typeOfArchive, xml);
            postflight.rmFile(typeOfArchive, xml);
        }
    }

    log.info(`${'~'.repeat(80)}\n`, 'end');
}

const etl = (typeOfArchive, remoteArchive) => {
    utils.incrementStack(logOpts.name, 'etl');

    const { timeOfArchive, sizeOfArchive } = remoteArchive;

    log.info(`starting a ${typeOfArchive.toUpperCase()} process`);

    const stats = [
        {
            started: new Date().getTime(),
            process: 'download',
            timeOfArchive,
            typeOfArchive,
            sizeOfArchive,
            treatments: null,
            treatmentCitations: null,
            materialsCitations: null,
            figureCitations: null,
            bibRefCitations: null
        }
    ];

    /** 
     * create appropriate dump directory, if required
     */
    preflight.checkDir(typeOfArchive);

    /** 
     * start download
     */
    download.download(typeOfArchive);
    
    //stats[0].numOfFiles = download.unzip(typeOfArchive);
    stats[0].numOfFiles = 1;
    stats[0].ended = new Date().getTime();

    log.info('-'.repeat(80));
    log.info(`DOWNLOAD took: ${stats[0].ended - stats[0].started} ms`);

    /** 
     * start ETL
     */
    if (stats[0].numOfFiles) {
        const files = preflight.filesExistInDump(typeOfArchive);
        log.info(`${files.length} files exist in dump… let's ETL them`);

        stats[1] = {
            started: new Date().getTime(),
            process: 'etl',
            timeOfArchive,
            typeOfArchive,
            sizeOfArchive,
            numOfFiles: null
        }

        processFiles(typeOfArchive, files);
        
        log.info(`parsed ${parse.stats.treatments} files with`);

        for (const [key, value] of Object.entries(parse.stats)) {
            log.info(`- ${value} ${key}`);
            stats[1][key] = value;
        }

        stats[1].ended = new Date().getTime();
    }
    else {
        log.info('there are no files in the dump to process');
    }

    stats.forEach(row => database.insertStats(row));

    log.info('-'.repeat(80));
    const took = stats[1].ended - stats[1].started;
    const mspf = took / stats[0].numOfFiles;
    log.info(`ETL took: ${took} ms = (${mspf} ms/file)`);
    log.info('TRUEBUG DONE');
}

const update = async (typeOfArchives, fullFlag = false) => {
    if (!fullFlag) {
        fullFlag = typeOfArchives.includes('full')
            ? true
            : false;
    }
    
    utils.incrementStack(logOpts.name, 'update');

    const typeOfArchive = typeOfArchives.shift();

    log.info(`checking if ${typeOfArchive} archive exists on remote server`);
    const remoteArchive = await download.checkRemote(typeOfArchive);
    
    if (remoteArchive.timeOfArchive) {

        database.storeMaxrowid();
        database.dropIndexes();

        const lastUpdate = database.getLastUpdate(typeOfArchive);
        
        if (lastUpdate.started) {

            /** 
             * the remote archive is newer than the archive of the 
             * last update
             */
            if (remoteArchive.timeOfArchive > lastUpdate.started) {
                etl(typeOfArchive, remoteArchive);
            }
            else {
                log.info(`remote ${typeOfArchive} archive is older than the local version… moving on`);
            }
        }
        else {
            log.info(`${typeOfArchive} archive has not been processed yet`);
            etl(typeOfArchive, remoteArchive);
        }

        /** 
         * check the next shorter timePeriod
         */
        if (typeOfArchives.length) {
            update(typeOfArchives, fullFlag);
        }

        if (fullFlag) {
            database.insertFTS();
            database.insertDerived();
            database.updateIsOnLand();
        }
        
        database.buildIndexes();
        database.createTriggers();
    }
    else {
        log.info(`${typeOfArchive} archive doesn't exist`);
        log.info('EXITING TRUEBUG');
    }

    log.info('='.repeat(80));
    log.info('S T A C K');
    log.info('-'.repeat(80));
    console.log(JSON.stringify(utils.stack, null, 4));
}

/** 
 * `truebug` starts here
 */
const init = () => {
    utils.incrementStack(logOpts.name, 'init');

    const argv = minimist(process.argv.slice(2));
    
    if (argv.help) {
        console.log(`
truebug USAGE:
${'*'.repeat(79)}

node bin/truebug/index.js
    --run=[ counts | archiveUpdates | etl ]
    --runMode=[ dry-run | real ]
    --source=[ archive | xml ]

Note 1: 
- *all* options expect --run are optional.
- if no options are provided, usage is printed in the terminal.
- options not provided are picked up from config.
- [choices] are choose-one-from-the-list.

EXAMPLES
${'*'.repeat(79)}

index.js --run=counts                   // get count of rows in each table in 
                                        //     the db
index.js --run=archiveUpdates           // get updates for each kind of archive
${'-'.repeat(79)}
Note 2: No other options are required for the above two invocations
${'-'.repeat(79)}

index.js --run=etl                      // perform the ETL

Note 3: Additional options are as below, and may be provided on command line 
or, if not, they will be picked up from the config settings

index.js --run=etl --runMode=dry-run    // do a dry run without changing
                                        //     anything

index.js --run=etl --runMode=real       // make permanent changes
index.js --run=etl --source=archive     // use archives
index.js --run=etl --source=xml         // use a single XML as a source 
                                        //     (for testing)`);
        return;
    }
    
    /**
     * query the tables and return current counts
     */
    if (argv.run === 'counts') {
        database.getCounts();
    }

    /**
     * query the tables and return the details of each 
     * kind of archive update
     */
    else if (argv.run === 'archiveUpdates') {
        database.getArchiveUpdates();
    }
    
    /** 
     * actually run the etl service
     */
    else if (argv.run === 'etl' || typeof(argv.run) === 'undefined') {
        const runMode = argv.runMode || truebug.runMode;
        const source = argv.source || truebug.source;
        
        log.info('='.repeat(80));
        log.info(`STARTING TRUEBUG (runMode ${runMode})`);

        if (source === 'xml') {
            const single = argv.xml || truebug.download.xml;
            const xml = `${single}.xml`;
            const typeOfArchive = 'singles';
            preflight.checkDir(typeOfArchive);
            preflight.copyXmlToDump(typeOfArchive, xml);

            const treatment = parse.parseOne(xml);
            console.log(treatment);
        }
        else {
            preflight.checkDir('archive');
            preflight.checkDir('dumps');
            preflight.backupOldDB();

            const numOfTreatments = database.selCountOfTreatments();
            log.info(`found ${numOfTreatments} treatments in the db`);
                

/*
archive                   size          datetime                           notes
------------------------- ------------- ---------------------------------- -------------------------
plazi.zenodeo.zip	      2548608 kb	Sat, 01 Jan 2022 02:00:00 GMT+0000
plazi.zenodeo.monthly.zip 1536275 kb	Sun, 02 Oct 2022 02:00:00 GMT+0000 updates since full
plazi.zenodeo.weekly.zip    74739 kb	Sun, 30 Oct 2022 02:00:00 GMT+0000 updates since monthly.zip
plazi.zenodeo.daily.zip	   	 4096 kb	Fri, 04 Nov 2022 02:00:00 GMT+0000 updates since weekly.zip


if no data in table
    process 'full', 'monthly', 'weekly', 'daily'
else
    if last archive processed is 'full'
        if 'full' archive on server is newer than local
            process 'full', 'monthly', 'weekly', 'daily'
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
            const typeOfArchives = [ 'monthly', 'weekly', 'daily' ];
            if (numOfTreatments === 0) {

                /** 
                 * There are no treatments in the db so no ETL 
                 * was ever done. So we add 'full' to the typesOfArchives 
                 * stack.
                 */
                typeOfArchives.unshift('full');
            }
            
            //update(typeOfArchives);
            update(['weekly']);
        }
    }
}

init();