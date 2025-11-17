import fs from 'fs';
import path from 'path';
import got from 'got';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
//import Zlogger from '@punkish/zlogger';
import Zlogger from '../../../../zlogger/index.js';
import * as utils from './utils/index.js';
import { connect } from './db/dbconn.js';
import { createInsertTreatments } from './db/createInsertTreatments.js';

// see https://github.com/cheeriojs/cheerio/issues/2786#issuecomment-1288843071
import * as cheerio from 'cheerio';
import { parseTreatment } from './parse/lib/treatment.js';
import cliProgress from 'cli-progress';
import { execSync } from 'child_process';
import { pipeline as streamPipeline } from 'node:stream/promises';
import colors from 'ansi-colors';

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
            typeOfArchive: '',
            nameOfArchive: '',
            dateOfArchive: 0,
            sizeOfArchive: 0,
            numOfFiles: 0,
            d0: null,
            d1: null,
            duration: 0,
            etlStarted: 0,
            etlEnded: 0,

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

        // Cannot reassign properties on the module namespace (import * as 
        // utils) at it is read-only. Making a shallow copy and replacing 
        // the functions is a safe way to keep other helpers.
        this.utils = { 
            ...utils, 
            determineArchiveType: utils.determineArchiveType.bind(this),
            checkDir: utils.checkDir.bind(this)
        }

        this.typesOfArchives = [
            'yearly', 'monthly', 'weekly', 'daily'
        ];
    }

    reinitializeStats() {
        this.stats.treatments = 0;
        this.stats.treatmentCitations = 0;
        this.stats.materialCitations = 0;
        this.stats.collectionCodes = 0;
        this.stats.figureCitations = 0;
        this.stats.bibRefCitations = 0;
        this.stats.treatmentAuthors = 0;
        this.stats.journals = 0
    }

    report() {
        const w = 69;
        const numOfFiles = this.stats.numOfFiles;
        const duration = this.stats.duration;
        let tpf = '';
        
        if (numOfFiles > 0) {
            tpf = `(${(duration / numOfFiles).toFixed(2)} ms/file)`;
        }
        
        let msg = `
    ${'='.repeat(w)}
    Processed ${numOfFiles} files in ${duration} ms ${tpf}
    ${'-'.repeat(w)}
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
    ${'*'.repeat(w)}
        `;

        return msg;
    }

    updateStats({ 
        typeOfArchive, 
        nameOfArchive, 
        dateOfArchive,
        sizeOfArchive,
        downloadStarted,
        downloadEnded,
        unzipStarted,
        unzipEnded,
        numOfFiles,
        etlStarted=false,
        etlEnded=false,
        skipped=false,
        treatment
    }) {
        if (typeOfArchive) this.stats.typeOfArchive = typeOfArchive;
        if (nameOfArchive) this.stats.nameOfArchive = nameOfArchive;
        if (dateOfArchive) this.stats.dateOfArchive = dateOfArchive;
        if (sizeOfArchive) this.stats.sizeOfArchive = sizeOfArchive;
        if (numOfFiles) this.stats.numOfFiles = numOfFiles;

        if (etlStarted) {
            
            // We store etlStarted as '2025-11-11 13:39:41'
            this.stats.d0 = new Date();
            const [date, time] = this.stats.d0.toISOString().split('T');
            this.stats.etlStarted = `${date} ${time.split('.')[0]}`;
            this.stats.etlId = this.db.prepare(`
                SELECT Coalesce(Max(id), 0) + 1 AS id FROM arc.etl
            `).get().id;
        }

        if (etlEnded) {
            
            // We store etlEnded as '2025-11-11 13:39:41'
            this.stats.d1 = new Date();
            const [date, time] = this.stats.d1.toISOString().split('T');
            this.stats.etlEnded = `${date} ${time.split('.')[0]}`;
            this.stats.duration = this.stats.d1 - this.stats.d0;
        }

        if (skipped) this.stats.skipped++;

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
                this.logger.error('file name is not a valid treatmentId');
            }

        }
        else {

            // provided file is not a valid XML
            this.logger.error('provided file is not XML');
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

    load(treatments) {
        this.insertTreatments(treatments, this.stats);
        this.reinitializeStats();
    }

    // selCountOfTreatments() {
    //     this.logger.info('getting count of treatments already in the db');
    //     return this.db.prepare(`
    //         SELECT Count(*) AS num 
    //         FROM treatments
    //     `).get().num
    // }

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

    getLastTbUpdate() {

        // If no archives have ever been ETLed, the following 
        // defaultTypeOfArchives will initialize the process
        const defaultTypeOfArchives = [
            { 
                nameOfArchive: 'yearly', 
                dateOfArchive: undefined, 
                sizeOfArchive: undefined 
            },
            { 
                nameOfArchive: 'monthly', 
                dateOfArchive: undefined, 
                sizeOfArchive: undefined 
            },
            { 
                nameOfArchive: 'weekly', 
                dateOfArchive: undefined, 
                sizeOfArchive: undefined 
            },
            { 
                nameOfArchive: 'daily', 
                dateOfArchive: undefined, 
                sizeOfArchive: undefined 
            }
        ];

        // ROW_NUMBER() keeps the latest per type by assigning row numbers 
        // ordered by id DESC per typeOfArchive, and keeping only the first 
        // (rn = 1), i.e., the most recent for each type.
        // The CASE expression defines a custom sort order
        let res = this.db.prepare(`
            SELECT nameOfArchive, dateOfArchive, sizeOfArchive
            FROM (
                SELECT 
                    nameOfArchive, 
                    dateOfArchive, 
                    sizeOfArchive,
                    ROW_NUMBER() OVER (
                        PARTITION BY nameOfArchive
                        ORDER BY id DESC
                    ) AS rn
                FROM etl
                WHERE nameOfArchive IN ('yearly', 'monthly', 'weekly', 'daily')
            )
            WHERE rn = 1
            ORDER BY
                CASE nameOfArchive
                    WHEN 'yearly' THEN 1
                    WHEN 'monthly' THEN 2
                    WHEN 'weekly' THEN 3
                    WHEN 'daily' THEN 4
                END
        `).all();
        
        if (res.length) {

            // Convert res into a lookup map that makes it fast to find a 
            // matching archive by name
            const dataMap = Object.fromEntries(
                res.map(item => [item.nameOfArchive, item])
            );

            // Iterate over defaults looking for a matching entry in the 
            // lookup for each default type
            return defaultTypeOfArchives.map(def => ({
                ...def,

                // overwrites defaults if data exists
                ...dataMap[def.nameOfArchive]  
            }));
        }
        else {
            return defaultTypeOfArchives;
        }
        
    }

    processFile(file, force=false) {
        const treatment = this.parseFile(file, force);

        // if we got a treatment, the source was a valid file so load it
        if (treatment) {
            this.load([ treatment ]);
        }
    }

    processDir(dir, force) {
        this.logger.info(`processing "${this.utils.snipDir(dir, '/Users/punkish/Projects/zenodeo3')}"`);
        const files = fs.readdirSync(dir);

        if (files) {
            const numOfFiles = files.length;
            const batch = 5000;
            let counter = 1;
            const treatments = [];

            // create a new progress bar instance and use a color theme
            console.log('');  // <--- an empty line before the progress bar
            const bar = new cliProgress.SingleBar({
                format: 'ETL Progress |' + colors.cyan('{bar}') + '| {percentage}% || {value}/{total} treatments || Speed: {speed}',
                barCompleteChar: '\u2588',
                barIncompleteChar: '\u2591',
                hideCursor: true
            });
            
            // bar.start(total, start);
            bar.start(numOfFiles, 0, { speed: "N/A" });
            this.updateStats({ numOfFiles, etlId: true });

            for (let file of files) {
                file = `${dir}/${file}`;
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

            bar.stop();
            console.log('');  // <--- any empty line after the progress bar
            this.logger.info(`loaded ${this.stats.treatments} treatments`);
            this.load(treatments);
        }
    }

    async processArchives(lastUpdatedArchives) {

        for (const archive of lastUpdatedArchives) {
            console.log('-'.repeat(105))

            if (archive.dateOfArchive) {
                this.logger.info(`a "${archive.nameOfArchive}" archive was processed on "${archive.dateOfArchive}"`);
                this.logger.info(`checking if a newer version is available…`);
            }
            else {
                this.logger.info(`a "${archive.nameOfArchive}" archive has never been processed`);
                this.logger.info(`checking if a "${archive.nameOfArchive}" archive is on the server…`);
            }

            const downloadedArchive = await this.download(archive);

            // unzip archive, if needed, and read the files into an array
            if (downloadedArchive) {
                const dir = this.unzip(downloadedArchive);
                const { dirSize, files } = await this.utils.getDirSize(dir);
                const stat = fs.statSync(dir);

                this.updateStats({
                    typeOfArchive: 'tb',
                    nameOfArchive: archive.nameOfArchive,
                    dateOfArchive: stat.birthtime.toDateString(),
                    sizeOfArchive: Number(dirSize),
                    numOfFiles: files.length,
                    etlId: true
                });

                this.processDir(dir);
            }
            
        }

        // clean up old archive
        //this.cleanOldArchive();

        // const firstRun = false;
        // if (firstRun) {
            //this.buildIndexes();
            //this.analyzeDb();
        //}

    }

    buildIndexes() {
        this.db.exec(`
BEGIN TRANSACTION;

CREATE INDEX figureCitations_treatmentsId ON figureCitations(treatments_id);
CREATE INDEX materialCitations_treatmentsId ON materialCitations(treatments_id);
CREATE INDEX figureCitations_images ON figureCitations(
    id,
    treatments_id,
    httpUri,
    captionText
);
CREATE INDEX treatments_images ON treatments(
    id,
    treatmentId,
    treatmentTitle,
    treatmentDOI,
    zenodoDep,
    articleTitle,
    articleAuthor
);
CREATE INDEX materialCitations_images ON materialCitations(
    treatments_id,
    latitude,
    longitude
);
CREATE INDEX treatments_orders ON treatments(orders_id);
CREATE INDEX treatments_classes ON treatments(classes_id);
CREATE INDEX treatments_families ON treatments(families_id);
CREATE INDEX treatments_binomens ON treatments(rank, genera_id, species_id);

COMMIT;
        `);
    }

    async download({ nameOfArchive, dateOfArchive, sizeOfArchive }) {

        // Create the name of the remote archive based on the name passed
        // to the method. One of the following
        // - yearly: plazi.zenodeo.zip
        // - monthly: plazi.zenodeo.monthly.zip
        // - weekly: plazi.zenodeo.weekly.zip
        // - daily: plazi.zenodeo.daily.zip
        const nameOfRemoteArchive = nameOfArchive === 'yearly' 
            ? 'plazi.zenodeo.zip'
            : `plazi.zenodeo.${nameOfArchive}.zip`;
        const serverHostname = this.config.server.hostname;
        const serverPath = this.config.server.path;
        const url = `${serverHostname}/${serverPath}/${nameOfRemoteArchive}`;

        // The actual download routine that will be used if the right 
        // archive is on the TB server
        const _download = async (archiveName, url) => {
            archiveName = `${archiveName}.zip`;
            const localCopy = `data/zips/${archiveName}`;
            this.logger.info(`checking if there is already a local copy…`);

            if (fs.existsSync(localCopy)) {
                this.logger.info(`    ✅ found "${archiveName}" on the disk`);
            }
            else {
                this.logger.info(`    ❌ there is no "${archiveName}" locally`);
                this.logger.info(`    ⬇️ downloading "${archiveName}"`);

                if (this.config.mode !== 'dryRun') {
                    await streamPipeline(
                        got.stream(url),
                        fs.createWriteStream(localCopy)
                    );
                }
            }

        };

        try {
            const res = await got(url, { method: 'HEAD' });
            const headers = res.headers;
            const date = new Date(headers['last-modified']);
            const dateOfRemoteArchive = date.toISOString().split('T')[0];
            const sizeOfRemoteArchive = Number(headers['content-length']);

            // If the `nameOfArchive` is "monthly" and the 
            // `dateOfRemoteArchive` is "2025-10-01", the `datenameOfArchive`
            // will be "monthly.2025-10-01" and this is how we will store it
            // locally
            const datenameOfArchive = `${nameOfArchive}.${dateOfRemoteArchive}`;

            if (dateOfArchive) {
                const d1 = new Date(dateOfArchive);
                const d2 = new Date(dateOfRemoteArchive);

                // We compare the dates of the remote and the local archives
                if (d2 > d1) {
                    this.logger.info(`    ✅ found a more recent "${nameOfArchive}" archive dated "${dateOfRemoteArchive}"`);
                    await _download(datenameOfArchive, url);
                    return datenameOfArchive;
                }
                else {
                    this.logger.info(`    ❌ no newer version is available, so skipping`);
                    return false;
                }
            }
            else {
                this.logger.info(`    ✅ found a "${nameOfArchive}" archive from "${dateOfRemoteArchive}"`);
                await _download(datenameOfArchive, url);
                return `${datenameOfArchive}`;
            }

        }
        catch (error) {
            console.error(error);
        }
    }

    unzip(archive) {
        const archiveDir = `${this.config.dirs.data}/treatments-dumps/${archive}`;
        const archiveZip = `${this.config.dirs.zips}/${archive}.zip`;
        this.logger.info(`checking if it has already been unzipped…`);

        if (fs.existsSync(archiveDir)) {
            this.logger.info(`    ✅ yes, it has been unzipped`);
        }
        else {
            this.logger.info(`    ❌ it has not yet been unzipped`);
            this.logger.info(`    📂 unzipping "${archive}.zip"`);
        
    
            // -q Perform operations quietly.
            // -n never overwrite existing files
            // -d extract files into exdir
            const cmd = `unzip -q -n ${archiveZip} -d ${archiveDir}`;
        
            if (this.config.mode !== 'dryRun') {
                execSync(cmd);
                
                // check if there is an index.xml included in the archive; 
                // if yes, remove it
                if (fs.existsSync(`${archiveDir}/index.xml`)) {
                    fs.rmSync(`${archiveDir}/index.xml`);
                }
            }
        }

        return archiveDir;
    }


    // find out the timePeriod of the typeOfArchive if it were to be 
    // processed "today". For example, if the archive is 'yearly', get 
    // current year. For the 'monthly' archive, get current month, and so on
    getPeriodOfArchive(typeOfArchive, date) {
        let periodOfArchive;

        function getWeekOfYear(date = new Date()) {

            // Copy date so we don’t modify the original
            const d = new Date(
                Date.UTC(
                    date.getFullYear(), 
                    date.getMonth(), 
                    date.getDate()
                )
            );
            
            // Set to nearest Thursday (ISO week starts on Monday)
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
            
            // Get first day of the year
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            
            // Calculate week number
            return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
        }
    
        if (typeOfArchive === 'yearly') {
            periodOfArchive = date.getUTCFullYear();
        }
        else if (typeOfArchive === 'monthly') {
            periodOfArchive = date.getUTCMonth() + 1;
        }
        else if (typeOfArchive === 'weekly') {
            periodOfArchive = getWeekOfYear(date);
        }
    
        // https://stackoverflow.com/a/40975730/183692
        else if (typeOfArchive === 'daily') {
            const yyyy = date.getUTCFullYear();
            const mm = date.getUTCMonth();
            const dd = date.getUTCDate();
            const end = Date.UTC(yyyy, mm, dd);
            const start = Date.UTC(date.getUTCFullYear(), 0, 0);
    
            periodOfArchive = (end - start) / 24 / 60 / 60 / 1000;
        }
    
        return periodOfArchive;
    }

    pruneTypesOfArchives(last, typesOfArchives) {
        const lastTypeOfArchive = last.typeOfArchive;
        const lastTimeOfArchive = last.dateOfArchive;
        const yearOfArchive = last.dateOfArchive.split('-')[0];
        const yearOfToday = (new Date()).getFullYear();
    
        const periodOfArchiveToday = getPeriodOfArchive(
            lastTypeOfArchive, new Date()
        );
    
        // similar to above, get the period of the last processed archive
        const periodOfLastArchive = getPeriodOfArchive(
            lastTypeOfArchive, new Date(lastTimeOfArchive)
        );
    
        if (yearOfArchive == yearOfToday) {
    
            if (periodOfLastArchive >= periodOfArchiveToday) {
    
                // we don't process this archive
                const i = typesOfArchives.findIndex(a => a === lastTypeOfArchive);
                const typeOfArchive = typesOfArchives[i];
                log.info(`we don't process "${typeOfArchive}" archive`);
    
                // remove index i from typesOfArchives
                typesOfArchives.splice(i, 1);
            }
            
        }
    }
}