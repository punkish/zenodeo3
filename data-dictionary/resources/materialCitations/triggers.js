export const triggers = {
    mc_afterInsert: `
CREATE TRIGGER IF NOT EXISTS mc_afterInsert 
AFTER INSERT ON materialCitations 
BEGIN

    --insert new entry in fulltext index
    INSERT INTO materialCitationsFts( fulltext ) 
    VALUES ( new.fulltext );

    -- update validGeo in treatments
    UPDATE treatments 
    SET validGeo = new.validGeo
    WHERE treatments.id = new.treatments_id;
END;`,

    mc_afterUpdate: `
CREATE TRIGGER IF NOT EXISTS mc_afterUpdate
AFTER UPDATE ON materialCitations 
BEGIN

    -- "delete" the old index from the fts table
    INSERT INTO materialCitationsFts( materialCitationsFts, rowid, fulltext ) 
    VALUES( 'delete', old.id, old.fulltext );

    -- add the new index to the fts table
    INSERT INTO materialCitationsFts( rowid, fulltext ) 
    VALUES ( new.id, new.fulltext );
END;`,

    mc_afterDelete: `
CREATE TRIGGER IF NOT EXISTS mc_afterDelete 
AFTER DELETE ON materialCitations 
BEGIN

    -- "delete" the old index from the fts table
    INSERT INTO materialCitationsFts( materialCitationsFts, rowid, fulltext ) 
    VALUES( 'delete', old.id, old.fulltext );

    -- remove entries from the geopoly and rtree tables
    DELETE FROM materialCitationsGeopoly 
    WHERE materialCitations_id = old.id;

    DELETE FROM materialCitationsRtree 
    WHERE id = old.id;
END;`,

    mc_loc_afterInsert: `
CREATE TRIGGER IF NOT EXISTS mc_loc_afterInsert 
AFTER INSERT ON materialCitations 
WHEN new.validGeo = 1
BEGIN

    -- insert new entry in geopoly table
    INSERT INTO materialCitationsGeopoly (
        _shape,
        materialCitations_id,
        treatments_id
    ) 
    VALUES (

        -- shape
        geopoly_bbox(
            geopoly_regular(
                new.longitude, 
                new.latitude, 

                -- 5 meters in degrees at given latitude
                abs(5/(40075017*cos(new.latitude)/360)),

                -- num of sides of poly
                4
            )
        ),
        new.id,
        new.treatments_id
    );

    -- insert new entry in the rtree table
    INSERT INTO materialCitationsRtree (
        id,
        minX,
        maxX,
        minY,
        maxY,
        longitude, 
        latitude,
        treatments_id
    )
    SELECT 
        id,
        json_extract(g, '$[0][0]') AS minX, 
        json_extract(g, '$[2][0]') AS maxX,
        json_extract(g, '$[0][1]') AS minY,
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
                        new.longitude, 
                        new.latitude, 

                        -- 5 meters in degrees at given latitude
                        abs(5/(40075017*cos(new.latitude)/360)),

                        -- num of sides of poly
                        4
                    )
                )
            ) AS g,
            new.longitude, 
            new.latitude,
            new.treatments_id
    );
END;`,

    mc_loc_temp_afterInsert: `
CREATE TEMPORARY TRIGGER IF NOT EXISTS mc_loc_temp_afterInsert 
AFTER INSERT ON materialCitations 
WHEN new.validGeo = 1
BEGIN

    -- update 'ecoregions_id', 'biomes_id' and 'realms_id' columns
    UPDATE materialCitations
    SET 
        ecoregions_id = (
            SELECT ecoregions_id 
            FROM geodata.ecoregionsGeopoly
            WHERE geopoly_contains_point(
                _shape, new.longitude, new.latitude
            )
        ),
        biomes_id = (
            SELECT biomes_id 
            FROM geodata.ecoregionsGeopoly
            WHERE geopoly_contains_point(
                _shape, new.longitude, new.latitude
            )
        ),
        realms_id = (
            SELECT realms_id 
            FROM geodata.ecoregionsGeopoly
            WHERE geopoly_contains_point(
                _shape, new.longitude, new.latitude
            )
        )
    WHERE id = new.id;
END;`,
    

    // mc_ccode_afterInsert: `CREATE TRIGGER IF NOT EXISTS mc_ccode_afterInsert
    // AFTER INSERT ON materialCitations
    // WHEN new.collectionCodeCSV IS NOT NULL AND new.collectionCodeCSV != ''
    // BEGIN

    //     -- split collectionCodeCSV into separate values and insert
    //     -- into collectionCodes
    //     INSERT OR REPLACE INTO collectionCodes (collectionCode) 
    //         SELECT value AS collectionCode 
    //         FROM 
    //             materialCitations, 
    //             json_each(
    //                 '["' || Replace(new.collectionCodeCSV, ',', '","') || '"]'
    //             )
    //         WHERE materialCitations.id = new.id;

    //     -- insert materialCitationsId and collectionCode in the 
    //     -- many-to-many cross table
    //     INSERT OR REPLACE INTO materialCitations_x_collectionCodes (
    //         materialCitationId, 
    //         collectionCode
    //     )
    //     SELECT 
    //         materialCitationId,
    //         value AS collectionCode
    //     FROM 
    //         materialCitations, 
    //         json_each(
    //             '["' || Replace(new.collectionCodeCSV, ',', '","') || '"]'
    //         )
    //     WHERE materialCitations.id = new.id;
    // END;`,
}