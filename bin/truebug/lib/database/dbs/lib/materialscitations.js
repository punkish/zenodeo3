const db = {
    name: 'materialsCitations',
    alias: 'mc'
}

db.tables = [
    {
        name: 'materialsCitations',
        create: `CREATE TABLE IF NOT EXISTS ${db.alias}.materialsCitations ( 
            id INTEGER PRIMARY KEY,
            materialsCitationId TEXT NOT NULL,
            treatmentId TEXT NOT NULL,
            collectingDate TEXT,
            -- collection code here is a csv string as in the text
            collectionCode TEXT,
            collectorName TEXT,
            country TEXT,
            collectingRegion TEXT,
            municipality TEXT,
            county TEXT,
            stateProvince TEXT,
            location TEXT,
            locationDeviation TEXT,
            specimenCountFemale TEXT,
            specimenCountMale TEXT,
            specimenCount TEXT,
            specimenCode TEXT,
            typeStatus TEXT,
            determinerName TEXT,
            collectedFrom TEXT,
            collectingMethod TEXT,
            latitude REAL,
            longitude REAL,
            elevation REAL,
            httpUri TEXT,
            deleted INTEGER DEFAULT 0,
            created INTEGER DEFAULT (strftime('%s','now')),
            updated INTEGER,
            UNIQUE (materialsCitationId, treatmentId)
        )`,
        insert: `INSERT INTO ${db.alias}.materialsCitations (
            materialsCitationId,
            treatmentId,
            collectingDate,
            collectionCode,
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
            deleted
        )
        VALUES ( 
            @materialsCitationId,
            @treatmentId,
            @collectingDate,
            @collectionCode,
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
            @deleted
        )
        ON CONFLICT (materialsCitationId, treatmentId)
        DO UPDATE SET
            treatmentId=excluded.treatmentId,
            collectingDate=excluded.collectingDate,
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
            deleted=excluded.deleted,
            updated=strftime('%s','now')`
    },
    {
        name: 'materialsCitations_x_collectionCodes',
        create: `CREATE TABLE IF NOT EXISTS ${db.alias}.materialsCitations_x_collectionCodes ( 
            id INTEGER PRIMARY KEY,
            materialsCitationId TEXT,
            collectionCode TEXT,
            created INTEGER DEFAULT (strftime('%s','now')),
            updated INTEGER,
            UNIQUE (collectionCode, materialsCitationId)
        )`,
        insert: `INSERT INTO ${db.alias}.materialsCitations_x_collectionCodes (
            materialsCitationId,
            collectionCode
        )
        VALUES (
            @materialsCitationId,
            @collectionCode
        )
        ON CONFLICT (materialsCitationId, collectionCode)
        DO UPDATE SET
            materialsCitationId=excluded.materialsCitationId,
            collectionCode=excluded.collectionCode,
            updated=strftime('%s','now')`
    },
    {
        name: 'collectionCodes',
        create: `CREATE TABLE IF NOT EXISTS ${db.alias}.collectionCodes ( 
            id INTEGER PRIMARY KEY,
            collectionCode TEXT NOT NULL UNIQUE,
            created INTEGER DEFAULT (strftime('%s','now')),
            updated INTEGER
        )`,
        insert: `INSERT INTO ${db.alias}.collectionCodes (collectionCode)
            VALUES (@collectionCode)
            ON CONFLICT (collectionCode)
            DO UPDATE SET 
                collectionCode=excluded.collectionCode, 
                updated=strftime('%s','now')`
    },
    {
        name: 'vloc_geopoly',
        type: 'virtual',
        create: `CREATE VIRTUAL TABLE IF NOT EXISTS ${db.alias}.vloc_geopoly USING geopoly(
            treatmentId, 
            materialsCitationId
        )`,
        insert: {
            row: {
                select: `SELECT Count(*) AS c FROM ${db.alias}.vloc_geopoly WHERE treatmentId = @treatmentId AND materialsCitationId = @materialsCitationId`,
                update: `UPDATE ${db.alias}.vloc_geopoly SET _shape = '[[' || @longitude || ',' || @latitude || '],[' || @longitude || ',' || @latitude || '],[' || @longitude || ',' || @latitude || '],[' || @longitude || ',' || @latitude || ']]' WHERE treatmentId = @treatmentId AND materialsCitationId = @materialsCitationId`,
                insert: `INSERT INTO ${db.alias}.vloc_geopoly (
                    treatmentId, 
                    materialsCitationId, 
                    _shape
                )
                VALUES (
                    @treatmentId, 
                    @materialsCitationId, 
                    '[[' || @longitude || ',' || @latitude || '],[' || @longitude || ',' || @latitude || '],[' || @longitude || ',' || @latitude || '],[' || @longitude || ',' || @latitude || ']]'
                )`
            },
            bulk: `INSERT INTO ${db.alias}.vloc_geopoly (
                    treatmentId, 
                    materialsCitationId, 
                    _shape
                ) 
                SELECT 
                    m.treatmentId,
                    m.materialsCitationId, 
                    '[[' || m.longitude || ',' || m.latitude || '],[' || m.longitude || ',' || m.latitude || '],[' || m.longitude || ',' || m.latitude || '],[' || m.longitude || ',' || m.latitude || ']]' AS _shape 
                FROM ${db.alias}.materialsCitations m
                WHERE m.latitude != '' AND m.longitude != '' AND (latitude NOT LIKE '%°%' OR longitude NOT LIKE '%°%')`
        }
    },
    {
        name: 'vloc_rtree',
        type: 'virtual',
        create: `CREATE VIRTUAL TABLE IF NOT EXISts ${db.alias}.vloc_rtree USING rtree(
            id,                         -- primary key
            minX, maxX,                 -- X coordinate
            minY, maxY,                 -- Y coordinate
            +materialsCitationId TEXT,
            +treatmentId TEXT
        )`,
        insert: {
            row: {
                select: `SELECT Count(*) AS c FROM ${db.alias}.vloc_rtree WHERE treatmentId = @treatmentId AND materialsCitationId = @materialsCitationId`,
                update: `UPDATE ${db.alias}.vloc_rtree SET minX = @longitude, maxX = @longitude, minY = @latitude, maxY = @latitude WHERE treatmentId = @treatmentId AND materialsCitationId = @materialsCitationId`,
                insert: `INSERT INTO ${db.alias}.vloc_rtree (
                    minX,
                    maxX,
                    minY,
                    maxY,
                    materialsCitationId,
                    treatmentId
                )
                VALUES (
                    @minX,
                    @maxX,
                    @minY,
                    @maxY,
                    @materialsCitationId,
                    @treatmentId
                )`
            },
            bulk: `INSERT INTO ${db.alias}.vloc_rtree (
                    minX,
                    maxX,
                    minY,
                    maxY,
                    materialsCitationId,
                    treatmentId
                )
                SELECT
                    m.longitude,
                    m.longitude,
                    m.latitude,
                    m.latitude,
                    m.materialsCitationId,
                    m.treatmentId
                FROM ${db.alias}.materialsCitations m
                WHERE m.latitude != '' AND m.longitude != ''`
        }
    }
]

