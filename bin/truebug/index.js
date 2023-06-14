// @ts-check

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

import * as tbutils from './lib/utils.js';
import * as utils from '../../lib/utils.js';

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

const processFiles = (archive, files, stats) => {
    tbutils.incrementStack(logOpts.name, 'processFiles');

    //
    // If totalFiles is less than ${defaultBatch} then we insert 1/10th of 
    // totalFiles at a time. This is the ${batch}. But if totalFiles is 
    // more than ${defaultBatch}, we insert ${defaultBatch} files at a time.
    //
    const totalFiles = truebug.mode === "real" 
        ? files.length
        : 15;
    
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
    // we time the process using hrtime.bigint() which returns time in 
    // nanoseconds that we can convert to ms by dividing by 1e6

    // when the ETL process started
    let startETLTime = process.hrtime.bigint();

    // when this batch transaction started. This includes reading and parsing 
    // the files and inserting the rows
    let startTransactionTime = startETLTime;

    // stores when the actual db insert started
    let startInsertTime;

    const treatments = [];

    for (let i = 0; i < totalFiles; i++) {
        const xml = files[i];
        const treatment = parse.parseOne(archive, xml);
        treatments.push(treatment);
        parse.calcStats(treatment, stats);
        
        if (i > 0) {
            
            // last file
            if (i === (totalFiles - 1)) {

                // initialize db insert time
                startInsertTime = process.hrtime.bigint();
                database.insertTreatments(treatments);
                
                const str = tbutils.progressBar({ 
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

                const str = tbutils.progressBar({ 
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
        
        postflight.cpFile(archive, xml);
        postflight.rmFile(archive, xml);
    }

    log.info(`${'~'.repeat(120)}\n`, 'end');
};

const etl = (archive, files, stats) => {
    tbutils.incrementStack(logOpts.name, 'etl');

    //const [ typeOfArchive, timeOfArchive ] = archive_name.split('.');
    log.info(`ETL-ing ${archive.typeOfArchive}`);

    // 
    // start ETL
    stats.etl.started = new Date().getTime();

    if (stats.unzip.numOfFiles) {
        log.info(`${files.length} files exist in dump… let's ETL them`);

        processFiles(archive, files, stats);
        
        log.info(`parsed ${stats.etl.treatments} XMLs`);
        stats.etl.journals = database.cache.journals.size;
        stats.etl.ended = new Date().getTime();
    }
    else {
        log.info('there are no files in the dump to process');
    }
}

const update = async (archives, stats, firstRun = false) => {
    tbutils.incrementStack(logOpts.name, 'update');
    
    //
    // we grab the first in the list of archives one of 'yearly', 'monthly', 
    // 'weekly', or 'daily'
    //
    const archive = archives.shift();

    if (!firstRun) {
        if (archive.typeOfArchive === 'yearly') {
            firstRun = true;
        }
    }

    //stats.archives.type = archive.typeOfArchive;

    //
    // if needed, download archive from remote server
    //
    await download.download(archive.typeOfArchive, stats);
    
    //if (archive_name) {
        database.dropIndexes();

        //
        // unzip archive, if needed, and read the files into an array
        //
        const files = download.unzip(archive, stats);
        etl(archive, files, stats);
        database.insertStats(stats);

        //
        // clean up old archive
        //
        download.cleanOldArchive(archive);

        if (archives.length) {
            log.info(`next up, the "${archives[0].typeOfArchive.toUpperCase()}" archive`);
            return update(archives, stats, firstRun);
        }
        else {
            log.info('all archives processed');
        }

    //}
    // else {
    //     log.info(`There is no "${typeOfArchive}" archive on the server. Wrapping up.`);
    // }

    database.buildIndexes();
    database.analyzeDb();
    
    const utilOpts = { showHidden: false, depth: null, color: true };
    console.log(util.inspect(stats, utilOpts));
}

const allArchives = [
    { typeOfArchive: 'yearly' , timeOfArchive: '' },
    { typeOfArchive: 'monthly', timeOfArchive: '' },
    { typeOfArchive: 'weekly' , timeOfArchive: '' },
    { typeOfArchive: 'daily'  , timeOfArchive: '' }
];

const determineArchiveToProcess = async () => {
    const lastUpdates = database.getLastUpdate();
    const archivesToProcess = JSON.parse(JSON.stringify(allArchives));
    
    for (const last of lastUpdates) {
        const timeOfArchive = await download.checkServerForArchive(last.typeOfArchive);
        
        if (timeOfArchive && (timeOfArchive > last.timeOfArchive)) {
            
            // do nothing
            //
            // if the archive on the server is older than the one we have 
            // already processed, then we remove it from the array as we will 
            // no longer process it
            //
            // if (timeOfArchive <= last.timeOfArchive) {
            //     const i = archivesToProcess
            //         .findIndex(a => a.typeOfArchive === last.typeOfArchive);
            //     archivesToProcess.splice(i, 1);
            // }

        }
        else {

            //
            // if the archive on the server is older than the one we have or
            // if archive doesn't exist on the server, we remove it from the 
            // array as we will no longer process it
            //
            const i = archivesToProcess
                .findIndex(a => a.typeOfArchive === last.typeOfArchive);
            archivesToProcess.splice(i, 1);
        }
        
    }

    log.info(`archivesToProcess: ${JSON.stringify(archivesToProcess)}`);
    return archivesToProcess;
}

/** 
 * `truebug` starts here
 */
const init = async (stats) => {
    const argv = minimist(process.argv.slice(2));
    
    //
    // print usage/help message
    //
    if (argv.help || typeof(argv.do) === 'undefined') {
        const prompt = fs.readFileSync('./bin/truebug/lib/prompt.txt', 'utf8');
        console.log(prompt);
        return;
    }
    
    //
    // query the tables and return current counts
    //
    if (argv.do === 'getCounts') {
        database.getCounts();
    }

    //
    // query the tables and return the details of each kind of archive update
    //
    else if (argv.do === 'archiveUpdates') {
        database.getArchiveUpdates();
    }
    
    //
    // run etl
    //
    else if (argv.do === 'etl') {
        const mode = argv.mode || truebug.mode;
        const source = argv.source || truebug.source;
        
        log.info('='.repeat(80));
        log.info(`STARTING TRUEBUG (mode: ${mode})`);

        if (source === 'xml') {
            processXml();
        }
        else {
            utils.checkDir({
                dir: `${truebug.dirs.data}/treatments-archive`,
                removeFiles: false
            });

            utils.checkDir({
                dir: `${truebug.dirs.data}/treatments-dumps`,
                removeFiles: false
            });

            preflight.backupOldDB();

            
            // by default, we check all archives
            const archives = JSON.parse(JSON.stringify(allArchives));

            //
            // Let's see if there are any treatments already in the db
            //
            const numOfTreatments = database.selCountOfTreatments();

            if (numOfTreatments) {
                
                //
                // There are treatments in the db already. So we need to 
                // determine the type of archive and timestamp of archive that 
                // should be processed
                //
                //archives = await determineArchiveToProcess();

                // since treatments already exist in the db,
                // we check previously processed archives
                const lastUpdates = database.getLastUpdate();

                for (const last of lastUpdates) {
                    confirmArchive(last, last.typeOfArchive, archives);
                }
            }
            // else {
            //     log.info('-'.repeat(80));
            //     log.info('since there are no treatments in the db, we will start with a "YEARLY" archive');
            //     archives = JSON.parse(JSON.stringify(allArchives));
            // }

            if (archives.length) {
                update(archives, stats);
            }
            

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

const confirmArchive = (last, typeOfArchive, archives) => {
    if (last.typeOfArchive === typeOfArchive) {
        const date = new Date();
        const currentPeriod = getCurrentPeriod(typeOfArchive, date);
        const currentPeriodOfLast = getCurrentPeriod(
            typeOfArchive, new Date(last.timeOfArchive)
        );

        // console.log(typeOfArchive, last.timeOfArchive)
        // console.log(currentPeriodOfLast, currentPeriod)

        if (currentPeriodOfLast >= currentPeriod) {

            log.info(`we don't process "${typeOfArchive}" archive`);

            // we don't process this archive
            const i = archives
                .findIndex(a => a.typeOfArchive === typeOfArchive);
            archives.splice(i, 1);
        }
        
    }
}

const getWeekOfYear = (date = new Date()) => {
    const first_of_year = new Date(
        date.getUTCFullYear(), 
        0, 
        1
    );

    const ms_till_date = date - first_of_year;
    const days_till_date = Math.ceil(ms_till_date / 1000 / 60 / 60 / 24);

    // if w if less than 7, then it is week 1
    let w = days_till_date <= 7 ? 1 : Math.floor(days_till_date / 7);
    w += days_till_date % 7 ? 1 : 0;
    
    return w;
}

const getCurrentPeriod = (typeOfArchive, date) => {

    if (typeOfArchive === 'yearly') {
        return date.getUTCFullYear();
    }
    else if (typeOfArchive === 'monthly') {
        return date.getUTCMonth() + 1;
    }
    else if (typeOfArchive === 'weekly') {
        return getWeekOfYear(date);
    }
    else if (typeOfArchive === 'daily') {
        return date.getUTCDay();
    }
    
}

const processXml = (argv) => {
    const single = argv.xml || truebug.archives.xml;
    const xml = `${single}.xml`;
    const typeOfArchive = 'xmls';

    utils.checkDir({
        dir: `${truebug.dirs.data}/treatments-dumps/${typeOfArchive}`, 
        removeFiles: false
    });

    //preflight.copyXmlToDump(typeOfArchive, xml);

    const treatment = parse.parseOne(typeOfArchive, xml);

    //
    // deep print object to the console
    //
    // https://stackoverflow.com/a/10729284/183692
    //
    const utilOpts = { 
        showHidden: false, 
        depth: null, 
        colors: true 
    };
    
    if (argv.print) {
        console.log(util.inspect(treatment[argv.print], utilOpts));
        console.log(`${argv.print}: ${treatment[argv.print].length}`)

        // treatment.materialCitations.forEach(materialCitation => {
        //     console.log(materialCitation.collectionCodes)
        // });

    }
    else {
        console.log(util.inspect(treatment, utilOpts));
    }
    
    console.log(`time Taken To Parse: ${treatment.timeToParseXML}`);
}

init(stats);