import minimist from 'minimist';
import { getPrompt } from './lib/prompt.js';
import Newbug from './lib/newbug.js';
import NewbugParse from './lib/parse/index.js';
import NewbugDatabase from './lib/database/index.js';
import NewbugUtils from './lib/utils/index.js';

const argv = minimist(process.argv.slice(2));

if (argv.help || typeof(argv.do) === 'undefined') {
    console.log(getPrompt());
}
else {
    const nb = new Newbug({ loglevel: 'info' });

    // Parse a single XML
    if (argv.do === 'parse') {
        const nbParse = new NewbugParse({ loglevel: 'error' });
        const xmlDir = `${nbParse.config.dirs.dumps}/xmls`;
        const source = argv.source
            ? `${xmlDir}/${argv.source}.xml`
            : `${xmlDir}/000A3347FFAF441BF83EFBDEFEB7A7AB.xml`;
               
        console.log(JSON.stringify(nbParse.xml(source)));
    }
    else {
        
        // All options for argv.do other than 'parse' access the 
        // database, so we create a nbDatabase object
        const dbfile = `${nb.config.db.dir}/${nb.config.db.dbfile}`;
        
        const nbDatabase = new NewbugDatabase({ 
            loglevel: 'info',
            dbfile: argv.dbfile ?? dbfile,
            alias: argv.alias ?? nb.config.db.alias,
            reinitialize: argv.reinitialize ?? nb.config.db.reinitialize 
        });

        if (argv.do === 'counts') {
            const tables = nbDatabase.getCounts();
            console.table(tables);
        }
        else if (argv.do === 'archiveUpdates') {
            nbDatabase.getArchiveUpdates();
        }
        else if (argv.do === 'etl') {
            const mode = argv.mode ?? '"dry run"';
            nbDatabase.log.info(`running etl in mode ${mode}`);

            // Let's see if there are any treatments already in the db
            const num = nbDatabase.selCountOfTreatments();
            let isDbEmpty = false;

            // There are records in the db already
            if (num) {
                nbDatabase.log.info(`There are ${num} treatments already in the db`);
                
                // There are treatments in the db already. So we need to 
                // determine the type of archive and timestamp of archive that 
                // should be processed
                const nbUtils = new NewbugUtils({ loglevel: 'info' });

                nbUtils.checkDir({
                    dir: `${this.config.dirs.data}/treatments-archive`,
                    removeFiles: false
                });
    
                nbUtils.checkDir({
                    dir: `${this.config.dirs.data}/treatments-dumps`,
                    removeFiles: false
                });

                // We start with all the archives
                const typesOfArchives = [
                    'yearly', 'monthly', 'weekly', 'daily'
                ];

                // And we prune them down to only the ones that 
                // have to be processed
                const lastUpdates = nbDatabase.getLastUpdate();

                for (const last of lastUpdates) {
                    nbUtils.pruneTypesOfArchives(last, typesOfArchives);
                }

                this.log.info(`have to ETL "${typesOfArchives.join('", "')}"`);

                // By now our archives[] have been pruned to just those
                // entries that need to be ETLed
                if (typesOfArchives.length) {
                    update(typesOfArchives, truebugStats);
                }
            }

            // The db is empty
            else {
                nbDatabase.log.info('The db is empty');
                isDbEmpty = true;
            }

            await nbDatabase.etl(argv.source, isDbEmpty);
        }
    }
}