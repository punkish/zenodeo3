'use strict';

import * as utils from '../utils.js';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;
const ts = truebug.steps.database;

const logOpts = JSON.parse(JSON.stringify(config.truebug.log));
logOpts.name = 'TB:DATABASE  ';
import Zlogger from '@punkish/zlogger';
const log = new Zlogger(logOpts);

import isSea from 'is-sea';

/** 
 * connect to the database
 */
import { initDb } from '../../../../lib/dbconn.js';
const db = initDb({ zlog: log });

const cache = { 
    hits        : 0, 
    journals: new Map(),
    kingdoms: new Map(),
    phyla   : new Map(),
    classes : new Map(),
    orders  : new Map(),
    families: new Map(),
    genera  : new Map(),
    species : new Map()
};

const createInsertTreatment = (db) => {
    const dbConn = db.conn;
    const fn = db.insertFuncs;

    // the following insert a FK and get back newly inserted id
    const insertJournalGet_journals_id = fn.insertJournalGet_journals_id(dbConn);
    const insertKingdomGet_kingdoms_id = fn.insertKingdomGet_kingdoms_id(dbConn);
    const insertPhylumGet_phyla_id     = fn.insertPhylumGet_phyla_id(dbConn);
    const insertClassGet_classes_id    = fn.insertClassGet_classes_id(dbConn);
    const insertOrderGet_orders_id     = fn.insertOrderGet_orders_id(dbConn);
    const insertGenusGet_genera_id     = fn.insertGenusGet_genera_id(dbConn);
    const insertFamilyGet_families_id  = fn.insertFamilyGet_families_id(dbConn);
    const insertSpeciesGet_species_id  = fn.insertSpeciesGet_species_id(dbConn);

    const insertTreatmentFn                       = fn.insertTreatmentFn(dbConn);
    const selectTreatments_id                     = fn.selectTreatments_id(dbConn);
    const insertBibRefCitation                    = fn.insertBibRefCitation(dbConn);
    const selectBibRefCitations_id                = fn.selectBibRefCitations_id(dbConn);
    const insertTreatmentAuthor                   = fn.insertTreatmentAuthor(dbConn);
    const insertTreatmentCitation                 = fn.insertTreatmentCitation(dbConn);
    const insertFigureCitation                    = fn.insertFigureCitation(dbConn);
    const insertImage                             = fn.insertImage(dbConn);
    const insertMaterialCitation                  = fn.insertMaterialCitation(dbConn);
    const selectMaterialCitations_id              = fn.selectMaterialCitations_id(dbConn);
    const insertCollectionCode                    = fn.insertCollectionCode(dbConn);
    const selectCollectionCodes_id                = fn.selectCollectionCodes_id(dbConn);
    const insertMaterialCitations_collectionCodes = fn.insertMaterialCitations_collectionCodes(dbConn);

    const insertTreatment = (treatment, cache) => {
        utils.incrementStack(logOpts.name, 'insertTreatment');

        // step1: insert FKs (journalTitle, kingdom, phylum, etc.), get 
        // their ids, and append them into the treatment object           
        const { journals_id } = insertJournalGet_journals_id({ 
            table: 'journals', 
            key: 'journals_id', 
            value: treatment.journalTitle, 
            cache 
        });

        const { kingdoms_id } = insertKingdomGet_kingdoms_id({ 
            table: 'kingdoms', 
            key: 'kingdoms_id', 
            value: treatment.kingdom,      
            cache 
        });

        const { phyla_id    } = insertPhylumGet_phyla_id({ 
            table: 'phyla',    
            key: 'phyla_id',    
            value: treatment.phylum,       
            cache 
        });

        const { classes_id  } = insertClassGet_classes_id({ 
            table: 'classes',  
            key: 'classes_id',  
            value: treatment.class,        
            cache 
        });

        const { orders_id   } = insertOrderGet_orders_id({ 
            table: 'orders',   
            key: 'orders_id',   
            value: treatment.order,        
            cache 
        });

        const { genera_id   } = insertGenusGet_genera_id({ 
            table: 'genera',   
            key: 'genera_id',   
            value: treatment.genus,        
            cache 
        });
        
        const { families_id } = insertFamilyGet_families_id({ 
            table: 'families', 
            key: 'families_id', 
            value: treatment.family,       
            cache 
        });

        const { species_id  } = insertSpeciesGet_species_id({ 
            table: 'species',  
            key: 'species_id',  
            value: treatment.species,      
            cache 
        });

        treatment.journals_id = journals_id || null;
        treatment.kingdoms_id = kingdoms_id || null;
        treatment.phyla_id    = phyla_id    || null;
        treatment.classes_id  = classes_id  || null;
        treatment.orders_id   = orders_id   || null;
        treatment.genera_id   = genera_id   || null;
        treatment.families_id = families_id || null;
        treatment.species_id  = species_id  || null;
    
        // step2: insert treatment
        let info;

        try {
            info = insertTreatmentFn.run(treatment);
        }
        catch(error) {
            console.log(error);
            console.log(treatment);
            process.exit();
        }

        const { treatments_id } = selectTreatments_id.get(treatment.treatmentId);

        // step3: insert treatmentAuthors
        const treatmentAuthors = treatment.treatmentAuthors;

        if (treatmentAuthors.length) {
            for (const treatmentAuthor of treatmentAuthors) {
                treatmentAuthor.treatments_id = treatments_id;

                try {
                    info = insertTreatmentAuthor.run(treatmentAuthor);
                }
                catch (error) {
                    console.log(error);
                    console.log(treatmentAuthor);
                    process.exit();
                }
            }
        }

        // step4: insert bibRefCitations
        const bibRefCitationsCache = {};
        const bibRefCitations = treatment.bibRefCitations;

        if (bibRefCitations.length) {
            for (const bibRefCitation of bibRefCitations) {
                bibRefCitation.treatments_id = treatments_id;
                const bibRefCitationId = bibRefCitation.bibRefCitationId;

                try {
                    info = insertBibRefCitation.run(bibRefCitation);
                    const { bibRefCitations_id } = selectBibRefCitations_id.get(bibRefCitationId);
                    bibRefCitationsCache[bibRefCitationId] = bibRefCitations_id;
                }
                catch (error) {
                    console.log(error);
                    console.log(bibRefCitation);
                    process.exit();
                }
            }
        }
    
        // step5: insert treatmentCitations
        const treatmentCitations = treatment.treatmentCitations;

        if (treatmentCitations.length) {
            for (const treatmentCitation of treatmentCitations) {
                treatmentCitation.treatments_id = treatments_id;
                treatmentCitation.bibRefCitations_id = bibRefCitationsCache[treatmentCitation.bibRefCitationId];

                try {
                    info = insertTreatmentCitation.run(treatmentCitation);
                }
                catch (error) {
                    console.log(error);
                    console.log(treatmentCitation);
                    process.exit();
                }
            }
        }
    
        // step6: insert figureCitations
        const figureCitations = treatment.figureCitations;

        if (figureCitations.length) {
            for (const figureCitation of figureCitations) {
                figureCitation.treatments_id = treatments_id;

                try {
                    info = insertFigureCitation.run(figureCitation);
                }
                catch (error) {
                    console.log(error);
                    console.log(figureCitation);
                    process.exit();
                }
            }
        }

        // step7: insert images
        const images = treatment.images;

        if (images.length) {
            for (const image of images) {
                image.treatments_id = treatments_id;

                try {
                    info = insertImage.run(image);
                }
                catch (error) {
                    console.log(error);
                    console.log(image);
                    process.exit();
                }
            }
        }
    
        // step7: insert materialCitations
        const materialCitations = treatment.materialCitations;

        if (materialCitations.length) {
            for (const materialCitation of materialCitations) {
                materialCitation.treatments_id = treatments_id;
                info = insertMaterialCitation.run(materialCitation);
                const { materialCitations_id } = selectMaterialCitations_id.get(materialCitation.materialCitationId);

                // step7a: insert cross join records for collectionCodes
                const collectionCodes = materialCitation.collectionCodes;
    
                if (collectionCodes.length) {
                    for (const collectionCode of collectionCodes) {
                        info = insertCollectionCode.run(collectionCode);
                        const { collectionCodes_id } = selectCollectionCodes_id.get(collectionCode.collectionCode);
                        collectionCode.materialCitations_id = materialCitations_id;
                        collectionCode.collectionCodes_id = collectionCodes_id;

                        try {
                            info = insertMaterialCitations_collectionCodes.run(collectionCode);
                        }
                        catch (error) {
                            console.log(error);
                            console.log(collectionCode);
                            console.log(materialCitation);
                            process.exit();
                        }
                    }
                }
            }
        }
    };

    return dbConn.transaction(insertTreatment);
};

