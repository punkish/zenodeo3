const dbs = {
    treatments: {
        tables: [

            //********** group: treatments */
            {
                name: 'treatments',
                type: 'normal',
                create: `CREATE TABLE IF NOT EXISTS treatments ( 
                    id INTEGER PRIMARY KEY,
                    treatmentId TEXT NOT NULL UNIQUE,
                    treatmentTitle TEXT,
                    treatmentVersion INTEGER,
                    treatmentDOI TEXT,
                    treatmentLSID TEXT,
                    zenodoDep TEXT,
                    zoobankId TEXT,
                    articleId TEXT,
                    articleTitle TEXT,
                    articleAuthor INTEGER,
                    articleDOI TEXT,
                    publicationDate TEXT,
                    journalTitle TEXT,
                    journalYear TEXT,
                    journalVolume TEXT,
                    journalIssue TEXT,
                    pages TEXT,
                    authorityName TEXT,
                    authorityYear TEXT,
                    kingdom TEXT,
                    phylum TEXT,
                    "order" TEXT,
                    family TEXT,
                    genus TEXT,
                    species TEXT,
                    status TEXT,
                    taxonomicNameLabel TEXT,
                    rank TEXT,
                    fulltext TEXT,
                    --author TEXT,
                    updateTime INTEGER,
                    checkinTime INTEGER,
                    deleted INTEGER DEFAULT 0,
                    created INTEGER DEFAULT (strftime('%s','now')),
                    updated INTEGER
                )`,
                insert: `INSERT INTO treatments (
                    treatmentId,
                    treatmentTitle,
                    treatmentVersion,
                    treatmentDOI,
                    treatmentLSID,
                    zenodoDep,
                    zoobankId,
                    articleId,
                    articleTitle,
                    articleAuthor,
                    articleDOI,
                    publicationDate,
                    journalTitle,
                    journalYear,
                    journalVolume,
                    journalIssue,
                    pages,
                    authorityName,
                    authorityYear,
                    kingdom,
                    phylum,
                    "order",
                    family,
                    genus,
                    species,
                    status,
                    taxonomicNameLabel,
                    rank,
                    fulltext,
                    --author,
                    updateTime,
                    checkinTime,
                    deleted
                )
                VALUES ( 
                    @treatmentId,
                    @treatmentTitle,
                    @treatmentVersion,
                    @treatmentDOI,
                    @treatmentLSID,
                    @zenodoDep,
                    @zoobankId,
                    @articleId,
                    @articleTitle,
                    @articleAuthor,
                    @articleDOI,
                    @publicationDate,
                    @journalTitle,
                    @journalYear,
                    @journalVolume,
                    @journalIssue,
                    @pages,
                    @authorityName,
                    @authorityYear,
                    @kingdom,
                    @phylum,
                    @order,
                    @family,
                    @genus,
                    @species,
                    @status,
                    @taxonomicNameLabel,
                    @rank,
                    @fulltext,
                    --@author,
                    @updateTime,
                    @checkinTime,
                    @deleted
                )
                ON CONFLICT (treatmentId)
                DO UPDATE SET
                    treatmentTitle=excluded.treatmentTitle,
                    treatmentDOI=excluded.treatmentDOI,
                    treatmentLSID=excluded.treatmentLSID,
                    zenodoDep=excluded.zenodoDep,
                    zoobankId=excluded.zoobankId,
                    articleId=excluded.articleId,
                    articleTitle=excluded.articleTitle,
                    articleAuthor=excluded.articleAuthor,
                    articleDOI=excluded.articleDOI,
                    publicationDate=excluded.publicationDate,
                    journalTitle=excluded.journalTitle,
                    journalYear=excluded.journalYear,
                    journalVolume=excluded.journalVolume,
                    journalIssue=excluded.journalIssue,
                    pages=excluded.pages,
                    authorityName=excluded.authorityName,
                    authorityYear=excluded.authorityYear,
                    kingdom=excluded.kingdom,
                    phylum=excluded.phylum,
                    "order"=excluded."order",
                    family=excluded.family,
                    genus=excluded.genus,
                    species=excluded.species,
                    status=excluded.status,
                    taxonomicNameLabel=excluded.taxonomicNameLabel,
                    rank=excluded.rank,
                    fulltext=excluded.fulltext,
                    --author=excluded.author,
                    updateTime=excluded.updateTime,
                    checkinTime=excluded.checkinTime,
                    deleted=excluded.deleted,
                    updated=strftime('%s','now')`,
                preparedinsert: '',
                data: []
            },
            {
                name: 'vtreatments',
                type: 'virtual',
                create: `CREATE VIRTUAL TABLE IF NOT EXISTS vtreatments USING FTS5(
                    treatmentId, 
                    fullText
                )`,
                insert: `INSERT INTO vtreatments 
                        SELECT treatmentId, fulltext 
                        FROM treatments 
                        WHERE rowid > @maxrowid AND deleted = 0`,
                preparedinsert: '',
                maxrowid: 0
            },

            //********** group: treatmentcitations */
            {
                name: 'treatmentCitations',
                type: 'normal',
                create: `CREATE TABLE IF NOT EXISTS treatmentCitations ( 
                    id INTEGER PRIMARY KEY,
                    treatmentCitationId TEXT NOT NULL,
                    treatmentId TEXT NOT NULL,
                    treatmentCitation TEXT,
                    refString TEXT,
                    deleted INTEGER DEFAULT 0,
                    created INTEGER DEFAULT (strftime('%s','now')),
                    updated INTEGER,
                    UNIQUE (treatmentCitationId, treatmentId)
                )`,
                insert: `INSERT INTO treatmentCitations (
                    treatmentCitationId,
                    treatmentId,
                    treatmentCitation,
                    refString,
                    deleted
                )
                VALUES ( 
                    @treatmentCitationId,
                    @treatmentId,
                    @treatmentCitation,
                    @refString,
                    @deleted
                )
                ON CONFLICT (treatmentCitationId, treatmentId)
                DO UPDATE SET
                    treatmentId=excluded.treatmentId,
                    treatmentCitation=excluded.treatmentCitation,
                    refString=excluded.refString,
                    deleted=excluded.deleted,
                    updated=strftime('%s','now')`,
                preparedinsert: '',
                data: []
            },

            //********** group: treatmentauthors */
            {
                name: 'treatmentAuthors',
                type: 'normal',
                create: `CREATE TABLE IF NOT EXISTS treatmentAuthors ( 
                    id INTEGER PRIMARY KEY,
                    treatmentAuthorId TEXT NOT NULL,
                    treatmentId TEXT NOT NULL,
                    treatmentAuthor TEXT,
                    deleted INTEGER DEFAULT 0,
                    created INTEGER DEFAULT (strftime('%s','now')),
                    updated INTEGER,
                    UNIQUE (treatmentAuthorId, treatmentId)
                )`,
                insert: `INSERT INTO treatmentAuthors (
                    treatmentAuthorId,
                    treatmentId,
                    treatmentAuthor,
                    deleted
                )
                VALUES ( 
                    @treatmentAuthorId,
                    @treatmentId,
                    @treatmentAuthor,
                    @deleted
                )
                ON CONFLICT (treatmentAuthorId, treatmentId)
                DO UPDATE SET
                    treatmentId=excluded.treatmentId,
                    treatmentAuthor=excluded.treatmentAuthor,
                    deleted=excluded.deleted,
                    updated=strftime('%s','now')`,
                preparedinsert: '',
                data: []
            },

            //********** group: bibrefcitations */
            {
                name: 'bibRefCitations',
                type: 'normal',
                create: `CREATE TABLE IF NOT EXISTS bibRefCitations ( 
                    id INTEGER PRIMARY KEY,
                    bibRefCitationId TEXT NOT NULL,
                    treatmentId TEXT NOT NULL,
                    refString TEXT,
                    type TEXT,
                    year TEXT,
                    deleted INTEGER DEFAULT 0,
                    created INTEGER DEFAULT (strftime('%s','now')),
                    updated INTEGER,
                    UNIQUE (bibRefCitationId)
                )`,
                insert: `INSERT INTO bibRefCitations (
                        bibRefCitationId,
                        treatmentId,
                        refString,
                        type,
                        year,
                        deleted
                    )
                    VALUES ( 
                        @bibRefCitationId,
                        @treatmentId,
                        @refString,
                        @type,
                        @year,
                        @deleted
                    )
                    ON CONFLICT (bibRefCitationId)
                    DO UPDATE SET
                        treatmentId=excluded.treatmentId,
                        refString=excluded.refString,
                        type=excluded.type,
                        year=excluded.year,
                        deleted=excluded.deleted,
                        updated=strftime('%s','now')`,
                preparedinsert: '',
                data: []
            },
            {
                name: 'vbibrefcitations',
                type: 'virtual',
                create: `CREATE VIRTUAL TABLE IF NOT EXISTS vbibrefcitations USING FTS5(
                    bibRefCitationId, 
                    refString
                )`,
                insert: `INSERT INTO vbibrefcitations 
                    SELECT bibRefCitationId, refString 
                    FROM bibRefCitations 
                    WHERE rowid > @maxrowid AND deleted = 0`,
                preparedinsert: '',
                maxrowid: 0
            },

            //********** group: figurecitations */
            {
                name: 'figureCitations',
                type: 'normal',
                create: `CREATE TABLE IF NOT EXISTS figureCitations ( 
                    id INTEGER PRIMARY KEY,
                    figureNum INTEGER DEFAULT 0,
                    figureCitationId TEXT NOT NULL,
                    treatmentId TEXT NOT NULL,
                    captionText TEXT,
                    httpUri TEXT,
                    thumbnailUri TEXT,
                    deleted INTEGER DEFAULT 0,
                    created INTEGER DEFAULT (strftime('%s','now')),
                    updated INTEGER,
                    UNIQUE (figureCitationId, figureNum)
                )`,
                insert: `INSERT INTO figureCitations (
                    figureNum,
                    figureCitationId,
                    treatmentId,
                    captionText,
                    httpUri,
                    --thumbnailUri,
                    deleted
                )
                VALUES (
                    @figureNum,
                    @figureCitationId,
                    @treatmentId,
                    @captionText,
                    @httpUri,
                    --@thumbnailUri,
                    @deleted
                )
                ON CONFLICT (figureNum, figureCitationId)
                DO UPDATE SET
                    figureNum=excluded.figureNum,
                    figureCitationId=excluded.figureCitationId,
                    treatmentId=excluded.treatmentId,
                    captionText=excluded.captionText,
                    httpUri=excluded.httpUri,
                    --thumbnailUri=excluded.thumbnailUri,
                    deleted=excluded.deleted,
                    updated=strftime('%s','now')`,
                preparedinsert: '',
                data: []
            },
            {
                name: 'vfigurecitations',
                type: 'virtual',
                create: `CREATE VIRTUAL TABLE IF NOT EXISTS vfigurecitations USING FTS5(
                    figureCitationId, 
                    figureNum,
                    treatmentId,
                    captionText
                )`,
                insert: `INSERT INTO vfigurecitations 
                    SELECT figureCitationId, figureNum, treatmentId, captionText 
                    FROM figureCitations 
                    WHERE rowid > @maxrowid AND deleted = 0`,
                preparedinsert: '',
                maxrowid: 0
            },

            //********** group: materialscitations */
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
                insert: `INSERT INTO vloc_geopoly (
                    treatmentId, 
                    materialsCitationId, 
                    _shape
                ) 
                SELECT 
                    m.treatmentId,
                    m.materialsCitationId, 
                    '[[' || m.longitude || ',' || m.latitude || '],[' || m.longitude || ',' || m.latitude || '],[' || m.longitude || ',' || m.latitude || '],[' || m.longitude || ',' || m.latitude || ']]' AS _shape 
                FROM materialsCitations m
                WHERE m.latitude != '' AND m.longitude != '' AND (latitude NOT LIKE '%°%' OR longitude NOT LIKE '%°%')`,
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
                    m.longitude,
                    m.longitude,
                    m.latitude,
                    m.latitude,
                    m.materialsCitationId,
                    m.treatmentId
                FROM materialsCitations m
                WHERE rowid > @maxrowid AND m.latitude != '' AND m.longitude != ''`,
                preparedinsert: '',
                maxrowid: 0
            }
        ],

        indexes: [

            //********** group: treatments */
            `CREATE INDEX IF NOT EXISTS ix_treatments_treatmentId        ON treatments (deleted, treatmentId)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_treatmentTitle     ON treatments (deleted, treatmentTitle COLLATE NOCASE)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_articleTitle       ON treatments (deleted, articleTitle COLLATE NOCASE)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_publicationDate    ON treatments (deleted, publicationDate)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_journalTitle       ON treatments (deleted, journalTitle COLLATE NOCASE)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_journalYear        ON treatments (deleted, journalYear)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_authorityName      ON treatments (deleted, authorityName COLLATE NOCASE)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_taxonomicNameLabel ON treatments (deleted, taxonomicNameLabel COLLATE NOCASE)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_kingdom            ON treatments (deleted, kingdom COLLATE NOCASE)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_phylum             ON treatments (deleted, phylum COLLATE NOCASE)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_order              ON treatments (deleted, "order" COLLATE NOCASE)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_family             ON treatments (deleted, family COLLATE NOCASE)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_genus              ON treatments (deleted, genus COLLATE NOCASE)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_species            ON treatments (deleted, species COLLATE NOCASE)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_status             ON treatments (deleted, status COLLATE NOCASE)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_rank               ON treatments (deleted, rank COLLATE NOCASE)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_k_phylum           ON treatments (deleted, kingdom, phylum)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_k_p_order          ON treatments (deleted, kingdom, phylum, "order")`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_k_p_o_family       ON treatments (deleted, kingdom, phylum, "order", family)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_k_p_o_f_genus      ON treatments (deleted, kingdom, phylum, "order", family, genus)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_k_p_o_f_g_species  ON treatments (deleted, kingdom, phylum, "order", family, genus, species)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_facets             ON treatments (deleted, treatmentId, journalTitle, journalYear, kingdom, phylum, "order", family, genus, species, status, rank)`,
            `CREATE INDEX IF NOT EXISTS ix_treatments_deleted            ON treatments (deleted)`,

            //********** group: treatmentcitations */
            `CREATE INDEX IF NOT EXISTS ix_treatmentCitations_treatmentCitation ON treatmentCitations (deleted, Lower(treatmentCitation)) WHERE deleted = 0`,
            `CREATE INDEX IF NOT EXISTS ix_treatmentCitations_refString         ON treatmentCitations (deleted, Lower(refString)) WHERE deleted = 0`,

            //********** group: treatmentauthors */
            `CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_treatmentAuthorId ON treatmentAuthors (deleted, treatmentAuthorId)`,
            `CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_treatmentId       ON treatmentAuthors (deleted, treatmentId)`,
            `CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_treatmentAuthor   ON treatmentAuthors (deleted, treatmentAuthor COLLATE NOCASE)`,
            `CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_deleted           ON treatmentAuthors (deleted)`,

            //********** group: bibrefcitations */
            `CREATE INDEX IF NOT EXISTS ix_bibRefCitations_bibRefCitationId ON bibRefCitations (deleted, bibRefCitationId)`,
            `CREATE INDEX IF NOT EXISTS ix_bibRefCitations_treatmentId      ON bibRefCitations (deleted, treatmentId)`,
            `CREATE INDEX IF NOT EXISTS ix_bibRefCitations_year             ON bibRefCitations (deleted, year)`,
            `CREATE INDEX IF NOT EXISTS ix_bibRefCitations_deleted          ON bibRefCitations (deleted)`,

            //********** group: figurecitations */
            `CREATE INDEX IF NOT EXISTS ix_figureCitations_treatmentId                            ON figureCitations (deleted, treatmentId)`,
            `CREATE INDEX IF NOT EXISTS ix_figureCitations_figureCitationId_treatmentId_figureNum ON figureCitations (deleted, figureCitationId, treatmentId, figureNum)`,
            
            //********** group: materialscitations */
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
    },
    stats : {
        tables: [
            {
                name: 'etlstats',
                type: 'normal',
                create: `CREATE TABLE IF NOT EXISTS etlstats ( 
                    id INTEGER PRIMARY KEY,
                    started INTEGER,
                    ended INTEGER,
                    process TEXT,
                    result TEXT
                )`,
                insert: `INSERT INTO etlstats (
                        started, 
                        ended, 
                        process,
                        result
                    ) 
                    VALUES (
                        @started, 
                        @ended, 
                        @process,
                        @result
                    )`,
                preparedinsert: ''
            },
            {
                name: 'webqueries',
                type: 'normal',
                create: `CREATE TABLE IF NOT EXISTS webqueries (
                    id INTEGER PRIMARY KEY,
                    -- stringified queryObject
                    q TEXT NOT NULL UNIQUE,
                    -- counter tracking queries
                    count INTEGER DEFAULT 1
                )`,
                insert: '',
                preparedinsert: ''
            },
            {
                name: 'sqlqueries',
                type: 'normal',
                create: `CREATE TABLE IF NOT EXISTS sqlqueries (
                    id INTEGER PRIMARY KEY,
                    -- SQL query
                    sql TEXT NOT NULL UNIQUE
                )`,
                insert: '',
                preparedinsert: ''
            },
            {
                name: 'querystats',
                type: 'normal',
                create: `CREATE TABLE IF NOT EXISTS querystats (
                    id INTEGER PRIMARY KEY,
                    -- Foreign Keys
                    webqueries_id INTEGER,
                    sqlqueries_id INTEGER,
                    -- query performance time in ms
                    timeTaken INTEGER,
                    -- timestamp of query
                    created INTEGER DEFAULT (strftime('%s','now'))
                )`,
                insert: '',
                preparedinsert: ''
            }
        ],
        indexes: []
    },
    // facets: {
    //     tables: [],
    //     indexes: []
    // },
    // gbifcollections: {
    //     tables: [],
    //     indexes: []
    // }
}

module.exports = dbs;