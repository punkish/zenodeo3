'use strict';

import process from 'node:process';
import minimist from 'minimist';
import * as preflight from './lib/preflight.js';
import * as postflight from './lib/preflight.js';
import * as download from './lib/download.js';
import * as database from './lib/database/index.js';
import * as parse from './lib/parse.js';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;

import { Zlogger } from '@punkish/zlogger';
const logOpts = JSON.parse(JSON.stringify(config.truebug.log));
logOpts.name = 'TRUEBUG';
const log = new Zlogger(logOpts);

const processFiles = (files) => {

    /**
     * 
     * update the progress bar every x% of the total num of files
     * but x% of j should not be more than 5000 because we don't 
     * want to insert more than 5K records at a time.
     * 
     */
    const totalFiles = files.length;
    const startingFile = 0;
    let i = startingFile;
    const batch = totalFiles < 5000 ? Math.floor(totalFiles / 10) : 5000;
    const dot = batch / 10;

    log.info(`parsing, inserting, refiling ${totalFiles} treatments ${batch} at a time`);

    let transactions = 0;
    let done = 0;

    log.info(`${'~'.repeat(80)}\n`, 'end')

    for (; i < totalFiles; i++) {
        const xml = files[i];
        const treatment = parse.parseOne(xml);
        if (treatment) {
            parse.calcStats(treatment);
            database.repackageTreatment(treatment);

            if (i > 0) {
                if ((i % batch) == 0) {
                    database.insertData();
                    transactions++;
                    done = (batch * transactions) + startingFile;
                    log.info(` ${done} `, 'end');
                }
                else {
                    if (i === (totalFiles - 1)) {

                        /** 
                         * the last remaining files 
                         */ 
                        database.insertData();
        
                        /** 
                         * the last transaction 
                         */ 
                        transactions++;
                        log.info(`${totalFiles} [done]\n`, 'end');
                    }
                }

                if ((i % dot) == 0) {
                    log.info('.', 'end');
                }
            }
            
            postflight.fileaway(xml);
        }
    }

    log.info(`${'~'.repeat(80)}\n`, 'end');
}

const etl = (typeOfArchive, timeOfArchive, sizeOfArchive) => {
    log.info(`starting a ${typeOfArchive.toUpperCase()} process`);

    const stats = [];

    /** 
     * start download
    **/
    const action = {
        started: new Date().getTime(),
        process: 'download',
        timeOfArchive,
        typeOfArchive
    }

    if (typeOfArchive !== 'full') {
        download.download(typeOfArchive);
    }
    
    const numOfFiles = download.unzip(typeOfArchive);

    action.result = JSON.stringify({ numOfFiles });
    action.ended = new Date().getTime();
    stats.push(action);

    log.info('-'.repeat(80));
    log.info(`${action.process.toUpperCase()} took: ${action.ended - action.started} ms`);

    /** 
     * start ETL
    **/
    if (numOfFiles) {
        const files = preflight.filesExistInDump();
        log.info(`${files.length} files exist in dump… let's ETL them`);

        action.started = new Date().getTime();
        action.process = 'etl';
        action.timeOfArchive = timeOfArchive;
        action.typeOfArchive = typeOfArchive;
        
        database.storeMaxrowid();
        database.dropIndexes();
        processFiles(files);
        database.insertFTS();
        database.insertDerived();
        database.updateIsOnLand();
        database.buildIndexes();
        
        log.info(`parsed ${parse.stats.treatments} files with`);

        for (const [key, value] of Object.entries(parse.stats)) {
            log.info(`- ${value} ${key}`);
        }

        action.result = JSON.stringify(parse.stats);
        action.ended = new Date().getTime();
        stats.push(action)
    }
    else {
        log.info('there are no files in the dump to process');
    }

    stats.forEach(row => {
        database.insertStats(row);
    })

    log.info('-'.repeat(80));
    log.info(`${action.process.toUpperCase()} took: ${action.ended - action.started} ms`);
    log.info('TRUEBUG DONE');
}

