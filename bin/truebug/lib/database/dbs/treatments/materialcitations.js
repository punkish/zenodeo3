const tables = [
    {
        name: 'materialsCitations',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS materialsCitations ( 
    id INTEGER PRIMARY KEY,
    materialsCitationId TEXT NOT NULL COLLATE NOCASE,
    treatmentId TEXT NOT NULL COLLATE NOCASE,
    collectingDate TEXT COLLATE NOCASE,
    collectionCode TEXT COLLATE NOCASE,  -- csv string as in the text
    collectorName TEXT COLLATE NOCASE,
    country TEXT COLLATE NOCASE,
    collectingRegion TEXT COLLATE NOCASE,
    municipality TEXT COLLATE NOCASE,
    county TEXT COLLATE NOCASE,
    stateProvince TEXT COLLATE NOCASE,
    location TEXT COLLATE NOCASE,
    locationDeviation TEXT COLLATE NOCASE,
    specimenCountFemale TEXT COLLATE NOCASE,
    specimenCountMale TEXT COLLATE NOCASE,
    specimenCount TEXT COLLATE NOCASE,
    specimenCode TEXT COLLATE NOCASE,
    typeStatus TEXT COLLATE NOCASE,
    determinerName TEXT COLLATE NOCASE,
    collectedFrom TEXT COLLATE NOCASE,
    collectingMethod TEXT COLLATE NOCASE,
    latitude REAL,
    longitude REAL,
    elevation REAL,
    httpUri TEXT COLLATE NOCASE,
    innerText TEXT COLLATE NOCASE,
    deleted INTEGER DEFAULT 0,
    validGeo INTEGER AS (
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
    isOnLand INTEGER DEFAULT NULL,

    -- ms since epoch record created in zenodeo
    created INTEGER DEFAULT (
        strftime('%s','now') * 1000
    ),  

    -- ms since epoch record updated in zenodeo
    updated INTEGER 
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
    innerText,
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
    @innerText,
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
    innerText=excluded.innerText,
    deleted=excluded.deleted,
    updated=strftime('%s','now') * 1000`,
        preparedinsert: '',
        data: []
    },
    {
        name: 'materialsCitations_x_collectionCodes',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS materialsCitations_x_collectionCodes ( 
    id INTEGER PRIMARY KEY,
    materialsCitationId TEXT COLLATE NOCASE,
    collectionCode TEXT COLLATE NOCASE,
    
    -- ms since epoch record created in zenodeo
    created INTEGER DEFAULT (
        strftime('%s','now') * 1000
    ),  

    -- ms since epoch record updated in zenodeo
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
    updated=strftime('%s','now') * 1000`,
        preparedinsert: '',
        data: []
    },
    {
        name: 'collectionCodes',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS collectionCodes ( 
    id INTEGER PRIMARY KEY,
    collectionCode TEXT NOT NULL UNIQUE,
    created INTEGER DEFAULT (strftime('%s','now') * 1000),
    updated INTEGER
)`,
        insert: `INSERT INTO collectionCodes (collectionCode)
VALUES (@collectionCode)
ON CONFLICT (collectionCode)
DO UPDATE SET 
    collectionCode=excluded.collectionCode, 
    updated=strftime('%s','now') * 1000`,
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
    
    -- primary key
    id,

    -- X coordinate
    minX, maxX,

    -- Y coordinate
    minY, maxY,
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
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_materialsCitationId ON materialsCitations (materialsCitationId)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_treatmentId         ON materialsCitations (treatmentId)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectingDate      ON materialsCitations (collectingDate COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectionCode      ON materialsCitations (collectionCode COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectorName       ON materialsCitations (collectorName COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_country             ON materialsCitations (country COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectingRegion    ON materialsCitations (collectingRegion COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_municipality        ON materialsCitations (municipality COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_county              ON materialsCitations (county COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_stateProvince       ON materialsCitations (stateProvince COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_location            ON materialsCitations (location COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_locationDeviation   ON materialsCitations (locationDeviation COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_specimenCountFemale ON materialsCitations (specimenCountFemale COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_specimenCountMale   ON materialsCitations (specimenCountMale COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_specimenCount       ON materialsCitations (specimenCount COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_specimenCode        ON materialsCitations (specimenCode COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_typeStatus          ON materialsCitations (typeStatus COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_determinerName      ON materialsCitations (determinerName COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectedFrom       ON materialsCitations (collectedFrom COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectingMethod    ON materialsCitations (collectingMethod COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_latitude            ON materialsCitations (latitude)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_longitude           ON materialsCitations (longitude)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_elevation           ON materialsCitations (elevation)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_validGeo            ON materialsCitations (validGeo)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_isOnLand            ON materialsCitations (isOnLand)`,
    `CREATE INDEX IF NOT EXISTS ix_materialsCitations_validGeo_isOnLand   ON materialsCitations (validGeo, isOnLand)`,
    //`CREATE INDEX IF NOT EXISTS ix_materialsCitations_deleted             ON materialsCitations (deleted)`,
    `CREATE INDEX IF NOT EXISTS ix_collectionCodes_collectionCode         ON collectionCodes (collectionCode)`,
]

export { tables, indexes }