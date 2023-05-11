export const inserts = {
    selectMaterialCitations_id: (db) => db.prepare('SELECT id AS materialCitations_id FROM materialCitations WHERE materialCitationId = ?'),

    insertMaterialCitation: (db) => db.prepare(
        `INSERT INTO materialCitations (
            materialCitationId,
            treatments_id,
            collectingDate,
            collectionCodeCSV,
            collectorName,
            country,
            collectingRegion,
            municipality,
            county,
            stateProvince,
            location,
            locationDeviation,
            specimenCountFemale,
            specimenCountMale,
            specimenCount,
            specimenCode,
            typeStatus,
            determinerName,
            collectedFrom,
            collectingMethod,
            latitude,
            longitude,
            elevation,
            httpUri,
            fulltext,
            deleted
        )
        VALUES ( 
            @materialCitationId,
            @treatments_id,
            @collectingDate,
            @collectionCodeCSV,
            @collectorName,
            @country,
            @collectingRegion,
            @municipality,
            @county,
            @stateProvince,
            @location,
            @locationDeviation,
            @specimenCountFemale,
            @specimenCountMale,
            @specimenCount,
            @specimenCode,
            @typeStatus,
            @determinerName,
            @collectedFrom,
            @collectingMethod,
            @latitude,
            @longitude,
            @elevation,
            @httpUri,
            @fulltext,
            @deleted
        )
        ON CONFLICT (materialCitationId)
        DO UPDATE SET
            treatments_id=excluded.treatments_id,
            collectingDate=excluded.collectingDate,
            collectionCodeCSV=excluded.collectionCodeCSV,
            collectorName=excluded.collectorName,
            country=excluded.country,
            collectingRegion=excluded.collectingRegion,
            municipality=excluded.municipality,
            county=excluded.county,
            stateProvince=excluded.stateProvince,
            location=excluded.location,
            locationDeviation=excluded.locationDeviation,
            specimenCountFemale=excluded.specimenCountFemale,
            specimenCountMale=excluded.specimenCountMale,
            specimenCount=excluded.specimenCount,
            specimenCode=excluded.specimenCode,
            typeStatus=excluded.typeStatus,
            determinerName=excluded.determinerName,
            collectedFrom=excluded.collectedFrom,
            collectingMethod=excluded.collectingMethod,
            latitude=excluded.latitude,
            longitude=excluded.longitude,
            elevation=excluded.elevation,
            httpUri=excluded.httpUri,
            fulltext=excluded.fulltext,
            deleted=excluded.deleted`),

    insertMaterialCitationsFts: (db) => db.prepare(
        `INSERT INTO materialCitationsFts (
            rowid, 
            fulltext
        ) 
        SELECT 
            id,
            fullText
        FROM materialCitations`),

    // createTempTableCoords: (db) => db.prepare(`
    //     CREATE TEMP TABLE coords AS
    //     SELECT
    //         materialCitations_id, 
    //         treatments_id, 
    //         shape,
    //         json_extract(geopolyJson, '$[0][0]') AS minX,
    //         json_extract(geopolyJson, '$[0][1]') AS minY,
    //         json_extract(geopolyJson, '$[2][0]') AS maxX,
    //         json_extract(geopolyJson, '$[2][1]') AS maxY
    //     FROM (
    //         SELECT 
    //             materialCitations_id, 
    //             treatments_id, 
    //             shape, 
    //             geopoly_json(shape) AS geopolyJson 
    //         FROM (
    //             SELECT 
    //                 materialCitations_id, 
    //                 treatments_id, 
    //                 geopoly_bbox(geopolyRegular) AS shape
    //             FROM (
    //                 SELECT 
    //                     materialCitations_id, 
    //                     treatments_id,
    //                     geopoly_regular(
    //                         longitude, 
    //                         latitude, 
    //                         abs(5/(40075017*cos(latitude)/360)),
    //                         4
    //                     ) AS geopolyRegular
    //                 FROM (
    //                     SELECT 
    //                         id AS materialCitations_id, 
    //                         treatments_id,
    //                         longitude, 
    //                         latitude
    //                     FROM materialCitations
    //                     WHERE validGeo = 1
    //                 )
    //             )
    //         )
    //     )
    // `)
}