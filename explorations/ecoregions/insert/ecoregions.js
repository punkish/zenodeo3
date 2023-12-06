import { dbgeo } from '../dbconn.js';

function er() {
    console.log('insert data in table ecoregions');

    const sql = `INSERT INTO ecoregions ( eco_name, biome_name, geometry ) 
    VALUES ( @eco_name, @biome_name, @geometry )`;

    const insert = dbgeo.prepare(sql);

    const data = [
        {
            eco_name: 'one eco',
            biome_name: 'one biome',
            geometry: '[[-16,12],[10,15],[24,2],[23,-10],[15,-10],[5,-5],[-16,12]]'
        },
        {
            eco_name: 'two eco',
            biome_name: 'two biome',
            geometry: '[[15,-10],[10,-15],[-20,-20],[-25,-5],[5,-5],[15,-10]]'
        },
        {
            eco_name: 'three eco',
            biome_name: 'two biome',
            geometry: '[[-16,12],[5,-5],[-25,-5],[-16,12]]'
        }
    ];


    const insertMany = dbgeo.transaction((data) => {
        for (const row of data) insert.run(row);
    });

    insertMany(data);
}

function bm() {
    console.log('insert data in table biomes');

    const sql = `INSERT INTO biomes (biome_name) 
    SELECT DISTINCT biome_name FROM ecoregions`;
    dbgeo.prepare(sql).run();
}

export { er, bm }