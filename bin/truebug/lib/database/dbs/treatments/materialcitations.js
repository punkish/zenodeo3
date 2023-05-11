import { resources } from '../../../../../../data-dictionary/resources.js';
const alias = resources.filter(r => r.name === 'materialCitations')[0].alias;

const tables = {
    materialCitations: `CREATE TABLE IF NOT EXISTS materialCitations ( 
    id INTEGER PRIMARY KEY,
    materialCitationId TEXT UNIQUE NOT NULL,
    treatmentId TEXT NOT NULL,
    collectingDate TEXT,

    -- csv string as in the text
    collectionCodeCSVStr TEXT,
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
    FOREIGN KEY(treatmentId) REFERENCES treatments(treatmentId),
    UNIQUE (materialCitationId, treatmentId)
)`,

    materialCitations_x_collectionCodes: `CREATE TABLE IF NOT EXISTS materialCitations_x_collectionCodes ( 
    id INTEGER PRIMARY KEY,
    materialCitationId TEXT,
    collectionCode TEXT,
    
    -- ms since epoch record created in zenodeo
    created INTEGER DEFAULT (strftime('%s','now') * 1000),  

    -- ms since epoch record updated in zenodeo
    updated INTEGER,
    FOREIGN KEY(collectionCode) REFERENCES collectionCodes(collectionCode),
    FOREIGN KEY(materialCitationId) REFERENCES materialCitations(materialCitationId),
    UNIQUE (materialCitationId, collectionCode)
)`,

    collectionCodes: `CREATE TABLE IF NOT EXISTS collectionCodes ( 
    id INTEGER PRIMARY KEY,
    collectionCode TEXT UNIQUE NOT NULL,
    created INTEGER DEFAULT (strftime('%s','now') * 1000),
    updated INTEGER
)`,

    ftsMaterialCitations: `CREATE VIRTUAL TABLE IF NOT EXISTS ftsMaterialCitations USING FTS5(
    fulltext,
    content=''
)`,

    geopolyLocations: `CREATE VIRTUAL TABLE IF NOT EXISTS geopolyLocations USING geopoly(
    treatmentId, 
    materialCitationId
)`,

    rtreeLocations: `CREATE VIRTUAL TABLE IF NOT EXISTS rtreeLocations USING rtree(

    -- primary key
    id,

    -- X coordinate
    minX, 
    maxX,

    -- Y coordinate
    minY, 
    maxY,
    
    +materialCitationId TEXT,
    +treatmentId TEXT
)`
};
    
const inserts = {
        
    insertMaterialCitations: (materialCitation, db) => db.prepare(
    `INSERT INTO ${alias}.materialCitations (
        materialCitationId,
        treatmentId,
        collectingDate,
        collectionCodeCSVStr,
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
        @treatmentId,
        @collectingDate,
        @collectionCodeCSVStr,
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
    )  RETURNING id
    ON CONFLICT (materialCitationId, treatmentId)
    DO UPDATE SET
        treatmentId=excluded.treatmentId,
        collectingDate=excluded.collectingDate,
        collectionCodeCSVStr=excluded.collectionCodeCSVStr,
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
        updated=strftime('%s','now') * 1000`).run(materialCitation),

    insertMaterialCitations_x_collectionCodes: (materialCitation, db) => db.prepare(
        `INSERT INTO ${alias}.materialCitations_x_collectionCodes (
        materialCitationId,
        collectionCode
    )
    VALUES (
        @materialCitationId,
        @collectionCode
    )
    ON CONFLICT (materialCitationId, collectionCode)
    DO UPDATE SET
        materialCitationId=excluded.materialCitationId,
        collectionCode=excluded.collectionCode,
        updated=strftime('%s','now') * 1000`).run(materialCitation),

    insertCollectionCodes: (materialCitation, db) => db.prepare(`INSERT INTO ${alias}.collectionCodes (collectionCode)
    VALUES (@collectionCode)
    ON CONFLICT (collectionCode)
    DO UPDATE SET 
        collectionCode=excluded.collectionCode, 
        updated=strftime('%s','now') * 1000`).run(materialCitation),

    insertIntoFtsMaterialCitations: `INSERT INTO ${alias}.ftsMaterialCitations (
        rowid, fulltext
    )
    VALUES (@id, @fulltext)`,
    
    insertIntoGeopolyLocs: `INSERT INTO ${alias}.geopolyLocations (
            treatmentId, 
            materialCitationId, 
            _shape
        ) 
        WITH points AS (
            SELECT 
                materialCitationId, 
                treatmentId, 
                '[' || longitude || ',' || latitude || ']' AS p 
            FROM 
                ${alias}.materialCitations 
            WHERE 
                validGeo = 1
        ) SELECT 
            points.treatmentId,
            points.materialCitationId,
            '[' || points.p || ',' || points.p || ',' || points.p || ',' || points.p || ']' AS _shape
        FROM points`,

    insertIntoRtreeLocs: `INSERT INTO ${alias}.rtreeLocations (
        minX,
        maxX,
        minY,
        maxY,
        materialCitationId,
        treatmentId
    )
    SELECT
        longitude,
        longitude,
        latitude,
        latitude,
        materialCitationId,
        treatmentId
    FROM ${alias}.materialCitations 
    WHERE validGeo = 1`
};

