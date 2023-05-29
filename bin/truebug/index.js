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

const processFiles = (archive_name, files, stats) => {
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
        const treatment = parse.parseOne(archive_name, xml);
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
        
        postflight.cpFile(archive_name, xml);
        postflight.rmFile(archive_name, xml);
    }

    log.info(`${'~'.repeat(120)}\n`, 'end');
};

const etl = (archive_name, files, stats) => {
    tbutils.incrementStack(logOpts.name, 'etl');

    const [ typeOfArchive, timeOfArchive ] = archive_name.split('.');
    log.info(`ETL-ing ${typeOfArchive}`);

    // 
    // start ETL
    stats.etl.started = new Date().getTime();

    if (stats.unzip.numOfFiles) {
        log.info(`${files.length} files exist in dump… let's ETL them`);

        processFiles(archive_name, files, stats);
        
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
    const typeOfArchive = archives.shift();

    if (!firstRun) {
        if (typeOfArchive === 'yearly') {
            firstRun = true;
        }
    }

    stats.archives.type = typeOfArchive;

    //
    // if needed, download archive from remote server
    //
    const archive_name = await download.download(typeOfArchive, stats);
    
    if (archive_name) {
        database.dropIndexes();

        //
        // unzip archive, if needed, and read the files into an array
        //
        const files = download.unzip(archive_name, stats);
        etl(archive_name, files, stats);
        database.insertStats(stats);

        //
        // clean up old archive
        //
        download.cleanOldArchive(archive_name);

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

    database.buildIndexes();
    
    const utilOpts = { showHidden: false, depth: null, color: true };
    console.log(util.inspect(stats, utilOpts));
}

const allArchive = [
    'yearly',
    'monthly',
    'weekly',
    'daily'
];

const determineArchiveToProcess = async () => {
    const lastUpdates = database.getLastUpdate();
    const archivesToProcess = JSON.parse(JSON.stringify(allArchive));

    for (const last of lastUpdates) {
        const archiveOnServer = await download.checkServerForArchive(last.typeOfArchive);
        
        if (archiveOnServer) {
            const [ typeOfArchive, time ] = archiveOnServer.split('.');

            if (time <= last.timeOfArchive) {
                const i = archivesToProcess.indexOf(last.typeOfArchive);
                archivesToProcess.splice(i, 1);
            }
        }
        else {
            const i = archivesToProcess.indexOf(last.typeOfArchive);
            archivesToProcess.splice(i, 1);
        }
        
    }

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

            //
            // This is the first time we are running update, so let's see if 
            // there are any treatments already in the db
            //
            const numOfTreatments = database.selCountOfTreatments();
            let archives;

            if (numOfTreatments) {
                
                //
                // There are treatments in the db already. So we need to 
                // determine the type of archive and timestamp of archive that 
                // should be processed
                //
                archives = await determineArchiveToProcess();
            }
            else {
                log.info('-'.repeat(80));
                log.info('since there are no treatments in the db, we will start with a "YEARLY" archive');
                archives = JSON.parse(JSON.stringify(allArchive));
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