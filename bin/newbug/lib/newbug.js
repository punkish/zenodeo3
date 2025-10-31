import fs from 'fs';
import path from 'path';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
//import Zlogger from '@punkish/zlogger';
import Zlogger from '../../../../zlogger/index.js';
import * as utils from './utils/index.js';
//import { getPattern } from '../../../lib/utils.js';
import { connect } from './database/dbconn.js';
import { createInsertTreatments } from './database/createInsertTreatments.js';

// see https://github.com/cheeriojs/cheerio/issues/2786#issuecomment-1288843071
import * as cheerio from 'cheerio';
import { parseTreatment } from './parse/lib/treatment.js';

import cliProgress from 'cli-progress';

export default class Newbug {
    constructor(conf) {

        // Import a copy of the newbug config…
        this.config = JSON.parse(JSON.stringify(config.newbug));

        // and update it with any conf values passed in with initialization
        if (conf) {            
            this.config = Object.assign(
                {},
                this.config,
                conf
            );
        }

        // Initialize the logger
        this.logger = new Zlogger(this.config.logger);

        this.db = connect({
            dir: this.config.db.dir, 
            main: this.config.db.main, 
            archive: this.config.db.archive, 
            reinitialize: this.config.db.reinitialize, 
            logger: this.logger
        });

        this.insertTreatments = createInsertTreatments(this.db);

        // A stats object to store the number of treatments and 
        // its components extracted from the XMLs
        this.stats = {

            // ETL process related stats
            sourceType: '',
            sourceName: '',
            dateOfArchive: 0,
            sizeOfArchive: 0,
            downloadStarted: 0,
            downloadEnded: 0,
            unzipStarted: 0,
            unzipEnded: 0,
            numOfFiles: 0,
            etlStarted: 0,
            etlEnded: 0,
            etlDuration: 0,

            // Counts of treatments and treatment parts ETLed
            skipped: 0,
            treatments: 0,
            treatmentCitations: 0,
            materialCitations: 0,
            collectionCodes: 0,
            figureCitations: 0,
            bibRefCitations: 0,
            treatmentAuthors: 0,
            journals: 0
        };

        this.utils = { 
            ...utils, 
            determineSourceType: utils.determineSourceType.bind(this) 
        }
    }

    report() {
        let msg = `
***************************************
ETL process took ${this.stats.etlDuration} ms
---------------------------------------
        `;

        if (this.stats.skipped) {
            msg += `
Skipped ${this.stats.skipped} treatments
            `;
        }
        else {
            msg += `
Loaded ${this.stats.treatments} treatments with
  treatmentCitations: ${this.stats.treatmentCitations}
  materialCitations : ${this.stats.materialCitations}
  collectionCodes   : ${this.stats.collectionCodes}
  figureCitations   : ${this.stats.figureCitations}
  bibRefCitations   : ${this.stats.bibRefCitations}
  treatmentAuthors  : ${this.stats.treatmentAuthors}
            `;
        }

        msg += `
=======================================
        `;

        return msg;
    }

    updateStats({ 
        numOfFiles, 
        sourceType, 
        sourceName, 
        dateOfArchive,
        treatment, 
        etlStarted=false,
        etlEnded=false,
        etlDuration=false,
        skipped=false, 
        etlId=false 
    }) {

        if (etlStarted) {
            this.stats.etlStarted = process.hrtime.bigint();
        }

        if (etlEnded) {
            this.stats.etlEnded = process.hrtime.bigint();
        }

        if (etlDuration) {
            const etlDuration = Number(
                this.stats.etlEnded - this.stats.etlStarted
            );

            this.stats.etlDuration = (etlDuration * 1e-6).toFixed(2);
        }

        if (skipped) {
            this.stats.skipped++;
        }

        if (numOfFiles) {
            this.stats.numOfFiles = numOfFiles;
        }

        if (treatment) {
            this.stats.treatments++;
            this.stats.treatmentCitations += treatment.treatmentCitations.length; 
            this.stats.materialCitations += treatment.materialCitations.length;
            treatment.materialCitations.forEach(m => {
                this.stats.collectionCodes += m.collectionCodes.length;
            });
            this.stats.figureCitations += treatment.figureCitations.length;
            this.stats.bibRefCitations += treatment.bibRefCitations.length;
            this.stats.treatmentAuthors += treatment.treatmentAuthors.length;
            //this.stats.journals += treatment.journals.length;
        }

        if (sourceType) {
            this.stats.sourceType = sourceType;
        }

        if (sourceName) {
            this.stats.sourceName = sourceName;
        }

        if (dateOfArchive) {
            this.stats.dateOfArchive = dateOfArchive;
        }

        if (etlId) {
            this.stats.etlId = this.db.prepare(`
                SELECT Coalesce(Max(id), 0) + 1 AS id FROM archive.etl
            `).get().id;
        }
        
    }

