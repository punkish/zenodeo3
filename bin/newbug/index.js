import minimist from 'minimist';
import { showPrompt } from './lib/prompt.js';
import Newbug from './lib/newbug.js';
//import NewbugDb from './lib/database/index.js';

/*
--
--source=/path/to/dir/file.xml
--source=/path/to/dir
--source=synthetic(45)
--sourceType=file
--sourceType=dir
--sourceType=archives

--action=parseOne --source=/path/to/treatment.xml
--action=parseOne --sourceType=file
action: parse/etl
sourceType: xml
source: /path/to/treatment.xml
source: `${dirs.dumps}/xmls/${sources.xml}.xml`

sourceType: archive
source: /path/to/xmls
source: `${dirs.archive}/${sources.yearly}`
        `${dirs.archive}/${sources.monthly}`
        `${dirs.archive}/${sources.weekly}`
        `${dirs.archive}/${sources.daily}`
        
sourceType: syntheticData
source: makeTreatments(num)
*/
const argv = minimist(process.argv.slice(2));

if (argv.help || typeof(argv.action) === 'undefined') {
    console.log(showPrompt());
}
else {

    // Remove '_' from argv because we don't use it at all
    delete argv._;

    // Remove 'action' from argv because it is the only CLI option that is 
    // required. We need to know the 'action' to instantiate the right 
    // version of Newbug
    const action = argv.action;
    delete argv.action;

    const source = argv.source;
    delete argv.source;
    const newbug = new Newbug(argv);
    
    if (action === 'parseFile') {
        const force = argv.force ?? false;
        const treatment = newbug.parseFile(source, force);
        console.log(treatment);
    }
    else {

        if (action === 'getCounts') {
            const counts = newbug.getCounts();
            console.table(counts);
        }
        else if (action === 'getArchiveUpdates') {
            const archiveUpdates = newbug.getArchiveUpdates();
            console.log(archiveUpdates);
        }
        else if (action === 'etl') {
            const force = argv.force ?? false;
            const sourceType = newbug.utils.determineSourceType(source);
            
            if (!sourceType) {
                console.error(`${source} has to be a valid source`);
            }
            else {

                newbug.updateStats({ etlStarted: true });

                if (sourceType === 'file') {
                    const treatment = newbug.parseFile(source, force);

                    if (treatment) {
                        newbug.updateStats({ numOfFiles: 1, etlId: true });

                        // if we got a treatment, the source was a valid file
                        newbug.load([ treatment ]);
                    }
                    
                }

                // we didn't get a treatment back, so let's check if it is a dir
                else if (sourceType === 'dir') {
                    newbug.processDir(source, force);
                }
                else if (sourceType === 'tbArchive') {
                    const mode = argv.mode ?? '"dry run"';
                    newbug.logger.info(`running etl in mode ${mode}`);

                    // Let's see if there are any treatments already in the db
                    const num = newbug.selCountOfTreatments();
                    let isDbEmpty = false;

                    // There are records in the db already
                    if (num) {
                        let msg = num > 1 
                            ? `there are ${num} treatments already in the db`
                            : `there is 1 treatment already in the db`
                        newbug.logger.info(msg);
                        
                        // There are treatments in the db already. So we need to 
                        // determine the type of archive and timestamp of archive 
                        // that should be processed
                        //const nbUtils = new NewbugUtils({ loglevel: 'info' });

                        newbug.utils.checkDir({
                            dir: `${newbug.config.dirs.data}/treatments-archive`,
                            removeFiles: false,
                            logger: newbug.logger,
                            mode: newbug.config.mode
                        });

                        newbug.utils.checkDir({
                            dir: `${newbug.config.dirs.data}/treatments-dumps`,
                            removeFiles: false,
                            logger: newbug.logger,
                            mode: newbug.config.mode
                        });

                        // We start with all the archives
                        const typesOfArchives = [
                            'yearly', 'monthly', 'weekly', 'daily'
                        ];

                        // And we prune them down to only the ones that 
                        // have to be processed
                        const lastUpdates = newbug.getLastUpdate();

                        for (const last of lastUpdates) {
                            newbug.pruneTypesOfArchives(last, typesOfArchives);
                        }

                        newbug.logger.info(`have to ETL "${typesOfArchives.join('", "')}"`);

                        // By now our archives[] have been pruned to just those
                        // entries that need to be ETLed
                        if (typesOfArchives.length) {
                            update(typesOfArchives);
                        }
                    }

                    // The db is empty
                    else {
                        newbug.logger.info('the db is empty');
                        isDbEmpty = true;
                    }

                    await newbug.etl(isDbEmpty);
                }
                else if (sourceType === 'synthetic') {
                    
                }

                newbug.updateStats({ etlEnded: true, etlDuration: true });
                console.log(newbug.report());
            }
            
        }
    }
}