const update = async (typeOfArchives) => {
    const typeOfArchive = typeOfArchives.shift();

    log.info(`checking if ${typeOfArchive} archive exists on remote server`);
    const result = await download.checkRemote(typeOfArchive);

    if (result.timeOfArchive) {
        const lastUpdate = database.getLastUpdate(typeOfArchive);

        if (lastUpdate.started) {

            /** 
             * the remote archive's time is newer than the last update
            **/
            if (result.timeOfArchive > lastUpdate.started) {
                etl(typeOfArchive, result.timeOfArchive, result.sizeOfArchive);
            }
            else {
                log.info(`${typeOfArchive} archive is older than local update… moving on`);
            }
        }
        else {
            log.info(`${typeOfArchive} archive has not been processed yet`);
            etl(typeOfArchive, result.timeOfArchive, result.sizeOfArchive);
        }

        /** 
         * check the next shorter timePeriod
        **/
        if (typeOfArchives.length) {
            update(typeOfArchives);
        }
    }
    else {
        log.info(`${typeOfArchive} archive doesn't exist`);
        log.info('TRUEBUG DONE');
    }
}

const consoleMsg = (prompt, msg) => {
    console.log(`${prompt} (${msg})`);
    console.log('-'.repeat(50), '\n');
}

/** 
 * `truebug` starts here
**/
const init = () => {
    const argv = minimist(process.argv.slice(2));

    if (argv.help) {
        console.log('truebug USAGE:');
        console.log('*'.repeat(50));
        console.log('index.js');
        console.log('    <');
        console.log('        --run=[ counts | archiveUpdates | etl ]')
        console.log('      < --runMode=[ dry-run | real ] >');
        console.log('      < --source=[ full | monthly | weekly | daily | single ] >');
        console.log('    >');
        console.log('notes: - <options> are optional. If not provided, they are picked up from config.');
        console.log('       - As indicated, *all* options are optional.');
        console.log('       - [options] are choose-one-from-the-list.\n');
        console.log('EXAMPLES');
        console.log('*'.repeat(50), '\n');
        consoleMsg('index.js --run=counts', 'get count of rows in each table in the db');
        consoleMsg('index.js --run=archiveUpdates', 'get updates for each kind of archive');
        consoleMsg('index.js --run=etl --runMode=dry-run', 'run etl but do not load the db');
        consoleMsg('index.js --run=etl --runMode=real', 'run etl and load the db');
        return;
    }
    
    /**
     * query the tables and return current counts
    **/
    if (argv.run === 'counts') {
        database.getCounts();
    }

    /**
     * query the tables and return the details of each 
     * kind of archive update
    **/
    else if (argv.run === 'archiveUpdates') {
        database.getArchiveUpdates();
    }
    
    /** 
     * actually run the etl service
    **/
    else if (argv.run === 'etl') {
        const runMode = argv.runMode || config.truebug.runMode;
        const source = argv.source || config.truebug.source;

        log.info('='.repeat(80));
        log.info(`STARTING TRUEBUG (runMode ${runMode})`);

        if (source === 'single') {
            const single = argv.single || config.truebug.download.single;
            const xml = `${single}.xml`;
            preflight.copyXmlToDump(xml);
            const treatment = parse.parseOne(xml);

            if (runMode === 'dry-run') {
                console.log(treatment);
            }
        }
        else {
            preflight.checkDir('archive');
            preflight.checkDir('dump');
            preflight.backupOldDB();
            database.prepareDatabases();
            
            const numOfTreatments = database.selCountOfTreatments();
            log.info(`found ${numOfTreatments} treatments in the db`);
            
            /** 
             * There are no treatments in the db so no ETL was ever done
            **/
            if (numOfTreatments === 0) {
                etl('full', null, null);
            }
            else {
                const typeOfArchives = [ 'monthly', 'weekly', 'daily' ];
                update(typeOfArchives);
            }
        }
    }

    /**
     * --run is not defined, so assume the program will be 
     * run using config values, for example, as a cronjob
    **/
    else {
        const runMode = config.truebug.runMode;
        const source = config.truebug.source;

        log.info('='.repeat(80));
        log.info(`STARTING TRUEBUG (runMode ${runMode})`);
    
        if (source === 'single') {
            const single = argv.single || config.truebug.download.single;
            const xml = `${single}.xml`;
            preflight.copyXmlToDump(xml);
            const treatment = parse.parseOne(xml);
            
            if (runMode === 'dry-run') {
                console.log(treatment);
            }
        }
        else {
            preflight.checkDir('archive');
            preflight.checkDir('dump');
            preflight.backupOldDB();
            database.prepareDatabases();
            
            const numOfTreatments = database.selCountOfTreatments();
            log.info(`found ${numOfTreatments} treatments in the db`);
            
            /** 
             * There are no treatments in the db so no ETL was ever done
            **/
            if (numOfTreatments === 0) {
                etl('full', null, null);
            }
            else {
                const typeOfArchives = [ 'monthly', 'weekly', 'daily' ];
                update(typeOfArchives);
            }
        }
    }
}

init();