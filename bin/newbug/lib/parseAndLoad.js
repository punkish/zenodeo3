import fs from 'fs';
import path from 'path';
import * as utils from '../../../lib/utils.js';
import cliProgress from 'cli-progress';
// import Newbug from './newbug.js';
// import Parse from './parse/index.js';

export async function parseAndLoad(source, parse, database, isDbEmpty=false) {
    //const parse = new Parse({ loglevel: 'info' });
    const entry = fs.lstatSync(source)

    if (entry.isDirectory()) {
        const re = utils.getPattern('treatmentId');
        const treatments = [];
        const batch = 5000;
        let count = 1;

        // create a new progress bar instance and use the legacy theme
        const bar = new cliProgress.SingleBar({}, cliProgress.Presets.legacy);
        const dirEntries = fs.readdirSync(source, { withFileTypes: true });

        // set the total and start values for the progress bar
        const total = dirEntries.length;
        const start = 0;
        bar.start(total, start);

        for await (const entry of dirEntries) {
            const isXml = path.extname(entry.name) === '.xml';

            if (isXml) {
                const basename = path.basename(entry.name, '.xml');
                const isTreatmentId = re.test(basename);

                if (isTreatmentId) {

                    if (!isDbEmpty) {

                        // check if entry already exists in the db
                        const json = database.checkTreatment(basename);
                        
                        if (json) continue;
                    }
                    
                    const xmlfile = path.join(source, entry.name);
                    const xmlContent = fs.readFileSync(xmlfile, 'utf8');
                    const treatment = parse.xml(xmlContent);

                    if (isDbEmpty) {
                        database.logTreatment({
                            treatmentId: basename,
                            xml: xmlContent,
                            json: JSON.stringify(treatment)
                        });
                    }
                    
                    treatments.push(treatment);

                    if (!(count % batch)) {
                        database.load(treatments);
                    }

                    bar.increment();
                    bar.update(count);
                    count++;
                }
            }
        }

        database.load(treatments);
        bar.stop();
        database.log.info(`loaded ${treatments.length} treatments`);
    }
    else if (entry.isFile()) {
        const treatment = parse.xml(source);
        database.load([treatment]);
    }
}