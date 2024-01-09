import { initDb } from '../lib/dbconn.js';
const db = initDb().conn;

const timeTaken = {};

function selEcoregionsByBiomeSynonym(biome) {
    const start = process.hrtime.bigint();

    const res = db.prepare(`
        SELECT e.id AS ecoregions_id 
        FROM geodata.ecoregions e JOIN 
            geodata.biome_synonyms bs ON e.biomes_id = bs.biomes_id 
        WHERE bs.biome_synonym LIKE @biome;
    `).all({ biome });

    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    timeTaken.selEcoregionsByBiomeSynonym = ms;
    return res.map(r => r.ecoregions_id);
}

function selEcoregionsPolygonByEcoregions_id(arrEcoregions_ids) {
    const start = process.hrtime.bigint();

    const res = db.prepare(`
        SELECT id AS ecoregionsPolygons_id 
        FROM geodata.ecoregionsPolygons
        WHERE ecoregions_id IN (SELECT value FROM json_each(@ecoregions_ids))
    `).all({ ecoregions_ids: JSON.stringify(arrEcoregions_ids) });

    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    timeTaken.selEcoregionsPolygonByEcoregions_id = ms;
    return res.map(r => r.ecoregionsPolygons_id);
}

function selEcoregionsByEco_name(eco_name) {
    const start = process.hrtime.bigint();

    const res = db.prepare(`
        SELECT id AS ecoregions_id 
        FROM geodata.ecoregions
        WHERE eco_name LIKE @eco_name
    `).all({ eco_name: `${eco_name}%` });

    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    timeTaken.selEcoregionsByEco_name = ms;
    
    return res.map(r => r.ecoregions_id);
}

// function selShape(ecoregions_ids) {
//     const start = process.hrtime.bigint();

//     const res = db.prepare(`
//         SELECT _shape 
//         FROM geodata.ecoregionsGeopoly
//         WHERE rowid IN (@ecoregions_ids)
//     `).all({ ecoregions_ids: ecoregions_ids.join(',') });

//     const end = process.hrtime.bigint();
//     const ms = Number(end - start) / 1e6;
//     timeTaken.selShape = ms;

//     return res;
// }

function selShapesByEcoregionPolygons_ids(arrEcoregionsPolygons_ids) {
    const start = process.hrtime.bigint();

    const res = db.prepare(`
        SELECT _shape 
        FROM geodata.ecoregionsGeopoly
        WHERE rowid IN (SELECT value FROM json_each(@ecoregionsPolygons_ids))
    `).all({ ecoregionsPolygons_ids: JSON.stringify(arrEcoregionsPolygons_ids) });

    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    timeTaken.selShapesByEcoregionPolygons_ids = ms;
    return res.map(r => r._shape);
}

function printTime(timeTaken) {
    console.log('='.repeat(50));
    // const total = Object.values(timeTaken)
    //     .reduce(function (acc, v) { return acc + v; }, 0);
    // console.log(`this took ${total} ms`);
    let total = 0;
    for (const [f, t] of Object.entries(timeTaken)) {
        console.log(`${f.padEnd(35)}: ${t.toFixed(3)}ms`);
        total += t;
    }
    console.log('-'.repeat(50));
    console.log(`Total ${total.toFixed(3)}ms`);
}

function selMaterialCitationsByShapes(arrOfShapes) {
    process.stdout.write('selecting material citations by shapes…')
    const start = process.hrtime.bigint();

    const sql = db.prepare(`
        SELECT treatments_id 
        FROM materialCitationsGeopoly
        WHERE geopoly_within(_shape, @shape)
    `);

    const res = [];

    let count = 0;

    for (const shape of arrOfShapes) {
        //const start = process.hrtime.bigint();
        const results = sql.all({ shape });
        // const end = process.hrtime.bigint();
        // const ms = Number(end - start) / 1e6;

        // if (ms > 10000) {
        //     console.log(`${rowid} took ${ms}`);
        // }

        res.push(...results);
        count++;
        if (!(count % 10)) process.stdout.write('.');
        if (!(count % 100)) process.stdout.write(` ${count} `);
    }

    process.stdout.write(' done\n');

    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    timeTaken.selMaterialCitationsByShapes = ms;

    return res;
}

function selImagesByTreatments_id(arrTreatments_ids) {
    const start = process.hrtime.bigint();

    const res = db.prepare(`
        SELECT id  
        FROM images 
        WHERE treatments_id IN (SELECT value FROM json_each(@treatments_id))
    `).all({ treatments_id: JSON.stringify(arrTreatments_ids) });

    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    timeTaken.selImagesByTreatments_id = ms;

    return res;
}

function printMsg(msg) {
    console.log(msg);
}

