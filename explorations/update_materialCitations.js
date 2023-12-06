'use strict';

import process from 'node:process';
import Database from 'better-sqlite3';
const dbName = `../data/db/zenodeo.sqlite`;
const db = new Database(dbName);
db.prepare(`ATTACH DATABASE '../data/db/geodata.sqlite' AS geodata`).run();

// step1: create geopoly table
//createGeopoly();

// step2: populate geopoly table
//populateGeopoly();

// step3: update materialCitations 
//updateMatCitations();

// step4: test geopoly data
testGeopoly1({
    //biome_name: 'Temperate Conifer Forests',
    eco_name: 'Arizona Mountains forests'
});

testGeopoly2({
    //biome_name: 'Temperate Conifer Forests',
    eco_name: 'Arizona Mountains forests'
});

function createGeopoly() {
    const sql = `CREATE VIRTUAL TABLE ecoregionsGeopoly USING geopoly(
        ecoregions_id,
        biomes_id
    )`;

    db.prepare(sql).run();
}

function populateGeopoly() {

    const sql1 = `SELECT id AS ecoregions_id, biome_name, geometry 
    FROM ecoregions`;
    const data = db.prepare(sql1).all();

    const sql2 = `SELECT id AS biomes_id 
    FROM biomes 
    WHERE biome_name = @biome_name`;
    const selBiome = db.prepare(sql2);

    const sql3 = `INSERT INTO ecoregionsGeopoly(_shape, ecoregions_id, biomes_id) 
    VALUES (@_shape, @ecoregions_id, @biomes_id)`;
    const insGeoJson = db.prepare(sql3);

    for (const row of data) {
        const { ecoregions_id, biome_name, geometry } = row;
        const geojson = JSON.parse(geometry);

        const { biomes_id } = selBiome.get({ biome_name });

        let _shape = geojson.type === 'Polygon' 
            ? geojson.coordinates[0]
            : geojson.coordinates[0][0];

        insGeoJson.run({
            _shape: JSON.stringify(_shape), 
            ecoregions_id,
            biomes_id
        });
    }
}

function updateMatCitations() {
    const sel1 = db.prepare(`SELECT id, longitude, latitude 
    FROM materialCitations 
    WHERE validGeo = 1`);

    const sel2 = db.prepare(`SELECT e.id AS ecoregions_id , b.id AS biomes_id  
    FROM geodata.ecoregionsGeopoly eg JOIN 
        geodata.ecoregions e ON eg.ecoregions_id = e.id JOIN
        geodata.biomes b ON e.biome_name = b.biome_name
    WHERE geopoly_contains_point(_shape, @longitude, @latitude)`);

    const upd = db.prepare(`UPDATE materialCitations
    SET 
        ecoregions_id = @ecoregions_id, 
        biomes_id = @biomes_id
    WHERE id = @id`);

    const data = sel1.all();

    for (const row of data) {
   
        const { id, longitude, latitude } = row;
        const res = sel2.get({ longitude, latitude });

        if (res) {
            upd.run({ 
                ecoregions_id: res.ecoregions_id, 
                biomes_id: res.biomes_id, 
                id 
            });
        }

    }
}


function testGeopoly1({ biome_name, eco_name }) {
    const start = process.hrtime();

    let sql1 = `SELECT m.id, m.longitude, m.latitude
    FROM materialCitations m 
        JOIN geodata.ecoregionsGeopoly gg ON geopoly_contains_point(_shape, m.longitude, m.latitude) 
        JOIN geodata.ecoregions ge ON gg.ecoregions_id = ge.id 
    WHERE m.validGeo = 1`;

    if (biome_name) {
        sql1 += `  AND ge.biome_name = @biome_name`;
    }
    else if (eco_name) {
        sql1 += ` AND ge.eco_name = @eco_name`;
    }

    console.log(sql1)
    const sel1 = db.prepare(sql1);

    const data = sel1.all({ biome_name, eco_name });

    for (const row of data) {

        const { id, longitude, latitude } = row;

        let msg = `id: ${id} [x: ${longitude}, y: ${latitude}] is in `;
        
        if (biome_name) {
            msg += `biome: ${biome_name}`;
        } else if (eco_name) {
            msg += `ecoregion ${eco_name}`;
        }

        //console.log(msg);
    }

    console.log(`${data.length} records found`);
    const end = process.hrtime(start);
    console.log(end);
}