const createInsertTreatments = (db, cache) => {
    const fn = 'insertTreatments';
    if (!ts[fn]) return () => {};

    const insertTreatment = createInsertTreatment(db);

    const insertTreatments = db.conn.transaction((treatments) => {
        utils.incrementStack(logOpts.name, 'insertTreatments');

        for (const treatment of treatments) {
            insertTreatment(treatment, cache);
        }

    });

    return insertTreatments;
}

const insertTreatments = createInsertTreatments(db, cache);

// const insertTreatments = (treatments) => {
//     const fn = 'insertTreatments';
//     if (!ts[fn]) return;

//     insertTreatmentsTransaction(treatments);
// }

const dropIndexes = () => {
    const fn = 'dropIndexes';
    if (!ts[fn]) return;
    //utils.incrementStack(logOpts.name, fn);

    log.info('dropping indexes');
    if (truebug.mode !== 'dryRun') {
        const indexes = db.indexes;
        Object.keys(indexes).forEach(idx => {
            db.conn.prepare(`DROP INDEX IF EXISTS ${idx}`).run();
        })
    }
}

const buildIndexes = () => {
    const fn = 'buildIndexes';
    if (!ts[fn]) return;
    //utils.incrementStack(logOpts.name, fn);

    log.info('building indexes');
    if (truebug.mode !== 'dryRun') {
        const indexes = db.indexes;

        for (const [name, stmt] of Object.entries(indexes)) {
            log.info(`- ${name}`);
            db.conn.prepare(stmt).run();
        }
    }
}

