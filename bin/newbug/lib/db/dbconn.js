import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { snipDir } from '../utils/index.js';

function dropTables(db, logger) {
    
    logger.info('dropping tables in newbug db');
    db.exec(`
BEGIN TRANSACTION;

DROP TABLE IF EXISTS treatmentCitations;
DROP TABLE IF EXISTS bibRefCitations;
DROP TABLE IF EXISTS treatmentAuthors;
DROP TABLE IF EXISTS materialCitations_collectionCodes;
DROP TABLE IF EXISTS collectionCodes;
DROP TABLE IF EXISTS materialCitations;
DROP TABLE IF EXISTS figureCitations;
DROP TABLE IF EXISTS treatments;
DROP TABLE IF EXISTS kingdoms;
DROP TABLE IF EXISTS phyla;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS genera;
DROP TABLE IF EXISTS families;
DROP TABLE IF EXISTS species;
DROP TABLE IF EXISTS journalsByYears;
DROP TABLE IF EXISTS journals;
DROP TABLE IF EXISTS binomensFts;
DROP TABLE IF EXISTS materialCitationsRtree;
DROP TABLE IF EXISTS treatmentsFts;
DROP TABLE IF EXISTS treatmentsFtVrow;
DROP TABLE IF EXISTS treatmentsFtVcol;
DROP TABLE IF EXISTS treatmentsFtVins;
DROP VIEW IF EXISTS binomensView;
DROP VIEW IF EXISTS treatmentCitationsView;
DROP VIEW IF EXISTS images;

COMMIT;
    `);
    
}

function createTables(db, logger) {
    logger.info('creating tables in newbug db');
    
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
    });
    schema.unshift('BEGIN TRANSACTION;');
    schema.push('COMMIT;')

    db.exec(schema.join('\n'));
}

function createTempEntities(db, logger) {
    const schema = fs.readFileSync(
        path.resolve(import.meta.dirname, `./schema/tempEntities.sql`), 
        'utf8'
    );

    db.exec(schema);
}

function dropTablesArchive(db, logger) {
    logger.info('dropping tables in newbug-arc db');
    db.exec(`
BEGIN TRANSACTION;

DROP TABLE IF EXISTS arc.treatmentsDump;
DROP TABLE IF EXISTS arc.archives;
DROP TABLE IF EXISTS arc.etl;
DROP TABLE IF EXISTS arc.downloads;
DROP TABLE IF EXISTS arc.unzip;
DROP VIEW IF EXISTS arc.archivesView;
DROP TRIGGER IF EXISTS arc.archivesView_ii;

COMMIT;
    `);
}

function createTablesArchive(db, logger) {
    logger.info(`creating tables in newbug-arc db`);
    const schema = fs.readFileSync(
        path.resolve(import.meta.dirname, './schema/archiveSchema.sql'), 
        'utf8'
    );

    db.exec(schema);
}

export function connect({ 
    dir, 
    mainDbFile, 
    mainSchema, 
    arcDbFile,
    arcSchema,
    geoDbFile,
    geoSchema,
    zaiDbFile,
    zaiSchema,
    reinitialize, 
    logger 
}) {
    //const origLevel = logger.level();
    logger.setLevel('info');

    // main db
    const mainDb = `${dir}/${mainDbFile}`;
    const mainPrefix = snipDir(mainDb, dir);
    logger.info(`creating db connection with "${mainPrefix}"`);
    const db = new Database(mainDb);

    // arc (archive) db
    const arcDb = `${dir}/${arcDbFile}`;
    const arcPrefix = snipDir(arcDb, dir);
    logger.info(`attaching '${arcPrefix}' AS "${arcSchema}"`);
    db.prepare(`ATTACH DATABASE '${arcDb}' AS ${arcSchema}`).run();

    // geo (geodata) db
    const geoDb = `${dir}/${geoDbFile}`;
    const geoPrefix = snipDir(geoDb, dir);
    logger.info(`attaching '${geoPrefix}' AS "${geoSchema}"`);
    db.prepare(`ATTACH DATABASE '${geoDb}' AS ${geoSchema}`).run();

    // zai db
    const zaiDb = `${dir}/${zaiDbFile}`;
    const zaiPrefix = snipDir(zaiDb, dir);
    logger.info(`attaching '${zaiPrefix}' AS "${zaiSchema}"`);
    db.prepare(`ATTACH DATABASE '${zaiDb}' AS ${zaiSchema}`).run();
    
    if (reinitialize) {
        dropTables(db, logger);
        createTables(db, logger);
    }

    createTempEntities(db, logger);

    if (reinitialize) {
        dropTablesArchive(db, logger);
        createTablesArchive(db, logger);
    }
    
    //logger.setLevel(origLevel);
    return db;
}