import fs from 'fs';
import path from 'path';
import cliProgress from 'cli-progress';
import { pipeline as streamPipeline } from 'node:stream/promises';
import got from 'got';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
//import Zlogger from '@punkish/zlogger';
import Zlogger from '../../../../zlogger/index.js';
import * as utils from './utils/index.js';
import { parseTreatment } from './parse/lib/treatment.js';
import { connect } from './database/dbconn.js';
import { createInsertTreatments } from './database/createInsertTreatments.js';

// see https://github.com/cheeriojs/cheerio/issues/2786#issuecomment-1288843071
import * as cheerio from 'cheerio';
import { 
    getCounts, 
    getArchiveUpdates, 
    selCountOfTreatments, 
    checkTreatmentExists, 
    storeTreatmentJSON,
    createInsertTreatments,
    update
} from './database/Foo.js';

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

        // A stats object to store the number of treatments and 
        // its components extracted from the XMLs
        this.stats = {

            // ETL process related stats
            typeOfArchive: '',
            dateOfArchive: 0,
            sizeOfArchive: 0,
            downloadStarted: 0,
            downloadEnded: 0,
            unzipStarted: 0,
            unzipEnded: 0,
            numOfFiles: 0,
            etlStarted: 0,
            etlEnded: 0,

            // Counts of treatments and treatment parts ETLed
            treatments: 0,
            treatmentCitations: 0,
            materialCitations: 0,
            collectionCodes: 0,
            figureCitations: 0,
            bibRefCitations: 0,
            treatmentAuthors: 0,
            journals: 0
        };
        
        this.utils = utils;
        this.db = connect({
            dir: this.config.db.dir, 
            main: this.config.db.main, 
            archive: this.config.db.archive, 
            reinitialize: this.config.db.reinitialize, 
            logger: this.logger
        });
        this.insertTreatments = createInsertTreatments.bind(this);
        this.getCounts = getCounts.bind(this);
        this.getArchiveUpdates = getArchiveUpdates.bind(this);
        this.selCountOfTreatments = selCountOfTreatments.bind(this);
        this.checkTreatmentExists = checkTreatmentExists.bind(this);
        this.storeTreatmentJSON = storeTreatmentJSON.bind(this);
        this.update = update.bind(this);
    }

    async download () {
        this.stats.downloadStarted = new Date().getTime();
        const typeOfArchive = this.stats.typeOfArchive;

        const remoteArchive = typeOfArchive === 'yearly' 
            ? 'plazi.zenodeo.zip'
            : `plazi.zenodeo.${typeOfArchive}.zip`;
        
        // example
        //
        // "server": {
        //     "hostname": 'https://tb.plazi.org',
        //     "path": 'GgServer/dumps',
        //     "port": 443
        // },

        // https://tb.plazi.org/GgServer/dumps/plazi.zenodeo.daily.zip
        const pathToArchive = `${this.config.server.path}/${remoteArchive}`;
        const url = `${this.config.server.hostname}/${pathToArchive}`;
        this.logger.info(`checking for "${remoteArchive}" on the server`);

        try {
            const res = await got(url, { method: 'HEAD' });
            const headers = res.headers;
            const d = new Date(headers['last-modified']);
            const dateOfArchive = d.toISOString().split('T')[0];
            const archive_name = `${typeOfArchive}.${dateOfArchive}`;
            const localCopy = `${this.config.dirs.zips}/${archive_name}.zip`;

            this.stats.dateOfArchive = dateOfArchive;
            this.stats.sizeOfArchive = Number(headers['content-length']);

            if (!fs.existsSync(localCopy)) {
                this.logger.info(`downloading ${archive_name}…`);

                if (this.config.mode !== 'dryRun') {
                    await streamPipeline(
                        got.stream(url),
                        fs.createWriteStream(localCopy)
                    );
                }
                
            }

        }
        catch (error) {
            
            if (error.response.statusCode) {
                this.logger.info(`the "${remoteArchive}" is not on the server`);
            }
            
        }
        
        this.stats.downloadEnded = new Date().getTime();
    }

    unzip () {
        this.stats.unzipStarted = new Date().getTime();
        const typeOfArchive = this.stats.typeOfArchive;
        const dateOfArchive = this.stats.dateOfArchive;

        const archive_name = `${typeOfArchive}.${dateOfArchive}`;
        this.logger.info(
            `checking if "${archive_name}" has already been unzipped`, 
        );

        const archive_dir = `${this.config.dirs.data}/treatments-dumps/${archive_name}`;
        
        if (fs.existsSync(archive_dir)) {
            this.logger.info('yes, it has been');
        }
        else {
            this.logger.info("no, it hasn't");
            this.logger.info(`unzipping "${archive_name}.zip"…`);
            const archive = `${this.config.dirs.zips}/${archive_name}.zip`;
        
            // -q Perform operations quietly.
            // -n never overwrite existing files
            // -d extract files into exdir
            let cmd = `unzip -q -n ${archive} -d ${archive_dir}`;
        
            if (this.config.mode !== 'dryRun') {
                execSync(cmd);
                
                // check if there is an index.xml included in the archive; 
                // if yes, remove it
                if (fs.existsSync(`${archive_dir}/index.xml`)) {
                    fs.rmSync(`${archive_dir}/index.xml`);
                }
            }

        }

        const files = fs.readdirSync(archive_dir)
            .filter(f => path.extname(f) === '.xml');

        this.stats.unzip.numOfFiles = files.length;
        this.stats.unzip.unzipEnded = new Date().getTime();
        this.logger.info(`downloaded archive contains ${files.length} files`);

        return files;
    }

    parseOne(file) {    
        const start = process.hrtime.bigint();

        const xml = fs.readFileSync(file);
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
        const treatment = parseTreatment($);

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
        treatment.xml = xml;

        const end = process.hrtime.bigint();

        treatment.timeToParseXML = (Number(end - start) * 1e-6).toFixed(2);
        return treatment
    }

    load(treatments) {
        this.logger.info(`loading ${treatments.length} treatments`);
        this.insertTreatments(treatments, this.stats);
    }
    
    async etlOld(source, isDbEmpty=false) {
        const entry = fs.lstatSync(source);
    
        if (entry.isDirectory()) {
    
            // create a new progress bar instance and use the legacy theme
            const bar = new cliProgress.SingleBar(
                {}, cliProgress.Presets.legacy
            );
            const dirEntries = fs.readdirSync(source, { withFileTypes: true });
            const re = /^[a-zA-Z0-9]{32}$/;
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
                            const json = this.checkTreatmentExists(basename);
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

    async etl(actions) {
        const sourceType = this.config.sourceType;
        const sourceValue = this.config.sources[sourceType];

        if (sourceType === 'xml') {
            const dir = this.config.dirs.dumps;
            const file = `${dir}/xmls/${sourceValue}.xml`;
            
            if (this.utils.isValidFileOrDir(file)) {
                const treatment = this.parseOne(file);
                this.load([ treatment ]);
                //this.storeTreatmentJSON({ treatments_id, xml, json })
            }
        }
        else {
            let treatments = [];
            let batch = 16;
            let counter = 0;

            if (sourceType === 'dir') {

                if (!this.utils.isValidFileOrDir(sourceValue)) {
                    throw new Error(`${sourceValue} is not a valid dir`);
                }
    
                const files = fs.readdirSync(
                    sourceValue, { withFileTypes: true }
                );
                const totalCount = files.length;
                if (totalCount <= batch) batch = totalCount;
                //this.logger(`dir with ${totalCount} elements`);
                //console.log(`dir with ${totalCount} elements`)
    
                for await (const file of files) {
                    counter++;

                    const dir = this.config.dirs.dumps;
                    const f = `${dir}/xmls/${file.name}`;

                    if (this.utils.isValidFileOrDir(f)) {
                        const treatment = this.parseOne(f);
                        treatments.push(treatment);
                    }
    
                    if (!(counter % batch)) {
                        process.stdout.write('.');
                        this.load(treatments);
                        treatments.length = 0;
                    }
    
                }
    
                //this.foo(actions, treatments);
            }
            else if (sourceType === 'synthetic') {
                const totalCount = sourceValue;
                this.log(`synthetic data with ${totalCount} elements`);
    
                if (totalCount <= batch) {
                    batch = totalCount;
                    const num = sourceValue;
                    treatments.push(...makeTreatments(num));
                    foo(actions, treatments);
                }
                else {
    
                    for (let i = 0; i <= sourceValue; i += batch) {
                        counter++;
                        const remaining = totalCount - (counter * batch);
    
                        if (remaining > 0) {
                            treatments.push(...makeTreatments(batch));
                        }
                        else {
                            treatments.push(...makeTreatments(batch + remaining));
                        }
                        
                        process.stdout.write('.');
                        foo(actions, treatments);
                    }
    
                    //foo(actions, treatments);
                }
            }
        }
    }

    foo(actions, treatments) {

        // if (actions.includes('display')) {
        //     console.log(treatments);
        // }

        this.load(treatments);
        

        treatments.length = 0;
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

    
}