const analyzeDb = () => {
    const fn = 'analyzeDb';
    if (!ts[fn]) return;

    log.info('analyzing db');

    if (truebug.mode !== 'dryRun') {
        db.conn.prepare('ANALYZE').run();
    }
}

const selCountOfTreatments = () => {
    const fn = 'selCountOfTreatments';
    if (!ts[fn]) return;
    //utils.incrementStack(logOpts.name, fn);

    const sql = 'SELECT Count(*) AS c FROM treatments';

    log.info('Getting count of treatments already in the db… ', 'start');
    const num = db.conn.prepare(sql).get().c;
    log.info(`found ${num}\n`, 'end');
    return num;
}

// select the latest entry for each type of archive
const getLastUpdate = () => {
    const stm = `SELECT 
    typeOfArchive, 
    timeOfArchive, 
    started, 
    ended, 
    ended - started AS duration,
    treatments,
    treatmentCitations,
    materialCitations,
    figureCitations,
    bibRefCitations,
    treatmentAuthors,
    collectionCodes,
    journals
FROM archives JOIN etl ON archives.id = etl.archives_id 
WHERE archives.id IN (
    SELECT max(id) 
    FROM archives 
    GROUP BY typeOfArchive
) 
ORDER BY archives.id`;
    return db.conn.prepare(stm).all();
}

const insertStats = (stats) => {
    if (!ts.insertStats) return;
    //utils.incrementStack(logOpts.name, 'insertStats');

    log.info(`inserting stats`);

    const dbConn = db.conn;
    const fn = db.insertFuncs;

    const insertArchivesGet_archives_id = fn.insertArchivesGet_archives_id(dbConn);
    const insertDownloads = fn.insertDownloads(dbConn);
    const insertEtl = fn.insertEtl(dbConn);
    const insertUnzip = fn.insertUnzip(dbConn);

    if (truebug.mode !== 'dryRun') {
        console.log(stats.archive)
        const archives_id = insertArchivesGet_archives_id.run(stats.archive)
            .lastInsertRowid;

        stats.download.archives_id = archives_id;
        insertDownloads.run(stats.download);

        stats.etl.archives_id = archives_id;
        insertEtl.run(stats.etl);

        stats.unzip.archives_id = archives_id;
        insertUnzip.run(stats.unzip);
    }
}