    parseFile(file, force=false) {

        // check if the file is a valid treatment xml
        // given '/path/to/treatmentId.xml'
        // treatmentId regular expression
        const re = /^[a-zA-Z0-9]{32}$/;
        const extname = '.xml';

        if (path.extname(file) === extname) {
            const treatmentId = path.basename(file, extname);

            if (re.test(treatmentId)) {
                
                // since we got back a treatmentId, the file is valid so
                // we proceed
                if (force) {
                    return this.xml2json(file);
                }
                else {

                    // check if the treatment already exists in the db
                    const treatmentExists = this.checkTreatmentExists(treatmentId);

                    if (treatmentExists) {
                        this.updateStats({ skipped: true });
                        return false;
                    }

                    // process only if the treatment does not exist
                    else {
                        return this.xml2json(file);
                    }
                }

            }
            else {
                console.error('file name is not a valid treatmentId');
            }

        }
        else {

            // provided file is not a valid XML
            return false;
        }
    }

    xml2json(file) {
        const start = process.hrtime.bigint();
        const xml = fs.readFileSync(file);
        const cheerioOpts = { normalizeWhitespace: true, xmlMode: true };
        const $ = cheerio.loadBuffer(xml, cheerioOpts, false);
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
        const treatment = parseTreatment($);

        // Save a copy of the XML and the JSON in the treatment obj
        // so we can insert it in the archives.treatmentsDump table
        treatment.json = JSON.stringify(treatment);
        treatment.xml = xml;

        const end = process.hrtime.bigint();

        treatment.timeToParseXML = (Number(end - start) * 1e-6).toFixed(2);

        // Update the statistics
        this.updateStats({ treatment });

        return treatment;
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
            FROM archive.archivesView
            WHERE id IN (
                SELECT max(id) 
                FROM archive.archives 
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
            INSERT INTO archive.treatments (treatmentId, xml, json)
            VALUES (@treatmentId, @xml, @json)
        `).run({ treatmentId, xml, json });
    }

    getLastUpdate = () => {
        return this.db.prepare(`
            SELECT 
                a.typeOfArchive, a.dateOfArchive, 
                e.started, e.ended, e.ended - e.started AS duration, e.treatments,
                e.treatmentCitations, e.materialCitations, e.figureCitations,
                e.bibRefCitations, e.treatmentAuthors, e.collectionCodes, e.journals
            FROM 
                archive.archives a
                JOIN archive.etl e ON a.id = e.archives_id 
            WHERE a.id IN (
                SELECT max(id) 
                FROM archive.archives 
                GROUP BY typeOfArchive
            ) 
            ORDER BY a.id
        `).all();
    }

    insertEtl = () => {
        this.db.prepare(`
            INSERT INTO archive.etl (
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
            INSERT INTO archive.downloads (
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
            INSERT INTO archive.archivesView (
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

    processDir(source, force) {
        this.logger.info('source is a directory');
        const files = fs.readdirSync(source);

        if (files) {
            const numOfFiles = files.length;
            const batch = 5000;
            let counter = 1;
            const treatments = [];

            // create a new progress bar instance and use the legacy theme
            const bar = new cliProgress.SingleBar(
                {}, cliProgress.Presets.legacy
            );
            
            // bar.start(total, start);
            bar.start(numOfFiles, 0);

            this.updateStats({ numOfFiles, etlId: true });

            for (let file of files) {
                file = `${source}/${file}`;
                const treatment = this.parseFile(file, force);
                
                if (treatment) {
                    bar.increment();
                    bar.update(counter);
                    counter++;
                    treatments.push(treatment);
                }

                if (!(counter % batch)) {
                    this.load(treatments);
                    treatments.length = 0;
                }
            }

            this.load(treatments);
            bar.stop();
            this.logger.info(`loaded ${treatments.length} treatments`);
        }
    }
}