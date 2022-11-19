import { resources } from '../../../../../../data-dictionary/resources.js';
const alias = resources.filter(r => r.name === 'materialCitations')[0].alias;

const tables = [
    {
        name: 'materialsCitations',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS materialsCitations ( 
    id INTEGER PRIMARY KEY,
    materialsCitationId TEXT NOT NULL,
    treatmentId TEXT NOT NULL,
    collectingDate TEXT,
    collectionCode TEXT,  -- csv string as in the text
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
    fulltext TEXT,
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
    created INTEGER DEFAULT (strftime('%s','now') * 1000),  

    -- ms since epoch record updated in zenodeo
    updated INTEGER,
    UNIQUE (materialsCitationId, treatmentId)
)`,
    insert: `INSERT INTO ${alias}.materialsCitations (
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
    fulltext,
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
    @fulltext,
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
    fulltext=excluded.fulltext,
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
    materialsCitationId TEXT,
    collectionCode TEXT,
    
    -- ms since epoch record created in zenodeo
    created INTEGER DEFAULT (strftime('%s','now') * 1000),  

    -- ms since epoch record updated in zenodeo
    updated INTEGER,
    UNIQUE (collectionCode, materialsCitationId)
)`,
        insert: `INSERT INTO ${alias}.materialsCitations_x_collectionCodes (
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
        insert: `INSERT INTO ${alias}.collectionCodes (collectionCode)
VALUES (@collectionCode)
ON CONFLICT (collectionCode)
DO UPDATE SET 
    collectionCode=excluded.collectionCode, 
    updated=strftime('%s','now') * 1000`,
        preparedinsert: '',
        data: []
    },
    {
        name: 'ftsMaterialsCitations',
        type: 'virtual',
        create: `CREATE VIRTUAL TABLE IF NOT EXISTS ftsMaterialsCitations USING FTS5(
    fulltext,
    content=''
)`,
        insert: `INSERT INTO ${alias}.ftsMaterialsCitations 
SELECT fulltext 
FROM materialsCitations`,
        preparedinsert: ''
    },
    {
        name: 'geopolyLocations',
        type: 'virtual',
        create: `CREATE VIRTUAL TABLE IF NOT EXISTS geopolyLocations USING geopoly(
    treatmentId, 
    materialsCitationId
)`,
        insert: `INSERT INTO ${alias}.geopolyLocations (
            treatmentId, 
            materialsCitationId, 
            _shape
        ) 
WITH points AS (
    SELECT 
        materialsCitationId, 
        treatmentId, 
        '[' || longitude || ',' || latitude || ']' AS p 
    FROM 
        ${alias}.materialsCitations 
    WHERE 
        validGeo = 1
) SELECT 
    points.treatmentId,
    points.materialsCitationId,
    '[' || points.p || ',' || points.p || ',' || points.p || ',' || points.p || ']' AS _shape
FROM points`,
        preparedinsert: '',
//         maxrowid: 0
    },
    {
        name: 'rtreeLocations',
        type: 'virtual',
        create: `CREATE VIRTUAL TABLE IF NOT EXISTS rtreeLocations USING rtree(
    
    -- primary key
    id,

    -- X coordinate
    minX, maxX,

    -- Y coordinate
    minY, maxY,
    +materialsCitationId TEXT,
    +treatmentId TEXT
)`,
        insert: `INSERT INTO ${alias}.rtreeLocations (
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
FROM ${alias}.materialsCitations 
WHERE validGeo = 1`,
        preparedinsert: '',
//         maxrowid: 0
    }
]

const indexes = [
    {
        name: 'ix_materialsCitations_materialsCitationId',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_materialsCitationId ON materialsCitations (materialsCitationId)`
    },
    {
        name: 'ix_materialsCitations_treatmentId',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_treatmentId ON materialsCitations (treatmentId)`
    },
    {
        name: 'ix_materialsCitations_collectingDate',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_collectingDate ON materialsCitations (collectingDate)`
    },
    {
        name: 'ix_materialsCitations_collectionCode',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_collectionCode ON materialsCitations (collectionCode)`
    },
    {
        name: 'ix_materialsCitations_collectorName',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_collectorName ON materialsCitations (collectorName)`
    },
    {
        name: 'ix_materialsCitations_country',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_country ON materialsCitations (country)`
    },
    {
        name: 'ix_materialsCitations_collectingRegion',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_collectingRegion ON materialsCitations (collectingRegion)`
    },
    {
        name: 'ix_materialsCitations_municipality',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_municipality ON materialsCitations (municipality)`
    },
    {
        name: 'ix_materialsCitations_county',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_county ON materialsCitations (county)`
    },
    {
        name: 'ix_materialsCitations_stateProvince',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_stateProvince ON materialsCitations (stateProvince)`
    },
    {
        name: 'ix_materialsCitations_location',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_location ON materialsCitations (location)`
    },
    {
        name: 'ix_materialsCitations_locationDeviation',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_locationDeviation ON materialsCitations (locationDeviation)`
    },
    {
        name: 'ix_materialsCitations_specimenCountFemale',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_specimenCountFemale ON materialsCitations (specimenCountFemale)`
    },
    {
        name: 'ix_materialsCitations_specimenCountMale',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_specimenCountMale ON materialsCitations (specimenCountMale)`
    },
    {
        name: 'ix_materialsCitations_specimenCount',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_specimenCount ON materialsCitations (specimenCount)`
    },
    {
        name: 'ix_materialsCitations_specimenCode',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_specimenCode ON materialsCitations (specimenCode)`
    },
    {
        name: 'ix_materialsCitations_typeStatus',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_typeStatus ON materialsCitations (typeStatus)`
    },
    {
        name: 'ix_materialsCitations_determinerName',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_determinerName ON materialsCitations (determinerName)`
    },
    {
        name: 'ix_materialsCitations_collectedFrom',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_collectedFrom ON materialsCitations (collectedFrom)`
    },
    {
        name: 'ix_materialsCitations_collectingMethod',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_collectingMethod ON materialsCitations (collectingMethod)`
    },
    {
        name: 'ix_materialsCitations_latitude',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_latitude ON materialsCitations (latitude)`
    },
    {
        name: 'ix_materialsCitations_longitude',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_longitude ON materialsCitations (longitude)`
    },
    {
        name: 'ix_materialsCitations_elevation',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_elevation ON materialsCitations (elevation)`
    },
    {
        name: 'ix_materialsCitations_validGeo',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_validGeo ON materialsCitations (validGeo)`
    },
    {
        name: 'ix_materialsCitations_isOnLand',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_isOnLand ON materialsCitations (isOnLand)`
    },
    {
        name: 'ix_materialsCitations_validGeo_isOnLand',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_validGeo_isOnLand ON materialsCitations (validGeo, isOnLand)`
    },
    {
        name: 'ix_materialsCitations_deleted',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialsCitations_deleted ON materialsCitations (deleted)`
    },
    {
        name: 'ix_collectionCodes_collectionCode',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_collectionCodes_collectionCode ON collectionCodes (collectionCode)`
    }
];

// Triggers to keep the FTS index up to date.
// modeled after the triggers on https://sqlite.org/fts5.html
const getShape = () => {
    const point = `'[' || new.longitude || ',' || new.latitude || ']'`;
    const _shape = `'[' || ${point} || ',' || ${point} || ',' || ${point} || ',' || ${point} || ']'`;
    return _shape;
}

const triggers = [
    {
        name: 'Locations_afterInsert',
        create: `CREATE TRIGGER IF NOT EXISTS ${alias}.Locations_afterInsert 
        AFTER INSERT ON materialsCitations 
        WHEN new.validGeo = 1
        BEGIN
            INSERT INTO geopolyLocations (
                rowid, 
                treatmentId, 
                materialsCitationId, 
                _shape
            ) 
            VALUES (
                new.id, 
                new.treatmentId, 
                new.materialsCitationId, 
                ${getShape()}
            );

            INSERT INTO rtreeLocations (
                minX,
                maxX,
                minY,
                maxY,
                materialsCitationId,
                treatmentId
            )
            VALUES (
                new.longitude,
                new.longitude,
                new.latitude,
                new.latitude,
                new.materialsCitationId,
                new.treatmentId
            );
        END;`
    },
    {
        name: 'Locations_afterUpdate',
        create: `CREATE TRIGGER IF NOT EXISTS ${alias}.Locations_afterUpdate 
        AFTER UPDATE ON materialsCitations 
        WHEN new.validGeo = 1
        BEGIN
            UPDATE geopolyLocations 
            SET _shape = ${getShape()}
            WHERE rowid = old.id;

            UPDATE rtreeLocations 
            SET 
                minX = new.longitude,
                maxX = new.longitude,
                minY = new.latitude,
                maxY = new.latitude
            WHERE rowid = old.id;
        END;`
    },
    {
        name: 'Locations_afterDelete',
        create: `CREATE TRIGGER IF NOT EXISTS ${alias}.Locations_afterDelete 
        AFTER DELETE ON materialsCitations 
        BEGIN
            DELETE FROM geopolyLocations WHERE rowid = old.id;
            DELETE FROM rtreeLocations WHERE rowid = old.id;
        END;`
    },
    {
        name: 'Fulltext_afterInsert',
        create: `CREATE TRIGGER IF NOT EXISTS ${alias}.Fulltext_afterInsert 
        AFTER INSERT ON materialsCitations 
        BEGIN
            INSERT INTO ftsMaterialsCitations(rowid, fulltext) 
            VALUES (new.id, new.fulltext);
        END;`
    },
    {
        name: 'Fulltext_afterDelete',
        create: `CREATE TRIGGER IF NOT EXISTS ${alias}.Fulltext_afterDelete 
        AFTER DELETE ON materialsCitations 
        BEGIN
            INSERT INTO ftsMaterialsCitations(
                ftsMaterialsCitations, 
                rowid, 
                fulltext
            ) 
            VALUES('delete', old.id, old.fulltext);
        END;`
    },
    {
        name: 'Fulltext_afterUpdate',
        create: `CREATE TRIGGER IF NOT EXISTS ${alias}.Fulltext_afterUpdate 
        AFTER UPDATE ON materialsCitations 
        BEGIN
            INSERT INTO ftsMaterialsCitations(
                ftsMaterialsCitations, 
                rowid, 
                fulltext
            ) 
            VALUES('delete', old.id, old.fulltext);

            INSERT INTO ftsMaterialsCitations(rowid, fulltext) 
            VALUES (new.id, new.fulltext);
        END;`
    }
];

export { tables, indexes, triggers }