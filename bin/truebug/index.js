'use strict';

const preflight = require('./lib/preflight');
const download  = require('./lib/download');
const database  = require('./lib/database');
const parse     = require('./lib/parse');

const config = require('config');
const truebug = config.get('truebug');

const Logger = require('./utils');
const log = new Logger(truebug.log);

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

                if ((i % dot) == 0) log.info('.', 'end');
            }
            
            preflight.fileaway(xml);
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

    download.download(typeOfArchive);
    const numOfFiles = download.unzip(typeOfArchive);

    action.result = JSON.stringify({ numOfFiles });
    action.ended = new Date().getTime();
    stats.push(action);

    log.info('-'.repeat(80));
    log.info(`${action.process.toUpperCase()} took: ${action.ended - action.started} ms`);

    // start ETL
    if (numOfFiles) {
        const files = preflight.filesExistInDump();
        log.info(`${files.length} files exist… let's ETL them`);

        action.started = new Date().getTime();
        action.process = 'etl';
        action.timeOfArchive = timeOfArchive;
        action.typeOfArchive = typeOfArchive;
        

        database.storeMaxrowid();
        database.dropIndexes();
        processFiles(files);
        database.buildIndexes();
        database.insertFTS();
        
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
}

const update = async (typeOfArchives) => {
    const typeOfArchive = typeOfArchives.shift();

    log.info(`checking if ${typeOfArchive} archive exists on remote server`);
    const result = await download.checkRemote(typeOfArchive);

    // the tested timePeriod exists on the remote server
    if (result.timeOfArchive) {

        // the tested timePeriod is newer than the local update
        //const timeOfArchive = new Date(result.timeOfArchive).getTime();
        const lastUpate = database.getLastUpdate(typeOfArchive);
        if (result.timeOfArchive > lastUpate) {
            process(typeOfArchive, result.timeOfArchive, result.sizeOfArchive);
        }
        else {
            log.info(`${typeOfArchive} archive is older than local update… moving on`);
        }

        // check the next shorter timePeriod
        if (typeOfArchives.length) update(typeOfArchives);
    }
    else {
        log.info(`${typeOfArchive} archive doesn't exist`);
    }
}

// start here
log.info('='.repeat(80));
log.info('STARTING TRUEBUG');

preflight.checkDir('archive');
preflight.checkDir('dump');
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

log.info('TRUEBUG DONE');

// HOME=/Users/punkish
// PATH=/opt/local/bin:/opt/local/sbin:/opt/local/bin:/opt/local/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Applications/Little Snitch.app/Contents/Components:/opt/X11/bin:/Library/Apple/usr/bin
// NODE_ENV=test
// 0/5 0 * * * cd ~/Projects/zenodeo/zenodeo3 && node ~/Projects/zenodeo/zenodeo3/bin/truebug