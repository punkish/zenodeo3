import fs from 'fs';
import path from 'path';
import got from 'got';
import zlib from 'zlib';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
//import Zlogger from '@punkish/zlogger';
import Zlogger from '../../../../zlogger/index.js';
import * as utils from './utils/index.js';
import { connect } from './db/dbconn.js';
import { createInsertTreatments } from './db/createInsertTreatments.js';

// see https://github.com/cheeriojs/cheerio/issues/2786#issuecomment-1288843071
// import * as cheerio from 'cheerio';
// import { parseTreatment } from './parse/lib/treatment.js';
import xml2json from './parse/index.js';
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
            dbconfig:  this.config.database,
            logger: this.logger
        });

        this.insertTreatments = createInsertTreatments(this.db);

        // A stats object to store the number of treatments and 
        // its components extracted from the XMLs
        this.stats = {

            // ETL related stats
            etl: {},

            // Stats per transaction
            transaction: {},

            // Stats per archive
            archive: {}
        };

        // Cannot reassign properties on the module namespace (import * as 
        // utils) at it is read-only. Making a shallow copy and replacing 
        // the functions is a safe way to keep other helpers.
        this.utils = { 
            ...utils, 

            // We bind `this` to the following two utils so they can access
            // `this` as well
            determineArchiveType: utils.determineArchiveType.bind(this),
            checkDir: utils.checkDir.bind(this)
        }

        this.typesOfArchives = [
            'yearly', 'monthly', 'weekly', 'daily'
        ];

        this.xml2json = xml2json;
    }

    initEtl() {
        try {
            const { id, started } = this.db.prepare(`
                INSERT INTO arc.etl (id) 
                VALUES (null) 
                RETURNING id, started
            `).get();

            //this.logger.info(`initialized ETL ${id}`);
            this.stats.etl.id = id;
            this.stats.etl.started = started;
            this.stats.etl.ended = 0;

            // The following are only for console reporting
            this.stats.etl.numOfFiles = 0;
            this.stats.etl.skipped = 0;
            this.stats.etl.treatments = 0;
            this.stats.etl.treatmentCitations = 0;
            this.stats.etl.materialCitations = 0;
            this.stats.etl.collectionCodes = 0;
            this.stats.etl.figureCitations = 0;
            this.stats.etl.bibRefCitations = 0;
            this.stats.etl.treatmentAuthors = 0;
            this.stats.etl.journals = 0;

            // Initialize archive.etl_id
            this.stats.archive.etl_id = this.stats.etl.id;
        }
        catch(error) {
            this.logger.debug(error)
        }
    }

    endEtl() {
        try {
            const id = this.stats.etl.id;

            this.stats.etl.ended = this.db.prepare(`
                UPDATE arc.etl 
                SET ended = unixepoch('subsec') * 1000 
                WHERE id = @id
                RETURNING ended
            `).get({ id }).ended;

            //this.logger.info(`ended ETL ${id}`);
        }
        catch(error) {
            this.logger.debug(error)
        }
    }

    initArchive() {
        try {
            const { id, started } = this.db.prepare(`
                INSERT INTO arc.archives (
                    etl_id,
                    typeOfArchive,
                    nameOfArchive, 
                    dateOfArchive, 
                    sizeOfArchive, 
                    numOfFiles
                ) 
                VALUES (
                    @etl_id,
                    @typeOfArchive,
                    @nameOfArchive, 
                    @dateOfArchive, 
                    @sizeOfArchive, 
                    @numOfFiles
                ) 
                RETURNING id, started;
            `).get(this.stats.archive);

            //this.logger.info(`initialized archive ${id}`);
            this.stats.archive.id = id;

            // Has already been set above by initEtl()
            //this.stats.archive.etl_id = 0;
            this.stats.archive.started = started;
            this.stats.archive.ended = 0;

            //this.stats.etl.numOfFiles += this.stats.archive.numOfFiles;

            // TODO: The following were updated earlier
            // this.stats.archive.typeOfArchive = typeOfArchive;
            // this.stats.archive.nameOfArchive = nameOfArchive;
            // this.stats.archive.dateOfArchive = dateOfArchive;
            // this.stats.archive.sizeOfArchive = sizeOfArchive;
            // this.stats.archive.numOfFiles = numOfFiles;

            //  The following are only for console reporting
            this.stats.archive.treatments = 0;
            this.stats.archive.treatmentCitations = 0;
            this.stats.archive.materialCitations = 0;
            this.stats.archive.collectionCodes = 0;
            this.stats.archive.figureCitations = 0;
            this.stats.archive.bibRefCitations = 0;
            this.stats.archive.treatmentAuthors = 0;
            this.stats.archive.journals = 0;
            this.stats.archive.skipped = 0;

            // Initialize transaction.archives_id
            this.stats.transaction.archives_id = this.stats.archive.id;
        }
        catch(error) {
            this.logger.debug(error)
        }
    }

    endArchive() {
        try {
            const id = this.stats.archive.id;

            this.stats.archive.ended = this.db.prepare(`
                UPDATE arc.archives 
                SET ended = unixepoch('subsec') * 1000 
                WHERE id = @id
                RETURNING ended
            `).get({ id }).ended;

            //this.logger.info(`ended archive ${id}`);
        }
        catch(error) {
            this.logger.debug(error)
        }
    }

    initTransaction() {
        try {
            const { id, started } = this.db.prepare(`
                INSERT INTO arc.transactions (id)
                VALUES (NULL)
                RETURNING id, started
            `).get();

            //this.logger.info(`initialized transaction ${id}`);
            this.stats.transaction.id = id;

            // This has already been set above in initArchives()
            //this.stats.transaction.archives_id = 0;
            this.stats.transaction.started = started;
            this.stats.transaction.ended = 0;
            this.stats.transaction.treatments = 0;
            this.stats.transaction.treatmentCitations = 0;
            this.stats.transaction.materialCitations = 0;
            this.stats.transaction.collectionCodes = 0;
            this.stats.transaction.figureCitations = 0;
            this.stats.transaction.bibRefCitations = 0;
            this.stats.transaction.treatmentAuthors = 0;
            this.stats.transaction.journals = 0;
            this.stats.transaction.skipped = 0;
        }
        catch(error) {
            this.logger.debug(error)
        }
    }

    endTransaction() {
        try {
            this.stats.transaction.ended = this.db.prepare(`
                UPDATE arc.transactions 
                SET archives_id = @archives_id,
                    ended = unixepoch('subsec') * 1000,
                    treatments = @treatments,
                    treatmentCitations = @treatmentCitations,
                    materialCitations = @materialCitations,
                    figureCitations = @figureCitations,
                    bibRefCitations = @bibRefCitations,
                    treatmentAuthors = @treatmentAuthors,
                    collectionCodes = @collectionCodes,
                    journals = @journals,
                    skipped = @skipped
                WHERE id = @id
                RETURNING ended
            `).get(this.stats.transaction).ended;

            //this.logger.info(`ended transaction ${this.stats.transaction.id}`);
        }
        catch(error) {
            this.logger.debug(error)
        }
    }

    // Format and write a report to the console at the end of ETL
    report(type) {

        function msToHumanReadableStr(d) {
            const units = [
                { label: "d", value: 86400000 },
                { label: "h", value: 3600000 },
                { label: "m", value: 60000 },
                { label: "s", value: 1000 },
                { label: "ms", value: 1 }
            ];

            const parts = [];

            for (const { label, value } of units) {
                const amount = Math.floor(d / value);
                if (amount > 0) parts.push(`${amount}${label}`);
                d %= value;
            }

            // If everything was zero (e.g., d = 0), return "0ms"
            return parts.length ? parts.join(" ") : "0ms";
        }

        const w = 69;
        const started = this.stats[type].started;
        const ended = this.stats[type].ended;
        const duration = ended - started;
        const numOfFiles = this.stats[type].numOfFiles;
        const skipped = this.stats[type].skipped;
        const treatments = this.stats[type].treatments;

        let treatmentCitations = 0;
        let materialCitations = 0;
        let collectionCodes = 0;
        let figureCitations = 0;
        let bibRefCitations = 0;
        let treatmentAuthors = 0;
        let journals = 0;

        if (treatments) {
            treatmentCitations = this.stats[type].treatmentCitations;
            materialCitations = this.stats[type].materialCitations;
            collectionCodes = this.stats[type].collectionCodes;
            figureCitations = this.stats[type].figureCitations;
            bibRefCitations = this.stats[type].bibRefCitations;
            treatmentAuthors = this.stats[type].treatmentAuthors;
            journals = this.stats[type].journals;
        }

        // Processing time per file
        const tpf = numOfFiles > 0
            ? (duration / numOfFiles).toFixed(2)
            : '';

        // Files/sec
        const fps = tpf ? (1000 / tpf).toFixed(0) : '';
        
        const skippedMsg = skipped ? 'because they already exist in the db' : '';

        let msg = `
    ${'='.repeat(w)}
    Processed ${numOfFiles} files in ${msToHumanReadableStr(duration)}
    Skipped ${skipped} files ${skippedMsg}
    Time taken per file: ${tpf} ms/file
    Number of files/sec: ${fps}
    ${'-'.repeat(w)}
        `;

        if (treatments) {
            const t = treatments > 1 ? 'treatments' : 'treatment';
            msg += `
    Loaded ${treatments} ${t} with

    treatmentCitations: ${treatmentCitations}
    materialCitations : ${materialCitations}
    collectionCodes   : ${collectionCodes}
    figureCitations   : ${figureCitations}
    bibRefCitations   : ${bibRefCitations}
    treatmentAuthors  : ${treatmentAuthors}
            `;
        }

        msg += `
    ${'*'.repeat(w)}
        `;

        return msg;
    }

    updateStats(stats) {

        if (stats.numOfFiles) {
            const numOfFiles = stats.numOfFiles;
            this.stats.transaction.numOfFiles = numOfFiles;
            this.stats.archive.numOfFiles += numOfFiles;
            this.stats.etl.numOfFiles += numOfFiles;
        }

        const types = ['etl', 'archive', 'transaction'];

        if (stats.skipped) {
            types.forEach(type => this.stats[type].skipped++);
        }

        if (stats.treatment) {
            const treatment = stats.treatment;
            types.forEach(type => {
                this.stats[type].treatments++;
                this.stats[type].treatmentCitations += treatment.treatmentCitations.length; 
                this.stats[type].materialCitations += treatment.materialCitations.length;
                treatment.materialCitations.forEach(materialCitation => {
                    this.stats[type].collectionCodes += materialCitation.collectionCodes.length;
                });
                this.stats[type].figureCitations += treatment.figureCitations.length;
                this.stats[type].bibRefCitations += treatment.bibRefCitations.length;
                this.stats[type].treatmentAuthors += treatment.treatmentAuthors.length;
                //this.stats[type].journals += treatment.journals.length;
            });
        }

    }

    getJsonFromArchive(treatmentId) {

        try {
            const row = this.db.prepare(`
                SELECT json
                FROM arc.treatmentsDump t1 JOIN treatments t2 ON t1.id = t2.id
                WHERE t2.treatmentId = ?
            `).get(treatmentId);

            if (!row) return null;
            const json = zlib.inflateRawSync(row.json).toString();
            return JSON.parse(json);
        }
        catch(error) {
            this.logger.info(error);
        }

    }

    parseFile(file) {

        // check if the file is a valid treatment xml
        // given '/path/to/<treatmentId>.xml'
        // where <treatmentId> matches the following regexp
        const re = /^[a-zA-Z0-9]{32}$/;
        const extname = '.xml';
        let treatment = false;
        let error = false;
        const force = this.config.force ?? false;

        if (path.extname(file) === extname) {
            const treatmentId = path.basename(file, extname);

            // since the filename is a valid treatmentId, we proceed
            if (re.test(treatmentId)) {
                
                // If --force is 'shove', parse the file without checking
                // first if the treatment exists in the db
                if (force === 'shove') {
                    treatment = this.xml2json(file);

                    if (!treatment) {
                        error = 'was unable to make a treatment from the XML file';
                    }
                }
                else {

                    // check if the treatment already exists in the db
                    const treatmentExists = this.checkTreatmentExists(treatmentId);

                    if (treatmentExists) {

                        // If --force is 'push', update the treatment, but 
                        // retrieve the JSON from the database instead of 
                        // re-parsing the XML file
                        if (force === 'push') {
                            treatment = this.getJsonFromArchive(treatmentId);

                            if (treatment) {

                                // Set the following keys to null because they make
                                // sense only when the XML file is parsed
                                treatment.timeToParseXML = null;
                                treatment.json = null;
                                treatment.xml = null;
                            }
                            else {
                                error = 'was unable to make a treatment from the stored JSON';
                            }
                        }
                        else {
                            this.updateStats({ skipped: true });
                            error = 'skipping the treatment because it already exists in the db';
                        }
                        
                    }

                    // process only if the treatment does not exist
                    else {
                        treatment = this.xml2json(file);

                        if (!treatment) {
                            error = 'was unable to make a treatment from the XML file';
                        }
                    }
                }

            }
            else {
                error = 'file name is not a valid treatmentId';
            }

        }
        else {
            error = `${file} is not XML`;
        }

        if (treatment) {
            this.updateStats({ treatment });
            return treatment;
        }
        else {
            this.logger.debug(error);
            return false;
        }
    }

    getCounts() {
        this.logger.info(`getting counts`);
        
        try {
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
        catch(error) {
            this.logger.info(error);
        }

    }

    load(treatments) {
        this.insertTreatments(treatments);
        this.endTransaction();
    }

    checkTreatmentExists(treatmentId) {
        this.logger.debug('checking if treatment exists');

        try {
            const res = this.db.prepare(`
                SELECT id 
                FROM treatments
                WHERE treatmentId = @treatmentId
            `).get({ treatmentId });

            return res ? true : false;
        }
        catch(error) {
            this.logger.debug(error);
        }

    }
    getArchiveUpdates() {
        try {
            let res = this.db.prepare(`
                SELECT 
                    nameOfArchive, 
                    dateOfArchive, 
                    sizeOfArchive,
                    archiveStarted,
                    archiveEnded,
                    archiveDuration
                FROM arc.tbArchivesUpdatesView
            `).all();
            return res;
        }
        catch(error) {
            this.logger.info(error);
        }
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

        const res = this.getArchiveUpdates();
        
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

    processFile(file) {
        this.initArchive();
        this.initTransaction();
        const treatment = this.parseFile(file);

        if (treatment) {
            this.load([treatment]);
        }

        this.endArchive();
    }

    processDir(dir) {
        this.logger.info(`processing "${this.utils.snipDir(dir, '/Users/punkish/Projects/zenodeo3')}"`);
        const files = fs.readdirSync(dir, { withFileTypes: true });

        if (files) {
            this.initArchive();
            const numOfFiles = files.length;
            const batch = 10000;
            let counter = 1;
            const treatments = [];

            // create a new progress bar instance and use a color theme
            console.log('');  // <--- an empty line before the progress bar
            const bar = new cliProgress.SingleBar({
                format: 'ETL Progress |' + colors.cyan('{bar}') + '| {percentage}% || {value}/{total} treatments',
                barCompleteChar: '\u2588',
                barIncompleteChar: '\u2591',
                hideCursor: true
            });
            
            // bar.start(total, start);
            bar.start(numOfFiles, 0);
            this.updateStats({ numOfFiles });
            this.initTransaction();

            for (let f of files) {
                const file = `${dir}/${f.name}`;
                const treatment = this.parseFile(file);
                
                if (treatment) {
                    bar.update(counter);
                    counter++;
                    treatments.push(treatment);
                }

                if (counter % batch === 0) {
                    this.load(treatments);
                    this.initTransaction();
                    treatments.length = 0;
                }
                
            }

            bar.stop();
            console.log('');  // <--- any empty line after the progress bar

            // Load the final batch of treatments, any leftover after the 
            // final transaction above
            this.load(treatments);
            this.endArchive();

            // Print out the total number of treatments processed from 
            // this archive
            this.logger.info(`loaded ${this.stats.archive.treatments} treatments`);
        }
    }

    async processArchives(lastUpdatedArchives) {

        for (const archive of lastUpdatedArchives) {
            console.log('-'.repeat(95));

            if (archive.dateOfArchive) {
                this.logger.info(`a "${archive.nameOfArchive}" archive was processed on "${archive.dateOfArchive}"`);
                this.logger.info(`checking if a newer version is available…`);
            }
            else {
                this.logger.info(`a "${archive.nameOfArchive}" archive has never been processed`);
                this.logger.info(`checking if a "${archive.nameOfArchive}" archive is on the server…`);
            }

            const downloadedArchive = await this.download(archive);

            if (downloadedArchive) {
                const dir = this.unzip(downloadedArchive);
                const typeOfArchive = await this.utils.determineArchiveType(dir);
                this.processDir(dir);
            }
            
        }

        this.buildIndexes();
        //this.analyzeDb();
    }

    buildIndexes() {
        try {
            this.db.exec(`
BEGIN TRANSACTION;

CREATE INDEX IF NOT EXISTS figureCitations_treatmentsId ON figureCitations(
    treatments_id
);
CREATE INDEX IF NOT EXISTS figureCitations_images ON figureCitations(
    id,
    treatments_id,
    httpUri,
    captionText
);

CREATE INDEX IF NOT EXISTS materialCitations_treatmentsId ON materialCitations(
    treatments_id
);
CREATE INDEX materialCitations_validGeo ON materialCitations(validGeo);
CREATE INDEX IF NOT EXISTS materialCitations_images ON materialCitations(
    treatments_id,
    latitude,
    longitude
);

CREATE INDEX IF NOT EXISTS treatments_images ON treatments(
    id,
    treatmentId,
    treatmentTitle,
    treatmentDOI,
    zenodoDep,
    articleTitle,
    articleAuthor
);
CREATE INDEX treatments_articleDOI ON treatments(articleDOI);
CREATE INDEX IF NOT EXISTS treatments_orders ON treatments(orders_id);
CREATE INDEX IF NOT EXISTS treatments_classes ON treatments(classes_id);
CREATE INDEX IF NOT EXISTS treatments_families ON treatments(families_id);
CREATE INDEX IF NOT EXISTS treatments_binomens ON treatments(
    rank, 
    genera_id, 
    species_id
);

COMMIT;
            `);
        }
        catch(error) {
            this.logger.debug(error);
        }
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

            // If the `nameOfArchive` is "monthly" and  
            // the `dateOfRemoteArchive` is "2025-10-01", 
            // the `datenameOfArchive` will be "monthly.2025-10-01" and 
            // this is how we will store it ocally
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
                return datenameOfArchive;
            }

        }
        catch (error) {
            this.logger.error(`can't download ${url}`);
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
}