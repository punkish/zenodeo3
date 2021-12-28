'use strict'

const {r, g, b, B, $} = require('../utils')
const { logger } = require('../../../lib/utils')
const log = logger('TRUEBUG:DATABASE')

const fs = require('fs')
const config = require('config')
const truebug = JSON.parse(JSON.stringify(config.get('truebug')))
const Database = require('better-sqlite3')
const db = new Database('z3')

const dbs = [
    {
        name: 'treatments',
        tables: [
            {
                name: 'treatments',
                create: `CREATE TABLE IF NOT EXISTS treatments.treatments ( 
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
                insert: `INSERT INTO treatments.treatments (
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
                    updated=strftime('%s','now')`
            },
            {
                name: 'vtreatments',
                create: `CREATE VIRTUAL TABLE IF NOT EXISTS treatments.vtreatments USING FTS5(
                    treatmentId, 
                    fullText
                )`,
                // insert: `INSERT INTO treatments.vtreatments (treatmentId, fulltext) 
                //     VALUES (@treatmentId, @fulltext) 
                //     ON CONFLICT (treatmentId)
                //     DO UPDATE SET
                //         treatmentId=excluded.treatmentId,
                //         fulltext=excluded.fulltext`,
                insert_bulk: `INSERT INTO treatments.vtreatments 
                    SELECT 
                        treatmentId, fulltext 
                    FROM 
                        treatments.treatments 
                    WHERE 
                        deleted = 0`
            }
        ]
    },
    {
        name: 'materialscitations',
        tables: [
            {
                name: 'materialsCitations',
                create: `CREATE TABLE IF NOT EXISTS materialscitations.materialsCitations ( 
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
                insert: `INSERT INTO materialscitations.materialsCitations (
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
                name: 'materialscitations_x_collectioncodes',
                create: `CREATE TABLE IF NOT EXISTS materialscitations.materialsCitations_x_collectionCodes ( 
                    id INTEGER PRIMARY KEY,
                    materialsCitationId TEXT,
                    collectionCode TEXT,
                    created INTEGER DEFAULT (strftime('%s','now')),
                    updated INTEGER,
                    UNIQUE (collectionCode, materialsCitationId)
                )`,
                insert: `INSERT INTO materialscitations.materialsCitations_x_collectionCodes (
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
                create: `CREATE TABLE IF NOT EXISTS materialscitations.collectionCodes ( 
                    id INTEGER PRIMARY KEY,
                    collectionCode TEXT NOT NULL UNIQUE,
                    created INTEGER DEFAULT (strftime('%s','now')),
                    updated INTEGER
                )`,
                insert: `INSERT INTO materialscitations.collectionCodes (collectionCode)
                    VALUES (@collectionCode)
                    ON CONFLICT (collectionCode)
                    DO UPDATE SET 
                        collectionCode=excluded.collectionCode, 
                        updated=strftime('%s','now')`
            },
            {
                name: 'vloc_geopoly',
                create: `CREATE VIRTUAL TABLE IF NOT EXISTS materialscitations.vloc_geopoly USING geopoly(
                    treatmentId, 
                    materialsCitationId
                )`,
                // insert: `INSERT INTO materialscitations.vloc_geopoly (
                //     treatmentId, 
                //     materialsCitationId, 
                //     _shape
                // )
                // VALUES (
                //     @treatmentId, 
                //     @materialsCitationId, 
                //     @_shape
                // )
                // ON CONFLICT (materialsCitationId)
                // DO UPDATE SET 
                //     treatmentId=excluded.treatmentId, 
                //     materialsCitationId=excluded.materialsCitationId,
                //     _shape=excluded._shape`,
                insert_bulk: `INSERT INTO materialscitations.vloc_geopoly (
                    treatmentId, 
                    materialsCitationId, 
                    _shape
                ) 
                SELECT 
                    m.treatmentId,
                    m.materialsCitationId, 
                    '[[' || m.longitude || ',' || m.latitude || '],[' || m.longitude || ',' || m.latitude || '],[' || m.longitude || ',' || m.latitude || '],[' || m.longitude || ',' || m.latitude || ']]' AS _shape 
                FROM 
                    materialscitations.materialsCitations m
                WHERE 
                    m.latitude != '' AND 
                    m.longitude != ''`
            },
            {
                name: 'vloc_rtree',
                create: `CREATE VIRTUAL TABLE IF NOT EXISts materialscitations.vloc_rtree USING rtree(
                    id,                         -- primary key
                    minX, maxX,                 -- X coordinate
                    minY, maxY,                 -- Y coordinate
                    +materialsCitationId TEXT,
                    +treatmentId TEXT
                )`,
                // insert: `INSERT INTO materialscitations.vloc_rtree (
                //     minX,
                //     maxX,
                //     minY,
                //     maxY,
                //     materialsCitationId,
                //     treatmentId
                // )
                // VALUES (
                //     @minX,
                //     @maxX,
                //     @minY,
                //     @maxY,
                //     @materialsCitationId,
                //     @treatmentId
                // )
                // ON CONFLICT (id)
                // DO UPDATE SET 
                //     minX=excluded.minX, 
                //     maxX=excluded.maxX,
                //     minY=excluded.minY,
                //     maxY=excluded.maxY,
                //     materialsCitationId=excluded.materialsCitationId,
                //     treatmentId=excluded.treatmentId`,
                insert_bulk: `INSERT INTO materialscitations.vloc_rtree (
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
                FROM
                    materialscitations.materialsCitations m
                WHERE 
                    m.latitude != '' AND 
                    m.longitude != ''`
            }
        ]
    },
    {
        name: 'treatmentauthors',
        tables: [
            {
                name: 'treatmentAuthors',
                create: `CREATE TABLE IF NOT EXISTS treatmentauthors.treatmentAuthors ( 
                    id INTEGER PRIMARY KEY,
                    treatmentAuthorId TEXT NOT NULL,
                    treatmentId TEXT NOT NULL,
                    treatmentAuthor TEXT,
                    deleted INTEGER DEFAULT 0,
                    created INTEGER DEFAULT (strftime('%s','now')),
                    updated INTEGER,
                    UNIQUE (treatmentAuthorId, treatmentId)
                )`,
                insert: `INSERT INTO treatmentauthors.treatmentAuthors (
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
                    updated=strftime('%s','now')`
            }
        ]
    },
    {
        name: 'treatmentcitations',
        tables: [
            {
                name: 'treatmentCitations',
                create: `CREATE TABLE IF NOT EXISTS treatmentcitations.treatmentCitations ( 
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
                insert: `INSERT INTO treatmentcitations.treatmentCitations (
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
                    updated=strftime('%s','now')`
            }
        ]
    },
    {
        name: 'figurecitations',
        tables: [
            {
                name: 'figureCitations',
                create: `CREATE TABLE IF NOT EXISTS figurecitations.figureCitations ( 
                    id INTEGER PRIMARY KEY,
                    foo TEXT NOT NULL,
                    figureCitationId TEXT NOT NULL,
                    treatmentId TEXT NOT NULL,
                    captionText TEXT,
                    httpUri TEXT,
                    thumbnailUri TEXT,
                    deleted INTEGER DEFAULT 0,
                    created INTEGER DEFAULT (strftime('%s','now')),
                    updated INTEGER,
                    UNIQUE (foo, figureCitationId, treatmentId)
                )`,
                insert: `INSERT INTO figurecitations.figureCitations (
                    foo,
                    figureCitationId,
                    treatmentId,
                    captionText,
                    httpUri,
                    --thumbnailUri,
                    deleted
                )
                VALUES (
                    @foo,
                    @figureCitationId,
                    @treatmentId,
                    @captionText,
                    @httpUri,
                    --@thumbnailUri,
                    @deleted
                )
                ON CONFLICT (foo, figureCitationId, treatmentId)
                DO UPDATE SET
                    foo=excluded.foo,
                    figureCitationId=excluded.figureCitationId,
                    treatmentId=excluded.treatmentId,
                    captionText=excluded.captionText,
                    httpUri=excluded.httpUri,
                    --thumbnailUri=excluded.thumbnailUri,
                    deleted=excluded.deleted,
                    updated=strftime('%s','now')`
            },
            {
                name: 'vfigurecitations',
                create: `CREATE VIRTUAL TABLE IF NOT EXISTS figurecitations.vfigurecitations USING FTS5(
                    figureCitationId, 
                    captionText
                )`,
                // insert: `INSERT INTO figurecitations.vfigurecitations (
                //     figureCitationId, 
                //     captionText
                // )
                // VALUES (
                //     @figureCitationId, 
                //     @captionText
                // )
                // ON CONFLICT (@figureCitationId)
                // DO UPDATE SET
                //     figureCitationId=excluded.figureCitationId,
                //     captionText=exculuded.captionText`,
                insert_bulk: `INSERT INTO figurecitations.vfigurecitations 
                    SELECT 
                        figureCitationId, 
                        captionText 
                    FROM 
                        figurecitations.figureCitations 
                    WHERE 
                        deleted = 0`
            }
        ]
    },
    {
        name: 'bibrefcitations',
        tables: [
            {
                name: 'bibRefCitations',
                create: `CREATE TABLE IF NOT EXISTS bibrefcitations.bibRefCitations ( 
                    id INTEGER PRIMARY KEY,
                    bibRefCitationId TEXT NOT NULL,
                    treatmentId TEXT NOT NULL,
                    refString TEXT,
                    type TEXT,
                    year TEXT,
                    deleted INTEGER DEFAULT 0,
                    created INTEGER DEFAULT (strftime('%s','now')),
                    updated INTEGER,
                    UNIQUE (bibRefCitationId, treatmentId)
                )`,
                insert: `INSERT INTO bibrefcitations.bibRefCitations (
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
                ON CONFLICT (bibRefCitationId, treatmentId)
                DO UPDATE SET
                    treatmentId=excluded.treatmentId,
                    refString=excluded.refString,
                    type=excluded.type,
                    year=excluded.year,
                    deleted=excluded.deleted,
                    updated=strftime('%s','now')`
            },
            {
                name: 'vbibrefcitations',
                create: `CREATE VIRTUAL TABLE IF NOT EXISTS bibrefcitations.vbibrefcitations USING FTS5(
                    bibRefCitationId, 
                    refString
                )`,
                // insert: `INSERT INTO bibrefcitations.vbibrefcitations (
                //     bibRefCitationId, 
                //     refString
                // )
                // VALUES (
                //     @bibRefCitationId, 
                //     @refString
                // )
                // ON CONFLICT (@bibRefCitationId)
                // DO UPDATE SET
                //     bibRefCitationId=excluded.bibRefCitationId,
                //     refString=exculuded.refString`,
                insert_bulk: `INSERT INTO bibrefcitations.vbibrefcitations 
                    SELECT 
                        bibRefCitationId, 
                        refString 
                    FROM 
                        bibrefcitations.bibRefCitations 
                    WHERE 
                        deleted = 0`
            }
        ]
    },
    {
        name: 'gbifcollections',
        tables: []
    },
    {
        name: 'facets',
        tables: []
    },
    {
        name: 'stats',
        tables: [
            {
                name: 'etlstats',
                create: `CREATE TABLE IF NOT EXISTS stats.etlstats ( 
                    id INTEGER PRIMARY KEY,
                    started INTEGER,
                    ended INTEGER,
                    downloaded INTEGER,
                    parsed TEXT,
                    loaded INTEGER
                )`,
                insert: `INSERT INTO stats.etlstats (
                    started, 
                    ended, 
                    downloaded, 
                    parsed, 
                    loaded
                ) 
                VALUES (
                    @started, 
                    @ended, 
                    @downloaded, 
                    @parsed, 
                    @loaded
                )`
            },
            {
                name: 'webqueries',
                create: `CREATE TABLE IF NOT EXISTS stats.webqueries (
                    id INTEGER PRIMARY KEY,
                    -- stringified queryObject
                    qp TEXT NOT NULL UNIQUE,
                    -- counter tracking queries
                    count INTEGER DEFAULT 1
                )`
            },
            {
                name: 'sqlqueries',
                create: `CREATE TABLE IF NOT EXISTS stats.sqlqueries (
                    id INTEGER PRIMARY KEY,
                    -- SQL query
                    sql TEXT NOT NULL UNIQUE
                )`
            },
            {
                name: 'querystats',
                create: `CREATE TABLE IF NOT EXISTS stats.querystats (
                    id INTEGER PRIMARY KEY,
                    -- Foreign Keys
                    webqueries_id INTEGER,
                    sqlqueries_id INTEGER,
                    -- query performance time in ms
                    timeTaken INTEGER,
                    -- timestamp of query
                    created INTEGER DEFAULT (strftime('%s','now'))
                )`
            }
        ]
    }
]

const attachDbs = (truebug, dbs) => {
    log.info('attaching databases')

    dbs.forEach(d => {
        const dbfile = config.get(`db.${d.name}`)
        const cmd = `ATTACH DATABASE '${dbfile}' AS ${d.name.toLowerCase()}`
        log.info(`  - ${$(cmd)}`)
        if (truebug.run === 'real') db.prepare(cmd).run()
    })
}

const createTables = function(truebug, dbs) {
    const s = truebug.switches

    if (s.createTables) {
        log.info('creating tables')

        dbs.forEach(d => {
            const tables = d.tables

            tables.forEach(t => {
                log.info(`  - creating table ${r(d.name)}.${b(t.name)}`)
                const cmd = t.create
                log.info(`  - ${$(cmd)}`)
                if (truebug.run === 'real') db.prepare(cmd).run()
            })
        })
    }
}

const createInsertStatements = function(truebug, dbs) {
    const s = truebug.switches

    if (s.createInsertStatements) {
        log.info('creating INSERT statements')

        dbs.forEach(d => {
            const tables = d.tables

            tables.forEach(t => {
                if (t.insert) {
                    log.info(`  - creating insert statement for ${r(d.name)}.${b(t.name)}`)
                    const cmd = t.insert
                    log.info(`  - ${$(cmd)}`)
                    if (truebug.run === 'real') {
                        truebug.insertStatements.byRow[t.name] = db.prepare(cmd)
                    }
                }    

                if (t.insert_bulk) {
                    const cmd = t.insert_bulk
                    log.info(`  - ${$(cmd)}`)
                    if (truebug.run === 'real') {
                        truebug.insertStatements.bulk[t.name] = db.prepare(cmd)
                    }
                }
            })
        })
    }
}

/***************************************************************************
 * 
 * The data structure submitted to `loadData()` looks as follows
 * 
 * data = [ 
 * 
 *     // treatment 1 and its related data
 *     { 
 *         treatment: { },
 *         treatmentAuthors:    [ {}, {} …  ],
 *         materialsCitations:  [ {}, {} …  ],
 *         collectionCodes:     [ {}, {} …  ],
 *         treatmentCitations:  [ {}, {} …  ],
 *         figureCitations:     [ {}, {} …  ],
 *         bibRefCitations:     [ {}, {} …  ] 
 *     },
 * 
 *     // treatment 2 and its related data
 *     { 
 *         treatment: { },
 *         treatmentAuthors:    [ {}, {} …  ],
 *         materialsCitations:  [ {}, {} …  ],
 *         collectionCodes:     [ {}, {} …  ],
 *         treatmentCitations:  [ {}, {} …  ],
 *         figureCitations:     [ {}, {} …  ],
 *         bibRefCitations:     [ {}, {} …  ] 
 *     } 
 * ]
 *
 * We need to convert this hierarchical array of treatments into 
 * a separate array for each part of the treatment so they can be 
 * inserted into the separate SQL tables. However, we also have 
 * add an extra 'treatmentId' key to all the componoents of a 
 * treatment so they can be linked together in a SQL JOIN query.
 * So the above data structure will be converted to the following
 *
 * d = {
 *     treatments: [ {}, {} … ],
 *     treatmentAuthors: [ {}, {} … ],
 *     materialsCitations: [ {}, {} … ],
 *     collectionCodes: [ {}, {} …  ],
 *     materialsCitations_x_collectionCodes: [
 *          {materialsCitationId, collectionCode}, 
 *          {materialsCitationId, collectionCode} 
 *          … 
 *     ],
 *     treatmentCitations: [ {}, {} … ],
 *     figureCitations: [ {}, {} … ],
 *     bibRefCitations: [ {}, {} … ]
 * }
 * 
 ***************************************************************************/
 const insertBulkData = function(truebug, data) {
    const s = truebug.switches

    if (s.insertBulkData) {
        if (truebug.run === 'real') {
            const d = {
                treatments: [],
                treatmentAuthors: [],
                materialsCitations: [],
                materialsCitations_x_collectionCodes: [],
                collectionCodes: [],
                treatmentCitations: [],
                figureCitations: [],
                bibRefCitations: []
            }

            for (let i = 0, j = data.length; i < j; i++) {
                const t = data[i]

                for (let table in t) {
                    if (table === 'treatment') {
                        d.treatments.push( t[ table ] );
                    }
                    else {
                        d[ table ].push( ...t[ table ] );
                    }
                }
            }

            for (let table in d) {
                if (d[ table ].length) {
                    const insertMany = db.transaction((rows) => {
                        for (const row of rows) {  
                            truebug.preparedInsertStatements[ table ].run(row)
                        }
                    })

                    insertMany(d[ table ])
                }
            }
        }
    }
}

const loadFTS = function(truebug) {
    const s = truebug.switches

    if (s.loadFTS) {
        if (bulk) {
            log.info('loading FTS tables with bulk data')

            dbs.forEach(d => {
                const tables = d.tables
        
                tables.forEach(t => {
                    if (t.name.indexOf(0) === 'v') {
                        log.info(`  - loading ${r(d.name)}.${b(t.name)}`)
                        const cmd = truebug.insertStatements.bulk[t.name]
                        log.info(`  - ${$(cmd)}`)
                        if (truebug.run === 'real') {
                            cmd.run()
                        }
                    }
                })
            })
        }
        else {
            log.info('loading FTS tables with indiv row')

            dbs.forEach(d => {
                const tables = d.tables
        
                tables.forEach(t => {
                    if (t.name.indexOf(0) === 'v') {
                        log.info(`  - loading ${r(d.name)}.${b(t.name)}`)
                        const cmd = truebug.insertStatements.byRow[t.name]
                        log.info(`  - ${$(cmd)}`)
                        if (truebug.run === 'real') {
                            cmd.run()
                        }
                    }
                })
            })
        }
    }
}

const insertData = function(truebug) {
    if (bulk) {
        insertBulkData()
    }
    else {
        insertDataByRow()
    }
}

const doTablesHaveData = () => {
    const c = db.prepare('SELECT Count(*) AS c FROM treatments.treatments').get().c
    return c ? true : false
}

const filesExistInDump = (truebug) => {
    return fs.readdirSync(truebug.dirs.dump)
}

const rearrange = (truebug) => {
    
    if (truebug.run === 'real') {

    }
}

// attachDbs(truebug, dbs)
// createTables(truebug, dbs)
// createInsertStatements(truebug, dbs)
// log.info(doTablesHaveData())

const doit = (truebug) => {
    const src = filesExistInDump(truebug)
    if (src.length) {
        log.info('files exist')
        rearrange(truebug)
    }
    else {
        log.info('nothing to do')
    }
}

doit(truebug)