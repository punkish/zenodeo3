import minimist from 'minimist';
import { showPrompt } from './lib/prompt.js';
import Newbug from './lib/newbug.js';

/*
--
--source=/path/to/dir/file.xml
--source=/path/to/dir
--source=synthetic(45)
--typeOfArchive=file
--typeOfArchive=dir
--typeOfArchive=tb

--action=parseOne --source=/path/to/treatment.xml
--action=parseOne --typeOfArchive=file
action: parse/etl
typeOfArchive: xml
source: /path/to/treatment.xml
source: `${dirs.dumps}/xmls/${sources.xml}.xml`

typeOfArchive: tb
source: /path/to/xmls
source: `${dirs.archive}/${sources.yearly}`
        `${dirs.archive}/${sources.monthly}`
        `${dirs.archive}/${sources.weekly}`
        `${dirs.archive}/${sources.daily}`
        
typeOfArchive: synthetic
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
    const force = argv.force ?? false;
    const newbug = new Newbug(argv);

    // Terminal width for the console messages
    const tw = 95;
    
    if (action === 'etl') {
        const typeOfArchive = await newbug.utils.determineArchiveType(source);

        if (typeOfArchive) {

            console.log('-'.repeat(tw));
            const mode = (argv.mode ?? 'dry run').toUpperCase();
            let d = new Date().toUTCString();
            newbug.logger.info(`ETL started at ${d} mode ${mode}`);
            console.log('-'.repeat(tw));

            newbug.initEtl();

            if (typeOfArchive === 'tb') {

                // We clean up the working directories
                newbug.utils.checkDir({
                    dir: `${newbug.config.dirs.data}/treatments-archive`
                });

                newbug.utils.checkDir({
                    dir: `${newbug.config.dirs.data}/treatments-dumps`
                });

                // Find the last instance of tbArchive ETL
                const lastUpdateTypes = newbug.getLastTbUpdate();
                await newbug.processArchives(lastUpdateTypes);
            }
            else if (typeOfArchive === 'synthetic') {

            }
            else {

                if (typeOfArchive === 'file') {
                    newbug.processFile(source);
                }
                else if (typeOfArchive === 'dir') {
                    newbug.processDir(source);
                }

            }

            newbug.endEtl();

            console.log('-'.repeat(tw));
            d = new Date().toUTCString();
            newbug.logger.info(`ETL ended at ${d}`);
            console.log('-'.repeat(tw));

            console.log(newbug.report('etl'));
        }
        else {
            console.error(`${source} has to be a valid source`);
        }
        
    }
    else {

        if (action === 'getCounts') {
            const counts = newbug.getCounts();
            console.table(counts);
        }
        else if (action === 'getArchiveUpdates') {
            const archiveUpdates = newbug.getArchiveUpdates();
            console.table(archiveUpdates);
        }
        else if (action === 'parseFile') {
            const treatment = newbug.parseFile(source, force);
            console.log(treatment);
        }
        else {
            console.error('unable to carry out any known action');
        }

    }
    
}