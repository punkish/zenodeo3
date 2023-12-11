import { initDb } from '../lib/dbconn.js';
const db = initDb();
import * as utils from '../lib/utils.js';
//import process from 'node:process';

const sql = {
    // 'Count(id)': `SELECT Count(images."id") AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON treatments.id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.synonym LIKE 'Flooded Grasslands and Savannas%'`,

    // 'Count(DISTINCT id)': `SELECT Count(DISTINCT images."id") AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON treatments.id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.synonym LIKE 'Flooded Grasslands and Savannas%'`,

    'ORDER BY id': `SELECT images."id", images."httpUri", images."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentDOI", treatments."zenodoDep", treatments."articleTitle", treatments."articleAuthor" FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON treatments.id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.synonym LIKE 'Flooded Grasslands and Savannas%' GROUP BY images."id" ORDER BY +images."id" ASC`,

    'no ORDER BY': `SELECT images."id", images."httpUri", images."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentDOI", treatments."zenodoDep", treatments."articleTitle", treatments."articleAuthor" FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON treatments.id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.synonym LIKE 'Flooded Grasslands and Savannas%' GROUP BY images."id"`
};

for (const [queryType, stmt] of Object.entries(sql)) {
    try {
        let t = process.hrtime();
        const res = db.conn.prepare(stmt).all()
        t = process.hrtime(t);
        const runtime = utils.timerFormat(t);
        console.log(`${queryType} took ${runtime}`);

        // if (queryType === 'no ORDER BY') {
        //     let t = process.hrtime();
        //     const sortedRes = res.sort((a, b) => a.id - b.id);
        //     t = process.hrtime(t);
        //     const runtime = utils.timerFormat(t);
        //     console.log(`${queryType} (sorting in JS) took ${runtime}`);
        // }
    }
    catch(error) {
        console.log(sql);
        throw error;
    }
}