db.indexes = [
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_materialsCitationId ON materialsCitations (deleted, materialsCitationId)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_treatmentId         ON materialsCitations (deleted, treatmentId)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_collectingDate      ON materialsCitations (deleted, collectingDate COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_collectionCode      ON materialsCitations (deleted, collectionCode COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_collectorName       ON materialsCitations (deleted, collectorName COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_country             ON materialsCitations (deleted, country COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_collectingRegion    ON materialsCitations (deleted, collectingRegion COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_municipality        ON materialsCitations (deleted, municipality COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_county              ON materialsCitations (deleted, county COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_stateProvince       ON materialsCitations (deleted, stateProvince COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_location            ON materialsCitations (deleted, location COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_locationDeviation   ON materialsCitations (deleted, locationDeviation COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_specimenCountFemale ON materialsCitations (deleted, specimenCountFemale COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_specimenCountMale   ON materialsCitations (deleted, specimenCountMale COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_specimenCount       ON materialsCitations (deleted, specimenCount COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_specimenCode        ON materialsCitations (deleted, specimenCode COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_typeStatus          ON materialsCitations (deleted, typeStatus COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_determinerName      ON materialsCitations (deleted, determinerName COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_collectedFrom       ON materialsCitations (deleted, collectedFrom COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_collectingMethod    ON materialsCitations (deleted, collectingMethod COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_latitude            ON materialsCitations (deleted, latitude)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_longitude           ON materialsCitations (deleted, longitude)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_elevation           ON materialsCitations (deleted, elevation)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_materialsCitations_deleted             ON materialsCitations (deleted)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_collectionCodes_collectionCode         ON collectionCodes (collectionCode)`
]

module.exports = db