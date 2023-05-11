export const inserts = {
    insertMaterialCitationsGeopoly: (db) => db.prepare(`
        INSERT INTO materialCitationsGeopoly (
            _shape, 
            materialCitations_id, 
            treatments_id
        )
        SELECT 
            geopoly_bbox(
                geopoly_regular(
                    longitude, 
                    latitude, 
                    abs(5/(40075017*cos(latitude)/360)),
                    4
                )
            ) AS shape,
            id AS materialCitations_id, 
            treatments_id
        FROM materialCitations
        WHERE validGeo = 1
    `)
}