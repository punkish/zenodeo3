const tables = [
    {
        name: 'materialsCitations',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS materialsCitations ( 
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
            validGeo INT AS (
                CASE 
                    WHEN 
                        typeof(latitude) = 'real' AND 
                        abs(latitude) <= 90 AND 
                        typeof(longitude) = 'real' AND 
                        abs(longitude) <= 180
                    THEN 1
                    ELSE 0
                END
            ) STORED,
            UNIQUE (materialsCitationId, treatmentId)
        )`,
        insert: `INSERT INTO materialsCitations (
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
            updated=strftime('%s','now')`,
        preparedinsert: '',
        data: []
    },
    {
        name: 'materialsCitations_x_collectionCodes',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS materialsCitations_x_collectionCodes ( 
            id INTEGER PRIMARY KEY,
            materialsCitationId TEXT,
            collectionCode TEXT,
            created INTEGER DEFAULT (strftime('%s','now')),
            updated INTEGER,
            UNIQUE (collectionCode, materialsCitationId)
        )`,
        insert: `INSERT INTO materialsCitations_x_collectionCodes (
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
            updated=strftime('%s','now')`,
        preparedinsert: '',
        data: []
    },
    {
        name: 'collectionCodes',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS collectionCodes ( 
            id INTEGER PRIMARY KEY,
            collectionCode TEXT NOT NULL UNIQUE,
            created INTEGER DEFAULT (strftime('%s','now')),
            updated INTEGER
        )`,
        insert: `INSERT INTO collectionCodes (collectionCode)
            VALUES (@collectionCode)
            ON CONFLICT (collectionCode)
            DO UPDATE SET 
                collectionCode=excluded.collectionCode, 
                updated=strftime('%s','now')`,
        preparedinsert: '',
        data: []
    },
    {
        name: 'vloc_geopoly',
        type: 'virtual',
        create: `CREATE VIRTUAL TABLE IF NOT EXISTS vloc_geopoly USING geopoly(
            treatmentId, 
            materialsCitationId
        )`,
        insert: `INSERT INTO vloc_geopoly (treatmentId, materialsCitationId, _shape) 
        WITH points AS (
            SELECT materialsCitationId, treatmentId, '[' || longitude || ',' || latitude || ']' AS p 
            FROM materialsCitations 
            WHERE rowid > @maxrowid AND validGeo = 1
        ) SELECT 
            points.treatmentId,
            points.materialsCitationId,
            '[' || points.p || ',' || points.p || ',' || points.p || ',' || points.p || ']' AS _shape
        FROM points`,
        preparedinsert: '',
        maxrowid: 0
    },
    {
        name: 'vloc_rtree',
        type: 'virtual',
        create: `CREATE VIRTUAL TABLE IF NOT EXISts vloc_rtree USING rtree(
            id,                         -- primary key
            minX, maxX,                 -- X coordinate
            minY, maxY,                 -- Y coordinate
            +materialsCitationId TEXT,
            +treatmentId TEXT
        )`,
        insert: `INSERT INTO vloc_rtree (
            minX,
            maxX,
            minY,
            maxY,
            materialsCitationId,
            treatmentId
        )
        SELECT
            longitude,
            longitude,
            latitude,
            latitude,
            materialsCitationId,
            treatmentId
        FROM materialsCitations 
        WHERE rowid > @maxrowid AND validGeo = 1`,
        preparedinsert: '',
        maxrowid: 0
    }
]

const indexes = [
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_materialsCitationId ON materialsCitations (deleted, materialsCitationId)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_treatmentId         ON materialsCitations (deleted, treatmentId)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectingDate      ON materialsCitations (deleted, collectingDate COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectionCode      ON materialsCitations (deleted, collectionCode COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectorName       ON materialsCitations (deleted, collectorName COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_country             ON materialsCitations (deleted, country COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectingRegion    ON materialsCitations (deleted, collectingRegion COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_municipality        ON materialsCitations (deleted, municipality COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_county              ON materialsCitations (deleted, county COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_stateProvince       ON materialsCitations (deleted, stateProvince COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_location            ON materialsCitations (deleted, location COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_locationDeviation   ON materialsCitations (deleted, locationDeviation COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_specimenCountFemale ON materialsCitations (deleted, specimenCountFemale COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_specimenCountMale   ON materialsCitations (deleted, specimenCountMale COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_specimenCount       ON materialsCitations (deleted, specimenCount COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_specimenCode        ON materialsCitations (deleted, specimenCode COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_typeStatus          ON materialsCitations (deleted, typeStatus COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_determinerName      ON materialsCitations (deleted, determinerName COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectedFrom       ON materialsCitations (deleted, collectedFrom COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectingMethod    ON materialsCitations (deleted, collectingMethod COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_latitude            ON materialsCitations (deleted, latitude)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_longitude           ON materialsCitations (deleted, longitude)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_elevation           ON materialsCitations (deleted, elevation)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_deleted             ON materialsCitations (deleted)`,
    `CREATE INDEX IF NOT EXISTS ix_collectionCodes_collectionCode         ON collectionCodes (collectionCode)`
]

module.exports = { tables, indexes }