function findImagesSpatial({ biome, ecoregion }) {

    // first we select all the ecoregions_ids for a given biome or eco_name
    const arrEcoregions_ids = biome
        ? selEcoregionsByBiomeSynonym(biome)
        : selEcoregionsByEco_name(ecoregion);

    printMsg(`ecoregion ids: found ${arrEcoregions_ids.length} ecoregions`);
    
    // since each ecoregions_id can have multiple polygons in its geometry, 
    // we find all the simple polygons belonging to the selected ecoregions_ids
    const arrEcoregionsPolygons_ids = selEcoregionsPolygonByEcoregions_id(
        arrEcoregions_ids
    );
    printMsg(`ecoregionsPolygons ids: ${arrEcoregionsPolygons_ids.length} ecoregionsPolygons`);
    
    const arrShapes = selShapesByEcoregionPolygons_ids(
        arrEcoregionsPolygons_ids
    );
    printMsg(`shapes: found ${arrShapes.length} shapes`);
    
    const arrMaterialCitations = selMaterialCitationsByShapes(arrShapes);
    const allTreatments_ids = arrMaterialCitations.map(r => r.treatments_id);
    const arrTreatments_ids = allTreatments_ids.filter((value, index, array) => array.indexOf(value) === index);
    printMsg(`materialCitations: found ${arrMaterialCitations.length} materialCitations belonging to…`);
    printMsg(`treatments: ${arrTreatments_ids.length} treatments that have…`);

    const arrImages = selImagesByTreatments_id(arrTreatments_ids);
    printMsg(`images: ${arrImages.length} images`);

    printTime(timeTaken);
}

function findImagesNonSpatial({ biome, ecoregion }) {
    const start = process.hrtime.bigint();
    let sel;
    const runparams = {}

    if (biome) {
        sel = db.prepare(`
            SELECT DISTINCT images.id  
            FROM images JOIN 
                materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN 
                geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id
            WHERE geodata.biome_synonyms.biome_synonym = @biome
        `);

        runparams.biome = biome;
    }
    else if (ecoregion) {
        sel = db.prepare(`
            SELECT DISTINCT images.id  
            FROM images JOIN 
                materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN 
                geodata.ecoregions ON materialCitations.ecoregions_id = geodata.ecoregions.id
            WHERE geodata.ecoregions.eco_name = @ecoregion
        `);

        runparams.ecoregion = ecoregion;
    }

    const arrImages = sel.all(runparams);

    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    timeTaken.selImagesByTreatments_id = ms;

    printMsg(`images: ${arrImages.length} images`);
    printTime(timeTaken);
}

// findImagesSpatial({ ecoregion: 'Humid Pampas'} );
// images: 248 images
// Total 56.826ms

// findImagesSpatial({ biome: 'pampas'} );
// images: 4232 images
// Total 284665.923ms

// findImagesNonSpatial({ ecoregion: 'Humid Pampas'} );
// images: 248 images
// Total 29.144ms

// findImagesNonSpatial({ biome: 'pampas'} );
// images: 4185 images
// Total 351.281ms


function findImagesSpatial2({ biome, ecoregion }) {
    const start = process.hrtime.bigint();

    if (biome) {
        let start = process.hrtime.bigint();

        const res = db.prepare(`
            SELECT _shape AS shape
            FROM geodata.ecoregionsGeopoly
            WHERE rowid IN (
                SELECT id  
                FROM geodata.ecoregionsPolygons
                WHERE ecoregions_id IN (
                    SELECT e.id AS ecoregions_id 
                    FROM geodata.ecoregions e JOIN 
                        geodata.biome_synonyms bs ON e.biomes_id = bs.biomes_id 
                    WHERE bs.biome_synonym LIKE @biome
                )
            )
        `).all({ biome });

        const shapes = res.map(r => r.shape);

        let end = process.hrtime.bigint();
        let ms = Number(end - start) / 1e6;
        timeTaken.selImagesByTreatments_id = ms;

        printMsg(`shapes: ${shapes.length} shapes took ${ms}ms`);

        start = process.hrtime.bigint();

        const sel = db.prepare(`
            SELECT id  
            FROM images 
            WHERE treatments_id IN (
                SELECT treatments_id 
                FROM materialCitationsGeopoly
                WHERE geopoly_within(_shape, @shape)
            )
        `);

        const arrImages = [];

        for (const shape of shapes) {
            const images = sel.all({ shape });
            arrImages.push(...images);
        }

        end = process.hrtime.bigint();
        ms = Number(end - start) / 1e6;
        timeTaken.selImagesByTreatments_id = ms;

        printMsg(`images: ${arrImages.length} images took ${ms}ms`);
    }

    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    timeTaken.selImagesByTreatments_id = ms;

    //printMsg(`images: ${arrImages.length} images`);

    printTime(timeTaken);
}


findImagesSpatial2({ biome: 'pampas'});