function testGeopoly2({ biome_name, eco_name }) {
    const start = process.hrtime();

    let sql1 = `SELECT m.id, m.longitude, m.latitude
    FROM materialCitations m`;

    if (biome_name) {
        sql1 += ` JOIN geodata.biomes gb ON m.biomes_id = gb.id 
        WHERE m.validGeo = 1 AND gb.biome_name = @biome_name`;
    }
    else if (eco_name) {
        sql1 += ` JOIN geodata.ecoregions ge ON m.ecoregions_id = ge.id 
        WHERE m.validGeo = 1 AND ge.eco_name = @eco_name`;
    }

    console.log(sql1)
    const sel1 = db.prepare(sql1);

    // const sel2 = db.prepare(`SELECT e.id AS ecoregions_id , b.id AS biomes_id  
    // FROM geodata.ecoregionsGeopoly eg JOIN 
    //     geodata.ecoregions e ON eg.ecoregions_id = e.id JOIN
    //     geodata.biomes b ON e.biome_name = b.biome_name
    // WHERE geopoly_contains_point(_shape, @longitude, @latitude)`);

    const data = sel1.all({ biome_name, eco_name });

    for (const row of data) {

        const { id, longitude, latitude } = row;

        let msg = `id: ${id} [x: ${longitude}, y: ${latitude}] is in `;
        
        if (biome_name) {
            msg += `biome: ${biome_name}`;
        } else if (eco_name) {
            msg += `ecoregion ${eco_name}`;
        }

        //console.log(msg);
    }

    console.log(`${data.length} records found`);
    const end = process.hrtime(start);
    console.log(end);
}

// biomes
// 1   Tundra                                                  
// 2   Tropical & Subtropical Moist Broadleaf Forests          
// 3   Mediterranean Forests, Woodlands & Scrub                
// 4   Deserts & Xeric Shrublands                              
// 5   Temperate Grasslands, Savannas & Shrublands             
// 6   Boreal Forests/Taiga                                    
// 7   Temperate Conifer Forests                               
// 8   Temperate Broadleaf & Mixed Forests                     
// 9   Montane Grasslands & Shrublands                         
// 10  Mangroves                                               
// 11  Flooded Grasslands & Savannas                           
// 12  Tropical & Subtropical Grasslands, Savannas & Shrublands
// 13  Tropical & Subtropical Dry Broadleaf Forests            
// 14  Tropical & Subtropical Coniferous Forests               
// 15  N/A                                     

// biome: Temperate Conifer Forests  
// eco_name                                               
// -------------------------------------------------------
// Alberta-British Columbia foothills forests             
// Alps conifer and mixed forests                         
// Altai montane forest and forest steppe                 
// Arizona Mountains forests                              
// Atlantic coastal pine barrens                          
// Blue Mountains forests                                 
// British Columbia coastal conifer forests               
// Caledon conifer forests                                
// Carpathian montane forests                             
// Central-Southern Cascades Forests                      
// Central British Columbia Mountain forests              
// Central Pacific Northwest coastal forests              
// Colorado Rockies forests                               
// Da Hinggan-Dzhagdy Mountains conifer forests           
// East Afghan montane conifer forests                    
// Eastern Cascades forests                               
// Eastern Himalayan subalpine conifer forests            
// Elburz Range forest steppe                             
// Fraser Plateau and Basin conifer forests               
// Great Basin montane forests                            
// Helanshan montane conifer forests                      
// Hengduan Mountains subalpine conifer forests           
// Hokkaido montane conifer forests                       
// Honshu alpine conifer forests                          
// Khangai Mountains conifer forests                      
// Klamath-Siskiyou forests                               
// Mediterranean conifer and mixed forests                
// Northeast Himalayan subalpine conifer forests          
// Northern Anatolian conifer and deciduous forests       
// Northern California coastal forests                    
// Nujiang Langcang Gorge alpine conifer and mixed forests
// Okanogan dry forests                                   
// Piney Woods                                            
// Puget lowland forests                                  
// Qilian Mountains conifer forests                       
// Qionglai-Minshan conifer forests                       
// Sayan montane conifer forests                          
// Scandinavian coastal conifer forests                   
// Sierra Nevada forests                                  
// South Central Rockies forests                          
// Tian Shan montane conifer forests                      
// Wasatch and Uinta montane forests                      
// Western Himalayan subalpine conifer forests            
// Queen Charlotte Islands conifer forests                
// Northern Pacific Alaskan coastal forests               
// North Cascades conifer forests                         
// Northern Rockies conifer forests 