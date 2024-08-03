import { initDb } from '../../lib/dbconn.js';
const db = initDb().conn;

function createIndexOnLonLat(db) {
    console.log('creating index lon_lat on materialCitations');
    db.prepare('CREATE INDEX ix_materialCitations_lon_lat ON materialCitations(longitude, latitude)').run();
}

function dropRtreeTable(db) {
    console.log('dropping tables materialCitationsRtree');
    db.prepare('DROP TABLE IF EXISTS materialCitationsRtree').run();
    db.prepare('DROP TABLE IF EXISTS materialCitationsRtree2').run();
}

function createRtreeTable(db) {
    console.log('creating table materialCitationsRtree');
    db.prepare(`
CREATE VIRTUAL TABLE IF NOT EXISTS materialCitationsRtree USING rtree (

    -- corresponds to materialCitations.id
    id,

    -- lower left longitude of the Rtree box
    minX,

    -- lower left latitude of the Rtree box
    minY,

    -- upper right longitude of the Rtree box
    maxX,

    -- upper right latitude of the Rtree box
    maxY,

    -- longitude of the materialCitation (Rtree box centroid)
    +longitude REAL NOT NULL,

    -- latitude of the materialCitation (Rtree box centroid)
    +latitude REAL NOT NULL,

    -- ID of parent treatment
    +treatments_id INTEGER NOT NULL
)`).run();
}

function initialLoadRtreeTable(db) {
    console.log('initial data load into materialCitationsRtree');
    db.prepare(`
INSERT INTO materialCitationsRtree (
    id, minX, minY, maxX, maxY, longitude, latitude, treatments_id 
)
SELECT 
    id, 
    json_extract(g, '$[0][0]') AS minX, 
    json_extract(g, '$[0][1]') AS minY,
    json_extract(g, '$[2][0]') AS maxX,
    json_extract(g, '$[2][1]') AS maxY,
    longitude,
    latitude,
    treatments_id
FROM (
    SELECT
        id,
        geopoly_json(
            geopoly_bbox(
                geopoly_regular(
                    longitude, 
                    latitude, 

                    -- 5 meters in degrees at given latitude
                    abs(5/(40075017*cos(latitude)/360)),

                    -- num of sides of poly
                    4
                )
            )
        ) AS g,
        longitude, 
        latitude,
        treatments_id
    FROM
        materialCitations
    WHERE 
        validGeo = 1
)
    `)
}

createIndexOnLonLat(db);
dropRtreeTable(db);
createRtreeTable(db);
initialLoadRtreeTable(db);