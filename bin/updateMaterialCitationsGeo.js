/*
 * This script is required to be run only once, to update and existing 
 * materialCitations with ecoregions_id and biomes_id values from the attached 
 * geodata.ecoregionsGeopoly table. Once the materialCitations table is 
 * initialized, a TEMPORARY TRIGGER created by truebug does the same job 
 * everytime new rows are added to the materialCitations table.
 * 
 * Run this script from the app root like so
 * 
 * $ ➜  zenodeo3 git:(master) node bin/updateMaterialCitationsGeo.js
 */

import { initDb } from '../lib/dbconn.js';
const db = initDb();

function updateMaterialCitationsWithGeo() {    
    const data = db.conn.prepare(`
        SELECT id, longitude, latitude 
        FROM materialCitations
        WHERE validGeo = 1
    `).all();

    const sel = db.conn.prepare(`
        SELECT ecoregions_id, biomes_id 
        FROM geodata.ecoregionsGeopoly
        WHERE geopoly_contains_point(_shape, @longitude, @latitude)
    `);


    const upd = db.conn.prepare(`
        UPDATE materialCitations
        SET ecoregions_id = @ecoregions_id,
            biomes_id = @biomes_id 
        WHERE id = @id
    `);

    let count = 0;

    for (const {id, longitude, latitude} of data) {
        const res = sel.get({ longitude, latitude });

        if (res && res.ecoregions_id) {
            const { ecoregions_id, biomes_id } = res;
            upd.run({ ecoregions_id, biomes_id, id })
        }

        const row500 = !(count % 500);
        const row5000 = !(count % 5000);

        if (count > 0) {
            if (row500) process.stdout.write('.');
            if (row5000) process.stdout.write(` ${count} `);
        }
        
        count++;
    }
}

updateMaterialCitationsWithGeo();