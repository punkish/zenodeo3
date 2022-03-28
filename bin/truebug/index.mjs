'use strict';

import * as preflight from './lib/preflight.mjs';
import * as postflight from './lib/preflight.mjs';
import * as download from './lib/download.mjs';
import * as database from './lib/database/index.mjs';
import * as parse from './lib/parse.mjs';
import config from 'config';

const truebug    = config.get('truebug');

import { Zlogger } from '@punkish/zlogger';
const logOpts = JSON.parse(JSON.stringify(config.get('truebug.log')));
logOpts.name  = 'TRUEBUG';
const log     = new Zlogger(logOpts);

const processFiles = (files) => {

    /**************************************************************
     * 
     * update the progress bar every x% of the total num of files
     * but x% of j should not be more than 5000 because we don't 
     * want to insert more than 5K records at a time.
     * 
     **************************************************************/
    const totalFiles = files.length;
    const startingFile = 0;
    let i = startingFile;
    const batch = totalFiles < 5000 ? Math.floor(totalFiles / 10) : 5000;
    const dot = batch / 10;

    log.info(`parsing, inserting in db and refiling ${totalFiles} treatments ${batch} at a time`);

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

                        // the last remaining files
                        database.insertData();
        
                        // the last transaction
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

const process = (typeOfArchive, timeOfArchive, sizeOfArchive) => {
    log.info(`starting a ${typeOfArchive.toUpperCase()} process`);

    const stats = [];

    // start download
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

    // start ETL
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

        if (lastUpdate) {

            // the remote archive's time is newer than the last update
            if (result.timeOfArchive > lastUpdate) {
                process(typeOfArchive, result.timeOfArchive, result.sizeOfArchive);
            }
            else {
                log.info(`${typeOfArchive} archive is older than local update… moving on`);
            }
        }
        else {
            log.info(`${typeOfArchive} archive has not been processed yet`);
            process(typeOfArchive, result.timeOfArchive, result.sizeOfArchive);
        }

        // check the next shorter timePeriod
        if (typeOfArchives.length) {
            update(typeOfArchives);
        }
    }
    else {
        log.info(`${typeOfArchive} archive doesn't exist`);
        log.info('TRUEBUG DONE');
    }
}

// `truebug` starts here
log.info('='.repeat(80));
log.info(`STARTING TRUEBUG (mode ${truebug.run})`);

if (truebug.source === 'single') {
    preflight.copyXmlToDump(`${truebug.download.single}.xml`);
    const treatment = parse.parseOne(truebug.download.single);
    console.log(treatment);
}
else {
    preflight.checkDir('archive');
    preflight.checkDir('dump');
    preflight.backupOldDB();
    database.prepareDatabases();
    
    const numOfTreatments = database.selCountOfTreatments();
    log.info(`found ${numOfTreatments} treatments in the db`);
    
    // There are no treatments in the db so no ETL was ever done
    if (numOfTreatments === 0) {
        process('full', null, null);
    }
    else {
        const typeOfArchives = [ 'monthly', 'weekly', 'daily' ];
        update(typeOfArchives);
    }
}

/*
# this crontab entry runs truebug etl every midnight
# set environment variables
HOME=/Users/punkish
PATH=/Users/punkish/.nvm/versions/node/v16.14.0/bin:/opt/local/bin:/opt/local/sbin:/opt/local/bin:/opt/local/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Applications/Little Snitch.app/Contents/Components:/opt/X11/bin:/Library/Apple/usr/bin
NODE_ENV=cron
0 0 * * * cd ~/Projects/zenodeo/zenodeo3 && node ~/Projects/zenodeo/zenodeo3/bin/truebug
*/