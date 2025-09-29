import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as utils from '../../../../lib/utils.js';
import { dumpsSchema } from './schema/dumpsSchema.js';
//import { parseTreatment } from '../parse/lib/treatment.js';

function dropTables(db, log) {
    log.info('dropping tables in db…');
    db.exec(`
BEGIN TRANSACTION;
    --PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS materialCitations_collectionCodes;
    DROP TABLE IF EXISTS materialCitations;
    DROP TABLE IF EXISTS collectionCodes;
    --DROP TABLE IF EXISTS images;
    DROP TABLE IF EXISTS figureCitations;
    DROP TABLE IF EXISTS treatmentCitations;
    DROP TABLE IF EXISTS bibRefCitations;
    DROP TABLE IF EXISTS treatmentAuthors;
    DROP TABLE IF EXISTS treatments;
    DROP TABLE IF EXISTS journalsByYears;
    DROP TABLE IF EXISTS journals;
    DROP TABLE IF EXISTS kingdoms;
    DROP TABLE IF EXISTS phyla;
    DROP TABLE IF EXISTS classes;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS genera;
    DROP TABLE IF EXISTS families;
    DROP TABLE IF EXISTS species;
    DROP TABLE IF EXISTS binomensFts;
    DROP TABLE IF EXISTS materialCitationsRtree;
    DROP TABLE IF EXISTS treatmentsFts;
    DROP TABLE IF EXISTS treatmentsFtVrow;
    DROP TABLE IF EXISTS treatmentsFtVcol;
    DROP TABLE IF EXISTS treatmentsFtVins;
    DROP TABLE IF EXISTS treatments;
    DROP VIEW IF EXISTS treatmentsView;
    DROP VIEW IF EXISTS binomensView;
    --DROP VIEW IF EXISTS images;
    DROP VIEW IF EXISTS treatmentCitationsView;
    DROP TRIGGER IF EXISTS treatments_ai;
    DROP TRIGGER IF EXISTS treatments_ad;
    DROP TRIGGER IF EXISTS treatments_au;
    DROP TRIGGER IF EXISTS treatmentsView_ii;
    DROP TRIGGER IF EXISTS materialCitations_loc_ai;
    DROP TRIGGER IF EXISTS treatmentCitationsView_ii;
COMMIT;
    `);
}

function createTables(db, log) {
    log.info('creating tables in db…');
    
    const schemaFiles = [
        'treatments',
        'treatments-foreign-keys',
        'materialCitations',
        'binomens',
        'figureCitations',
        'treatmentAuthors',
        'treatmentCitations',
        'bibRefCitations'
    ];

    const schema = schemaFiles.map(s => {
        return fs.readFileSync(
            path.resolve(import.meta.dirname, `./schema/${s}.sql`), 
            'utf8'
        );
    }).join('\n');

    db.exec(`
BEGIN TRANSACTION;
${schema}
COMMIT;
    `);
}

function dropTablesDumps(db, alias, log) {
    log.info('dropping tables in orig…');
    db.exec(`
BEGIN TRANSACTION;
    DROP TABLE IF EXISTS ${alias}.treatments;
    DROP TRIGGER IF EXISTS ${alias}.treatments_ai;
COMMIT;
    `);
}

function createTablesDumps(db, alias, log) {
    log.info(`creating tables in db-${alias}`);
    // const schemafile = path.resolve(import.meta.dirname, './schema-orig.sql');
    // const schema = fs.readFileSync(schemafile, 'utf8');
    const schema = dumpsSchema(alias)

    db.exec(`
BEGIN TRANSACTION;
${schema}
COMMIT;
    `);
}

function cleanText() {
    const re = utils.getPattern('all');
    let str = this.text();
    str = str.replace(re.double_spc, ' ');
    str = str.replace(re.space_comma, ',');
    str = str.replace(re.space_colon, ':');
    str = str.replace(re.space_period, '.');
    str = str.replace(re.space_openparens, '(');
    str = str.replace(re.space_closeparens, ')');
    str = str.trim();
    return str;
}

// function parse(xml) {
//     const start = process.hrtime.bigint();
//     const $ = cheerio.load(
//         xml, 
//         { normalizeWhitespace: true, xmlMode: true }, 
//         false
//     );
//     $.prototype.cleanText = cleanText;
//     const treatment = parseTreatment($);
//     const end = process.hrtime.bigint();
//     treatment.timeToParseXML = (Number(end - start) * 1e-6).toFixed(2);
//     treatment.xml = xml;
//     treatment.json = JSON.stringify(treatment);

//     return treatment
// }

export function connect(dbfile, alias, log, reinitialize=false) {
    const db = new Database(dbfile);

    if (reinitialize) {
        dropTables(db, log);
        createTables(db, log);
    }

    // /full/path/to/dbfile.sqlite
    // |------------|------|
    // 
    // /full/path/to/dbfile-<alias>.sqlite
    // |------------|------| |----|
    // 
    //const dbname = path.basename(dbfile, path.extname(dbfile)) + `-${alias}`;
    const dbname = `${path.basename(dbfile, path.extname(dbfile))}-${alias}`;
    const dirname = path.dirname(dbfile);
    const dborig = path.join(dirname, `${dbname}.sqlite`);
    
    log.info(`attaching database '${dborig}' AS "${alias}"`);
    db.prepare(`ATTACH DATABASE '${dborig}' AS ${alias}`).run();

    if (reinitialize) {
        dropTablesDumps(db, alias, log);
        createTablesDumps(db, alias, log);
    }

    //db.function('parse', parse);
    
    return db
}