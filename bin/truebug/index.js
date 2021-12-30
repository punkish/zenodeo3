'use strict';

const preflight = require('./lib/preflight');
const download  = require('./lib/download');
const database  = require('./lib/database');
const parse     = require('./lib/parse');

const config = require('config');
const truebug = config.get('truebug');

const Logger = require('./utils');
const log = new Logger({
    level: truebug.log.level, 
    transports: truebug.log.transports, 
    logdir: truebug.dirs.logs
});

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
            
            preflight.fileaway(xml)
        }
    }

    log.info(`${'~'.repeat(80)}\n`, 'end')
}

const dispatch = {
    etl: () => {
        preflight.checkDir('archive');
        preflight.checkDir('dump');
        database.prepareDatabases();
        
        const files = preflight.filesExistInDump();

        if (files.length) {
            log.info(`${files.length} files exist… let's do something`);

            database.storeMaxrowid();
            database.dropIndexes();
            processFiles(files);
            database.buildIndexes();
            database.insertFTS();
            
            log.info(`parsed ${parse.stats.treatments} files with`);

            for (const [key, value] of Object.entries(parse.stats)) {
                log.info(`- ${value} ${key}`);
            }
        }
        else {
            log.info('there are no files in the dump to process');
        }

        return 0;
    },

    download: (downloadtype) => {
        preflight.checkDir('archive');
        preflight.checkDir('dump');
        database.prepareDatabases();

        download.download(downloadtype);
        const numOfFiles = download.unzip(downloadtype);
        return numOfFiles;
    }
}

const action = process.argv.slice(2)[0];
const downloadtype = process.argv.slice(3)[0];

if (!action) {
    log.error("action not provided (should be one of 'etl' or 'download')");
}
else if (!(action in dispatch)) {
    log.error("unknown action (should be one of 'etl' or 'download')");
}
else {
    log.info('='.repeat(80));
    log.info(`STARTING ${action.toUpperCase()}`);

    const stats = {
        started: new Date().getTime(),
        ended: 0,
        process: action,
        result: ''
    }

    if (action === 'etl') {
        dispatch.etl();
        stats.result = JSON.stringify(parse.stats);
    }
    else if (action === 'download') {
        const validDownloadTypes = ['full', 'monthly', 'weekly', 'daily'];

        if (validDownloadTypes.includes(downloadtype)) {
            const numOfFiles = dispatch.download(downloadtype);
            stats.result = numOfFiles;
        }
        else {
            log.error("unknown or invalid downloadtype");
        }
    }

    stats.ended = new Date().getTime();

    database.insertStats(action, stats);
    log.info('-'.repeat(80));
    log.info(`${action.toUpperCase()} took: ${stats.ended - stats.started} ms`);
}

// */10 * * * * cd /Users/punkish/Projects/zenodeo/zenodeo3 && /opt/local/bin/node /Users/punkish/Projects/zenodeo/zenodeo3/bin/truebug etl
// */10 * * * * cd /Users/punkish/Projects/zenodeo/zenodeo3 && /opt/local/bin/node /Users/punkish/Projects/zenodeo/zenodeo3/bin/truebug download