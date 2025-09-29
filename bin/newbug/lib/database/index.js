import Parse from '../parse/index.js';
import { connect } from './dbconn.js';
import { createInsertTreatments } from './createInsertTreatments.js';
import fs from 'fs';
import path from 'path';
import * as utils from '../../../../lib/utils.js';
import cliProgress from 'cli-progress';

export default class NewbugDatabase extends Parse {
    constructor({ loglevel, dbfile, alias, reinitialize=false }) {
        super({ loglevel });
        this.db = connect(dbfile, alias, this.log, reinitialize);
        this.alias = alias;
        this.insertTreatments = createInsertTreatments(this.db);
    }

    getCounts() {
        this.log.info(`getting counts`);
        
        const tables = this.db.prepare(`
            SELECT name 
            FROM pragma_table_list 
            WHERE 
                type = 'table' 
                AND NOT name glob 'sqlite_*'
        `).all();

        // function getCount(table, db) {
        //     return db.prepare(`SELECT Count(*) AS count FROM ${table}`)
        //         .get().count
        // }
        

        tables.forEach(t => {
            //table.count = getCount(table.name, this.db);
            t.count = this.db.prepare(`SELECT Count(*) AS count FROM ${t}`)
                .get().count;
        });
        
        const total = tables.map(({ name, count }) => count)
            .reduce((acc, init) => acc + init);
        tables.push({ name: '='.repeat(34), count: '='.repeat(5) });
        tables.push({ name: 'total', count: total });
        return tables;
    }

    getArchiveUpdates() {
        this.log.info(`getting archive updates`);
    }

    load(treatments) {
        //this.log.info(`loading ${treatments.length} treatments`);
        this.insertTreatments(treatments)
    }

    selCountOfTreatments() {
        this.log.info('Getting count of treatments already in the db… ');
        return this.db.prepare(`
            SELECT Count(*) AS num 
            FROM treatments
        `).get().num
    }

    checkTreatment(treatmentId) {
        this.log.debug('Getting json of existing treatment');
        return this.db.prepare(`
            SELECT json 
            FROM ${this.alias}.treatments
            WHERE treatmentId = @treatmentId
        `).get({ treatmentId });
    }

    logTreatment({ treatmentId, xml, json }) {
        this.log.debug('Logging json of treatment in archive');
        return this.db.prepare(`
            INSERT INTO ${this.alias}.treatments (treatmentId, xml, json)
            VALUES (@treatmentId, @xml, @json)
        `).run({ treatmentId, xml, json });
    }

    async etl(source, isDbEmpty=false) {
        const entry = fs.lstatSync(source);
    
        if (entry.isDirectory()) {
    
            // create a new progress bar instance and use the legacy theme
            const bar = new cliProgress.SingleBar(
                {}, cliProgress.Presets.legacy
            );
            const dirEntries = fs.readdirSync(source, { withFileTypes: true });
            const re = utils.getPattern('treatmentId');
            const treatments = [];
            const batch = 5000;
            let count = 1;
    
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
    
                        // if db is not empty,
                        // check if entry already exists in the db
                        if (!isDbEmpty) {
                            const json = this.checkTreatment(basename);
                            if (json) continue;
                        }
                        
                        const xmlfile = path.join(source, entry.name);
                        const xmlContent = fs.readFileSync(xmlfile, 'utf8');
                        const treatment = this.xml(xmlContent);
    
                        if (isDbEmpty) {
                            this.logTreatment({
                                treatmentId: basename,
                                xml: xmlContent,
                                json: JSON.stringify(treatment)
                            });
                        }
                        
                        treatments.push(treatment);
    
                        if (!(count % batch)) {
                            this.load(treatments);
                        }
    
                        bar.increment();
                        bar.update(count);
                        count++;
                    }
                }
            }
    
            this.load(treatments);
            bar.stop();
            this.log.info(`loaded ${treatments.length} treatments`);
        }
        else if (entry.isFile()) {
            const treatment = this.xml(source);
            this.load([treatment]);
        }
    }

    getLastUpdate = () => {
        const stm = `
SELECT 
    a.typeOfArchive, 
    a.timeOfArchive, 
    a.started, 
    a.ended, 
    a.ended - a.started AS duration,
    a.treatments,
    a.treatmentCitations,
    a.materialCitations,
    a.figureCitations,
    a.bibRefCitations,
    a.treatmentAuthors,
    a.collectionCodes,
    a.journals
FROM 
    ${this.alias}.archives a
    JOIN ${this.alias}.etl e ON a.id = e.archives_id 
WHERE a.id IN (
    SELECT max(id) 
    FROM ${this.alias}.archives 
    GROUP BY typeOfArchive
) 
ORDER BY a.id
        `;
        return this.db.prepare(stm).all();
    }

    insertEtl = () => {
        this.db.prepare(`
INSERT INTO ${this.alias}.etl (
    archives_id,
    started, 
    ended, 
    treatments,
    treatmentCitations,
    materialCitations,
    figureCitations,
    bibRefCitations,
    treatmentAuthors,
    collectionCodes,
    journals
) 
VALUES (
    @archives_id,
    @started, 
    @ended, 
    @treatments,
    @treatmentCitations,
    @materialCitations,
    @figureCitations,
    @bibRefCitations,
    @treatmentAuthors,
    @collectionCodes,
    @journals
)
        `)
    }

    insertDownloads = () => {
        this.db.prepare(`
INSERT INTO ${this.alias}.downloads (
    archives_id, 
    started, 
    ended
) 
VALUES (
    @archives_id, 
    @started, 
    @ended
)
        `)
    }

    insertArchives = () => {
//         this.db.prepare(`
// INSERT INTO archives (
//     typeOfArchive, 
//     timeOfArchive,
//     sizeOfArchive
// ) 
// VALUES (
//     @typeOfArchive, 
//     @timeOfArchive,
//     @sizeOfArchive
// )
//         `)
        this.db.prepare(`
INSERT INTO ${this.alias}.archivesView (
    typeOfArchive,
    timeOfArchive,
    sizeOfArchive,
    unzipStarted,
    unzipEnded,
    numOfFiles,
    downloadStarted,
    downloadEnded,
    etlStarted,
    etlEnded,
    treatments,
    treatmentCitations,
    materialCitations,
    figureCitations,
    bibRefCitations,
    treatmentAuthors,
    collectionCodes,
    journals
)
VALUES (
    @typeOfArchive,
    @timeOfArchive,
    @sizeOfArchive,
    @unzipStarted,
    @unzipEnded,
    @numOfFiles,
    @downloadStarted,
    @downloadEnded,
    @etlStarted,
    @etlEnded,
    @treatments,
    @treatmentCitations,
    @materialCitations,
    @figureCitations,
    @bibRefCitations,
    @treatmentAuthors,
    @collectionCodes,
    @journals
)
        `)
    }

    insertUnzip = () => {
        this.db.prepare(`
INSERT INTO unzip (
    archives_id, 
    started, 
    ended,
    numOfFiles
) 
VALUES (
    @archives_id, 
    @started, 
    @ended,
    @numOfFiles
)
        `)
    }
}

// const database = new Database({ loglevel: 'debug' });

// database.getLastUpdate();
// database.dropIndexes();
// database.buildIndexes();
// database.analyzeDb();

// database.getLastUpdate();
// database.insertStats();
// database.getDaysSinceLastEtl();
// database.getCounts();
// database.getArchiveUpdates();
// database.updateIsOnLand();