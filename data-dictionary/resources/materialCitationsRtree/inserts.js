export const inserts = {
    insertMaterialCitationsRtree: (db) => db.prepare(`
        INSERT INTO materialCitationsRtree (
            minX, maxX, minY, maxY, 
            materialCitations_id, 
            treatments_id
        )
        SELECT 
            json_extract(geopolyJson, '$[0][0]') AS minX,
            json_extract(geopolyJson, '$[2][0]') AS maxX,
            json_extract(geopolyJson, '$[0][1]') AS minY,
            json_extract(geopolyJson, '$[2][1]') AS maxY, 
            materialCitations_id, 
            treatments_id 
        FROM (
            SELECT  
                geopoly_json(
                    geopoly_bbox(
                        geopoly_regular(
                            longitude, 
                            latitude, 
                            abs(5/(40075017*cos(latitude)/360)),
                            4
                        )
                    )
                ) AS geopolyJson,
                id AS materialCitations_id, 
                treatments_id
            FROM materialCitations
            WHERE validGeo = 1
        )
    `)
}