import Newbug from '../newbug.js';
import { connect } from './dbconn.js';
import { createInsertTreatments } from './createInsertTreatments.js';
import fs from 'fs';
import path from 'path';
import * as utils from '../../../../lib/utils.js';
import cliProgress from 'cli-progress';

// see https://github.com/cheeriojs/cheerio/issues/2786#issuecomment-1288843071
import * as cheerio from 'cheerio';
import { parseTreatment } from '../parse/lib/treatment.js';

export default class NewbugDb extends Newbug {
    constructor(conf) {
        super(conf);
        
        this.db = connect({
            dir: this.config.db.dir, 
            main: this.config.db.main, 
            archive: this.config.db.archive, 
            reinitialize: this.config.db.reinitialize, 
            logger: this.logger
        });
        this.insertTreatments = createInsertTreatments(this.db);
    }

    parseOneFileOld(source) {
        const start = process.hrtime.bigint();

        // We have to determine that the source is a valid XML file because 
        // the 'parseOneFile' action works only with files
        if (!source) {

            // Since source was not provided via the CLI, we determine the 
            // value of source based on 'typeOfArchive' and 'sources'
            const typeOfArchive = this.config.typeOfArchive;
            const dir = this.config.dirs.dumps;
            source = `${dir}/xmls/${this.config.sources[typeOfArchive]}.xml`;
        }

        const treatmentId = this.utils.isValidXML(source, this.stats);

        if (treatmentId) {
            const treatmentExists = this.checkTreatmentExists(treatmentId);

            if (!treatmentExists) {
                const xml = fs.readFileSync(source, 'utf8');
                const cheerioOpts = { normalizeWhitespace: true, xmlMode: true };
                const $ = cheerio.load(xml, cheerioOpts, false);
                $.prototype.cleanText = function () {
                    let str = this.text();
                    str = str.replace(/\s+/g, ' ');
                    str = str.replace(/\s+,/g, ',');
                    str = str.replace(/\s+:/g, ':');
                    str = str.replace(/\s+\./g, '.');
                    str = str.replace(/\(\s+/g, '(');
                    str = str.replace(/\s+\)/g, ')');
                    str = str.trim();
                    return str;
                };

                // treatment JSON
                const t = parseTreatment($);

                // Save a copy of the XML and the JSON in the treatment obj
                // so we can insert it in the archives.treatmentsDump table
                t.json = JSON.stringify(t);
                t.xml = xml;

                // Update the statistics
                this.stats.treatments++;
                this.stats.treatmentCitations += t.treatmentCitations.length; 
                this.stats.materialCitations += t.materialCitations.length;
                t.materialCitations.forEach(m => {
                    this.stats.collectionCodes += m.collectionCodes.length;
                });
                this.stats.figureCitations += t.figureCitations.length;
                this.stats.bibRefCitations += t.bibRefCitations.length;
                this.stats.treatmentAuthors += t.treatmentAuthors.length;
                //this.stats.journals += treatment.journals.length;
                
                const end = process.hrtime.bigint();

                t.timeToParseXML = (Number(end - start) * 1e-6).toFixed(2);
                return t
            }
            
        }
        else {
            return false;
        }
    }

    getCounts() {
        this.logger.info(`getting counts`);
        
        const tableOfCounts = this.db.prepare(`
            SELECT schema, name 
            FROM pragma_table_list 
            WHERE type = 'table' AND NOT name glob 'sqlite_*'
        `).all();

        tableOfCounts.forEach(table => {
            const t = `${table.schema}.${table.name}`;
            const sql = `SELECT Count(*) AS count FROM ${t}`;
            table.count = this.db.prepare(sql).get().count;
        });
        
        
        const total = tableOfCounts.map(({ name, count }) => count)
            .reduce((accumulator, initialValue) => accumulator + initialValue);
        tableOfCounts.push({ 
            name: '='.repeat(34), 
            count: '='.repeat(5) 
        });
        tableOfCounts.push({ 
            name: 'total', 
            count: total 
        });
        return tableOfCounts;
    }

    getArchiveUpdates() {
        this.logger.info(`getting archive updates`);
        const typesOfArchives = { 
            'full': 0,
            'monthly': 0,
            'weekly': 0,
            'daily': 0
        };
        
        // https://stackoverflow.com/a/9763769/183692
        const msToTime = (s) => {
        
            // Pad to 2 or 3 digits, default is 2
            function pad(n, z) {
                z = z || 2;
                return ('00' + n).slice(-z);
            }
        
            const ms = s % 1000;
            s = (s - ms) / 1000;

            const ss = s % 60;
            s = (s - ss) / 60;

            const mm = s % 60;
            const hh = (s - mm) / 60;
            
            return `${pad(hh)}h ${pad(mm)}m ${pad(ss)}s ${pad(ms, 3)}ms`;
        }

        const stm = `
            SELECT 
                *, 
                etlEnded - etlStarted AS duration
            FROM arc.archivesView
            WHERE id IN (
                SELECT max(id) 
                FROM arc.archives 
                GROUP BY typeOfArchive
            )
    `;
        const lastUpdate = this.db.prepare(stm).all();
        return lastUpdate
    }

    load(treatments) {
        //this.logger.info(`loading ${treatments.length} treatments`);
        this.insertTreatments(treatments, this.stats)
    }

    selCountOfTreatments() {
        this.logger.info('getting count of treatments already in the db');
        return this.db.prepare(`
            SELECT Count(*) AS num 
            FROM treatments
        `).get().num
    }

    checkTreatmentExists(treatmentId) {
        this.logger.debug('checking if treatment exists');
        const res = this.db.prepare(`
            SELECT id 
            FROM treatments
            WHERE treatmentId = @treatmentId
        `).get({ treatmentId });

        if (res) {
            return true;
        }
        else {
            return false;
        }
    }

    storeTreatmentJSON({ treatmentId, xml, json }) {
        this.logger.debug('storing treatment json in archive');
        return this.db.prepare(`
            INSERT INTO arc.treatments (treatmentId, xml, json)
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
                            this.storeTreatmentJSON({
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
            this.logger.info(`loaded ${treatments.length} treatments`);
        }
        else if (entry.isFile()) {
            const treatment = this.xml(source);
            this.load([treatment]);
        }
    }

    getLastUpdate = () => {
        return this.db.prepare(`
            SELECT 
                a.typeOfArchive, a.dateOfArchive, 
                e.started, e.ended, e.ended - e.started AS duration, e.treatments,
                e.treatmentCitations, e.materialCitations, e.figureCitations,
                e.bibRefCitations, e.treatmentAuthors, e.collectionCodes, e.journals
            FROM 
                arc.archives a
                JOIN arc.etl e ON a.id = e.archives_id 
            WHERE a.id IN (
                SELECT max(id) 
                FROM arc.archives 
                GROUP BY typeOfArchive
            ) 
            ORDER BY a.id
        `).all();
    }

    insertEtl = () => {
        this.db.prepare(`
            INSERT INTO arc.etl (
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
            INSERT INTO arc.downloads (
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

    insertArchives = (stats) => {
        this.db.prepare(`
            INSERT INTO arc.archivesView (
                typeOfArchive,
                dateOfArchive,
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
                @dateOfArchive,
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

    processDir(source) {
        const files = fs.readdirSync(source);

        if (files) {
            let counter = 0;
            const treatments = [];

            for (let file of files) {
                file = `${source}/${file}`;
                const treatment = this.parseFile(file);
                
                if (treatment) {
                    counter++;
                    treatments.push(treatment);
                }

                if (!(counter % batch)) {
                    load(treatments);
                    treatments.length = 0;
                }
            }
        }
    }
}