const indexes = {
    ix_materialCitations_materialCitationId: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_materialCitationId ON materialCitations (materialCitationId)`,
    
    ix_materialCitations_treatmentId: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_treatmentId ON materialCitations (treatmentId)`,
    
    ix_materialCitations_collectingDate: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_collectingDate ON materialCitations (collectingDate)`,
    
    ix_materialCitations_collectionCode: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_collectionCode ON materialCitations (collectionCode)`,
    
    ix_materialCitations_collectorName: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_collectorName ON materialCitations (collectorName)`,
    
    ix_materialCitations_country: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_country ON materialCitations (country)`,
    
    ix_materialCitations_collectingRegion: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_collectingRegion ON materialCitations (collectingRegion)`,
    
    ix_materialCitations_municipality: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_municipality ON materialCitations (municipality)`,
    
    ix_materialCitations_county: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_county ON materialCitations (county)`,
    
    ix_materialCitations_stateProvince: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_stateProvince ON materialCitations (stateProvince)`,
    
    ix_materialCitations_location: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_location ON materialCitations (location)`,
    
    ix_materialCitations_locationDeviation: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_locationDeviation ON materialCitations (locationDeviation)`,
    
    ix_materialCitations_specimenCountFemale: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_specimenCountFemale ON materialCitations (specimenCountFemale)`,
    
    ix_materialCitations_specimenCountMale: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_specimenCountMale ON materialCitations (specimenCountMale)`,
    
    ix_materialCitations_specimenCount: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_specimenCount ON materialCitations (specimenCount)`,
    
    ix_materialCitations_specimenCode: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_specimenCode ON materialCitations (specimenCode)`,
    
    ix_materialCitations_typeStatus: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_typeStatus ON materialCitations (typeStatus)`,
    
    ix_materialCitations_determinerName: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_determinerName ON materialCitations (determinerName)`,
    
    ix_materialCitations_collectedFrom: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_collectedFrom ON materialCitations (collectedFrom)`,
    
    ix_materialCitations_collectingMethod: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_collectingMethod ON materialCitations (collectingMethod)`,
    
    ix_materialCitations_latitude: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_latitude ON materialCitations (latitude)`,
    
    ix_materialCitations_longitude: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_longitude ON materialCitations (longitude)`,
    
    ix_materialCitations_elevation: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_elevation ON materialCitations (elevation)`,
    
    ix_materialCitations_validGeo: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_validGeo ON materialCitations (validGeo)`,
    
    ix_materialCitations_isOnLand: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_isOnLand ON materialCitations (isOnLand)`,
    
    ix_materialCitations_validGeo_isOnLand: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_validGeo_isOnLand ON materialCitations (validGeo, isOnLand)`,
    
    ix_materialCitations_deleted: `CREATE INDEX IF NOT EXISTS ${alias}.ix_materialCitations_deleted ON materialCitations (deleted)`,
    
    ix_collectionCodes_collectionCode: `CREATE INDEX IF NOT EXISTS ${alias}.ix_collectionCodes_collectionCode ON collectionCodes (collectionCode)`
};

// Triggers to keep the FTS index up to date.
// modeled after the triggers on https://sqlite.org/fts5.html
const getShape = () => {
    const point = `'[' || new.longitude || ',' || new.latitude || ']'`;
    const _shape = `'[' || ${point} || ',' || ${point} || ',' || ${point} || ',' || ${point} || ']'`;
    return _shape;
}

const triggers = {
    materialCitations_locations_afterInsert: `CREATE TRIGGER IF NOT EXISTS ${alias}.materialCitations_locations_afterInsert 
        AFTER INSERT ON materialCitations 
        WHEN new.validGeo = 1
        BEGIN
            INSERT INTO geopolyLocations (
                rowid, 
                treatmentId, 
                materialCitationId, 
                _shape
            ) 
            VALUES (
                new.id, 
                new.treatmentId, 
                new.materialCitationId, 
                ${getShape()}
            );

            INSERT INTO rtreeLocations (
                minX,
                maxX,
                minY,
                maxY,
                materialCitationId,
                treatmentId
            )
            VALUES (
                new.longitude,
                new.longitude,
                new.latitude,
                new.latitude,
                new.materialCitationId,
                new.treatmentId
            );
        END;`,
    
    materialCitations_locations_afterUpdate: `CREATE TRIGGER IF NOT EXISTS ${alias}.materialCitations_locations_afterUpdate 
        AFTER UPDATE ON materialCitations 
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
        END;`,
    
    materialCitations_afterDelete: `CREATE TRIGGER IF NOT EXISTS ${alias}.materialCitations_afterDelete 
        AFTER DELETE ON materialCitations 
        BEGIN
            -- remove entries from the geopoly and rtree tables
            DELETE FROM geopolyLocations WHERE rowid = old.id;
            DELETE FROM rtreeLocations WHERE rowid = old.id;

            -- effectively remove entries from the fts table
            INSERT INTO ftsMaterialCitations(
                ftsMaterialCitations, 
                rowid, 
                fulltext
            ) 
            VALUES('delete', old.id, old.fulltext);
        END;`,
    
    materialCitations_afterInsert: `CREATE TRIGGER IF NOT EXISTS ${alias}.materialCitations_afterInsert 
        AFTER INSERT ON materialCitations 
        BEGIN
            INSERT INTO ftsMaterialCitations(rowid, fulltext) 
            VALUES (new.id, new.fulltext);
        END;`,

    materialCitations_afterUpdate: `CREATE TRIGGER IF NOT EXISTS ${alias}.materialCitations_afterUpdate 
        AFTER UPDATE ON materialCitations 
        BEGIN

            -- remove old entry
            INSERT INTO ftsMaterialCitations(
                ftsMaterialCitations, 
                rowid, 
                fulltext
            ) 
            VALUES('delete', old.id, old.fulltext);

            -- insert new entry in fulltext index
            INSERT INTO ftsMaterialCitations(rowid, fulltext) 
            VALUES (new.id, new.fulltext);
        END;`
};

export { tables, indexes, triggers, inserts }