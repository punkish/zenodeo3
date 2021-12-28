'use strict';

const Logger = require('./utils');
const level = 'info';
const transports = [ 'console', 'file' ];
const logdir = '/Users/punkish/Projects/zenodeo/zenodeo3/bin/truebug/logs';
const log = new Logger({level, transports, logdir});

const preflight = require('./lib/preflight');
const download  = require('./lib/download');
const database  = require('./lib/database');
const parse     = require('./lib/parse');

const config = require('config');
const truebug = JSON.parse(JSON.stringify(config.get('truebug')));

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

    log.info(`parsing, inserting in db and refiling ${totalFiles} treatments ${batch} at a time`);

    let count = 0
    log.info(`${'~'.repeat(80)}\n`, 'end')

    const data = {
        treatments: [],
        treatmentAuthors: [],
        materialsCitations: [],
        materialsCitations_x_collectionCodes: [],
        collectionCodes: [],
        treatmentCitations: [],
        figureCitations: [],
        bibRefCitations: []
    }

    for (; i < totalFiles; i++) {
        const xml = files[i]
        const treatment = parse.parseOne(truebug, xml)
        parse.calcStats(treatment)
        database.repackageData(treatment, data)

        if (!(i % batch)) {
            database.insertData(truebug, data)

            count++
            const done = (batch * count) + startingFile
            log.info(`${done > totalFiles ? totalFiles : done} … `, 'end')
        }

        if (i === totalFiles - 1) {
            log.info(' done\n', 'end')
        }

        preflight.fileaway(truebug, xml)
    }

    // the last remaining files
    database.insertData(truebug, data)

    log.info(`${'~'.repeat(80)}\n`, 'end')
}

const dispatch = {
    etl: (truebug) => {
        preflight.checkDir(truebug, 'archive')
        preflight.checkDir(truebug, 'dump')
        
        const files = preflight.filesExistInDump(truebug)
        if (files.length) {
            log.info(`${files.length} files exist… let's do something`)
            database.prepareSeparateDatabases(truebug)
        
            database.dropIndexes(truebug)
            processFiles(files)
            database.buildIndexes(truebug)

            if (database.selCountOfVtreatments(truebug)) {
                database.insertFTS(truebug, 'row')
            }
            else {
                database.insertFTS(truebug, 'bulk')
            }
            
            log.info(`parsed ${parse.stats.treatments} files with`)
            for (const [key, value] of Object.entries(parse.stats)) {
                log.info(`- ${value} ${key}`)
            }
        }
        else {
            log.info('there are no files in the dump to process')
        }

        return 0
    },

    download: (truebug) => {
        return download.download(truebug, 'full')
    }
}

const action = process.argv.slice(2)[0]

if (!action) {
    log.error("action not provided (should be one of 'etl' or 'download')")
}
else if (!(action in dispatch)) {
    log.error("unknown action (should be one of 'etl' or 'download')")
}
else {
    log.info('='.repeat(80))
    log.info(`STARTING ${action.toUpperCase()}`)

    const etlstats = {
        started: new Date().getTime(),
        ended: 0,
        parsed: {}
    }

    if (action === 'etl') {
        dispatch[action](truebug)
        etlstats.parsed = JSON.stringify(parse.stats)
    }
    else if (action === 'download') {
        dispatch[action](truebug)
    }

    etlstats.ended = new Date().getTime()

    if (action === 'etl') {
        if (parse.stats.treatments) {
            database.insertEtlStats(truebug, etlstats)
        }
    }

    log.info('-'.repeat(80))
    log.info(`${action.toUpperCase()} took: ${etlstats.ended - etlstats.started} ms`)
}

// rolling file writer uses interval, so we need to exit
setTimeout(() => process.exit(0), 1000)

// */10 * * * * cd /Users/punkish/Projects/zenodeo/zenodeo3 && /opt/local/bin/node /Users/punkish/Projects/zenodeo/zenodeo3/bin/truebug etl
// */10 * * * * cd /Users/punkish/Projects/zenodeo/zenodeo3 && /opt/local/bin/node /Users/punkish/Projects/zenodeo/zenodeo3/bin/truebug download