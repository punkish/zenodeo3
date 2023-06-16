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

const truebugStats = [];


const calcRows = (stats) => {
    const rowsInserted = Object.keys(stats.etl)
        .filter(key => key !== 'started' && key !== 'ended')
        .map(key => stats.etl[key])
        .reduce((a, b) => a + b);

    return rowsInserted;
}

const processFiles = (files, stats) => {
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
    const defaultBatch = 7500;
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
        const treatment = parse.parseOne(xml, stats);
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
        
        postflight.cpFile(xml, stats);
        postflight.rmFile(xml, stats);
    }

    log.info(`${'~'.repeat(120)}\n`, 'end');
};

const etl = (files, stats) => {
    tbutils.incrementStack(logOpts.name, 'etl');

    log.info(`ETL-ing ${stats.archive.typeOfArchive}`);

    // 
    // start ETL
    stats.etl.started = new Date().getTime();

    if (stats.unzip.numOfFiles) {
        log.info(`${files.length} files exist in dump… let's ETL them`);

        processFiles(files, stats);
        
        log.info(`parsed ${stats.etl.treatments} XMLs`);
        stats.etl.journals = database.cache.journals.size;
        stats.etl.ended = new Date().getTime();
    }
    else {
        stats.etl.ended = new Date().getTime();
        log.info('there are no files in the dump to process');
    }
}

const update = async (typesOfArchives, truebugStats, firstRun = false) => {
    tbutils.incrementStack(logOpts.name, 'update');

    const stats = {
        archive: {
            typeOfArchive: '',
            timeOfArchive: 0,
            sizeOfArchive: 0
        },
        download: {
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
    
    //
    // we grab the first in the list of archives one of 'yearly', 'monthly', 
    // 'weekly', or 'daily'
    //
    const typeOfArchive = typesOfArchives.shift();
    stats.archive.typeOfArchive = typeOfArchive;

    if (!firstRun) {
        if (typeOfArchive === 'yearly') {
            firstRun = true;
        }
    }

    //
    // if needed, download archive from remote server
    //
    await download.download(stats);

    if (!stats.archive.timeOfArchive) {
        truebugStats.push(stats);
        return update(typesOfArchives, truebugStats);
    }
    
    if (firstRun && typeOfArchive === 'yearly') {
        database.dropIndexes();
    }
    
    //
    // unzip archive, if needed, and read the files into an array
    //
    const files = download.unzip(stats);
    etl(files, stats);
    database.insertStats(stats);

    //
    // clean up old archive
    //
    download.cleanOldArchive(stats);

    if (typesOfArchives.length) {
        log.info(`next up, the "${typesOfArchives[0].toUpperCase()}" archive`);
        truebugStats.push(stats);
        return update(typesOfArchives, truebugStats, firstRun);
    }
    else {
        log.info('all archives processed');
    }

    if (firstRun) {
        database.buildIndexes();
        database.analyzeDb();
    }

    // const utilOpts = { showHidden: false, depth: null, color: true };
    // console.log(util.inspect(truebugStats, utilOpts));
    postflight.printit(truebugStats);
}

const allTypesOfArchives = [
    'yearly',
    'monthly',
    'weekly',
    'daily'  
];

/** 
 * `truebug` starts here
 */
const init = async (truebugStats) => {
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
            const typesOfArchives = JSON.parse(
                JSON.stringify(allTypesOfArchives)
            );

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
                const lastUpdates = database.getLastUpdate();

                for (const last of lastUpdates) {
                    tbutils.pruneTypesOfArchives(last, typesOfArchives);
                }
            }

            log.info(`have to ETL ${JSON.stringify(typesOfArchives)}`);

            //
            // By now our archives[] have been pruned to just those entries 
            // that need to be ETLed
            //
            if (typesOfArchives.length) {
                update(typesOfArchives, truebugStats);
            }

        }
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

init(truebugStats);