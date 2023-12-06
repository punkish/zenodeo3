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
            upd.run({ ecoregions_id, biomes_id })
        }

        const row500 = !(count % 500);
        const row5000 = !(count % 5000);

        if (row500) {
            process.stdout.write('.');
        }

        if (row5000) {
            process.stdout.write(` ${count} `);
        }

        count++;
    }
}

updateMaterialCitationsWithGeo();