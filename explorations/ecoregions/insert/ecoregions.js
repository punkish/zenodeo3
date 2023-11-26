import { db } from '../dbconn.js';

function er() {
    console.log('insert data in table ecoregions');

    const sql = `INSERT INTO ecoregions ( eco_name, biome_name, geometry ) 
    VALUES ( @eco_name, @biome_name, @geometry )`;

    const insert = db.prepare(sql);

    const data = [
        {
            eco_name: 'one eco',
            biome_name: 'one biome',
            geometry: '[[-25,4],[-16,12],[10,11],[-3,3],[-25,4]]'
        },
        {
            eco_name: 'two eco',
            biome_name: 'two biome',
            geometry: '[[10,11],[24,2],[23,-10],[11,-7],[-3,3],[10,11]]'
        },
        {
            eco_name: 'three eco',
            biome_name: 'two biome',
            geometry: '[[11,-7],[-18,-12],[-25,4],[3,3],[11,-7]]'
        }
    ];


    const insertMany = db.transaction((data) => {
        for (const row of data) insert.run(row);
    });

    insertMany(data);
}

export { er }