const getDaysSinceLastEtl = () => {
    const fn = 'getDaysSinceLastEtl';
    if (!ts[fn]) return;
    //utils.incrementStack(logOpts.name, fn);

    const s = `SELECT ((strftime('%s','now') - Max(ended)/1000)/3600/24) AS daysSinceLastEtl
    FROM st.etlstats 
    WHERE process = 'etl'`;
    return db.conn.prepare(s).get().daysSinceLastEtl
}

/**
 * queries each table in the db and prints out the 
 * count of rows
 */
const getCounts = () => {
    const fn = 'getCounts';
    if (!ts[fn]) return;
    //utils.incrementStack(logOpts.name, fn);

    const tables = db.conn.prepare(`SELECT name  
FROM sqlite_master 
WHERE 
    type = 'table' 
    AND name NOT LIKE 'sqlite%' 
    AND Instr(name, 'Ft') = 0 
    AND name NOT IN (
        'materialCitationsGeopoly_node',
        'materialCitationsGeopoly_parent',
        'materialCitationsGeopoly_rowid',
        'materialCitationsRtree_node',
        'materialCitationsRtree_parent',
        'materialCitationsRtree_rowid'
    )
ORDER BY name`).all();

    let total = 0;

    tables.forEach(t => {
        try {
            const start = process.hrtime.bigint();
            t.rows = db.conn
                .prepare(`SELECT Count(*) AS c FROM ${t.name}`)
                .get()
                .c;
            const end = process.hrtime.bigint();

            // convert nanoseconds to ms
            //
            const took = Number(end - start) / 1e6;
            t.took = took;
            total += t.rows;
    }
        catch (error) {
            console.log(error);
        }
    });

    tables.push({ name: 'Total rows', rows: total });
    log.info('getting counts');
    console.table(tables);
}

/**
 * prints out updates for full, monthly, weekly and daily archives
 */
const getArchiveUpdates = () => {
    const fn = 'getArchiveUpdates';
    if (!ts[fn]) return;
    //utils.incrementStack(logOpts.name, fn);

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

    const lastUpdate = getLastUpdate();
    console.table(lastUpdate)
}

const updateIsOnLand = () => {
    const fn = 'updateIsOnLand';
    if (!ts[fn]) return;
    //utils.incrementStack(logOpts.name, fn);

    log.info(`updating column isOnLand in table materialsCitations`);

    /*
    | lat/lng             | validGeo | isOnLand |
    |---------------------|----------|----------|
    | lat/lng are empty   | 0        | NULL     |
    | lat/lng are wrong   | 0        | NULL     |
    | lat/lng are correct | 1        | 1 or 0   | <- were updated previously
    | lat/lng are correct | 1        | NULL     | <- need to be updated
    */
    const select = db.conn.prepare(`SELECT 
        id, latitude, longitude, isOnLand 
    FROM 
        mc.materialsCitations 
    WHERE 
        deleted = 0 AND 
        validGeo = 1 AND 
        isOnLand IS NULL`).all();

    const update = db.conn.prepare(`UPDATE 
        mc.materialsCitations 
    SET 
        isOnLand = @isOnLand 
    WHERE id = @id`);

    let count = 0;

    for (const rec of select) {

        // default params
        const params = {id: rec.id};

        if (isSea(rec.latitude, rec.longitude)) {

            // point is in sea so set isOnLand to 0
            params.isOnLand = 0;
        }
        else {
            params.isOnLand = 1;
            count++;
        }
        
        update.run(params);
    }

    log.info(`updated ${count} rows as being on land`);
}

export {
    insertTreatments,
    dropIndexes,
    buildIndexes,
    analyzeDb,
    selCountOfTreatments,
    getLastUpdate,
    insertStats,
    getDaysSinceLastEtl,
    getCounts,
    getArchiveUpdates,
    updateIsOnLand,
    cache
}