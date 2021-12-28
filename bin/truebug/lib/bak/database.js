'use strict'

const {r, g, b, B, $} = require('../utils')

const { logger } = require('../../../lib/utils')
const log = logger('TRUEBUG:DATABASE')

const Database = require('better-sqlite3')
const config = require('config')
const db = new Database('z3')
const dbs = {
    treatments         : config.get('db.treatments'),
    materialsCitations : config.get('db.materialsCitations'),
    treatmentAuthors   : config.get('db.treatmentAuthors'),
    treatmentCitations : config.get('db.treatmentCitations'),
    figureCitations    : config.get('db.figureCitations'),
    bibRefCitations    : config.get('db.bibRefCitations'),
    gbifcollections    : config.get('db.gbifcollections'),
    facets             : config.get('db.facets'),
    stats              : config.get('db.stats')
}

for (let d in dbs) {
    db.prepare(`ATTACH DATABASE '${dbs[d]}' AS z3_${d}`).run()
}

const selCountOfTreatments = () => db.prepare('SELECT Count(*) AS c FROM z3_treatments.treatments').get().c
const getDateOfLastEtl = () => db.prepare("SELECT date(started/1000, 'unixepoch') AS d FROM z3_stats.etlstats WHERE id = (SELECT Max(id) FROM z3_stats.etlstats)").get().d

const createTables = function(truebug) {
    const s = truebug.switches

    if (s.createTables) {
        log.info('creating tables')

        // seven databases
        const dbs = {
            treatments: {
                treatments: `CREATE TABLE IF NOT EXISTS z3_treatments.treatments ( 
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

                vtreatments: 'CREATE VIRTUAL TABLE IF NOT EXISTS z3_treatments.vtreatments USING FTS5(treatmentId, fullText)',
            },

            materialsCitations: {
                materialsCitations: `CREATE TABLE IF NOT EXISTS z3_materialsCitations.materialsCitations ( 
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
                
                materialsCitations_x_collectionCodes: `CREATE TABLE IF NOT EXISTS z3_materialsCitations.materialsCitations_x_collectionCodes ( 
    id INTEGER PRIMARY KEY,
    materialsCitationId TEXT,
    collectionCode TEXT,
    created INTEGER DEFAULT (strftime('%s','now')),
    updated INTEGER,
    UNIQUE (collectionCode, materialsCitationId)
)`,
                
                collectionCodes: `CREATE TABLE IF NOT EXISTS z3_materialsCitations.collectionCodes ( 
    id INTEGER PRIMARY KEY,
    collectionCode TEXT NOT NULL UNIQUE,
    created INTEGER DEFAULT (strftime('%s','now')),
    updated INTEGER
)`,

                vloc_geopoly: 'CREATE VIRTUAL TABLE IF NOT EXISTS z3_materialsCitations.vloc_geopoly USING geopoly(treatmentId, materialsCitationId)',
                vloc_rtree: `CREATE VIRTUAL TABLE z3_materialsCitations.vloc_rtree USING rtree(
                    id,                         -- primary key
                    minX, maxX,                 -- X coordinate
                    minY, maxY,                 -- Y coordinate
                    +materialsCitationId TEXT,
                    +treatmentId TEXT
                )`
            },

            treatmentAuthors: {
                treatmentAuthors: `CREATE TABLE IF NOT EXISTS z3_treatmentAuthors.treatmentAuthors ( 
    id INTEGER PRIMARY KEY,
    treatmentAuthorId TEXT NOT NULL,
    treatmentId TEXT NOT NULL,
    treatmentAuthor TEXT,
    deleted INTEGER DEFAULT 0,
    created INTEGER DEFAULT (strftime('%s','now')),
    updated INTEGER,
    UNIQUE (treatmentAuthorId, treatmentId)
)`,
            },

            treatmentCitations: {
                treatmentCitations: `CREATE TABLE IF NOT EXISTS z3_treatmentCitations.treatmentCitations ( 
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
            },

            figureCitations: {
                figureCitations: `CREATE TABLE IF NOT EXISTS z3_figureCitations.figureCitations ( 
    id INTEGER PRIMARY KEY,
    figureCitationId TEXT NOT NULL,
    treatmentId TEXT NOT NULL,
    captionText TEXT,
    httpUri TEXT,
    thumbnailUri TEXT,
    deleted INTEGER DEFAULT 0,
    created INTEGER DEFAULT (strftime('%s','now')),
    updated INTEGER,
    UNIQUE (id, figureCitationId, treatmentId)
)`,

                vfigurecitations: 'CREATE VIRTUAL TABLE IF NOT EXISTS z3_figureCitations.vfigurecitations USING FTS5(figureCitationId, captionText)',
            },

            bibRefCitations: {
                bibRefCitations: `CREATE TABLE IF NOT EXISTS z3_bibRefCitations.bibRefCitations ( 
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

                vbibrefcitations: 'CREATE VIRTUAL TABLE IF NOT EXISTS z3_bibRefCitations.vbibrefcitations USING FTS5(bibRefCitationId, refString)',
            },

            stats: {

                etlstats: `CREATE TABLE IF NOT EXISTS z3_stats.etlstats ( 
    id INTEGER PRIMARY KEY,
    started INTEGER,
    ended INTEGER,
    downloaded INTEGER,
    parsed TEXT,
    loaded INTEGER
)`,

                webqueries: `CREATE TABLE IF NOT EXISTS z3_stats.webqueries (
    id INTEGER PRIMARY KEY,
    -- stringified queryObject
    qp TEXT NOT NULL UNIQUE,
    -- counter tracking queries
    count INTEGER DEFAULT 1
)`,

                sqlqueries: `CREATE TABLE IF NOT EXISTS z3_stats.sqlqueries (
    id INTEGER PRIMARY KEY,
    -- SQL query
    sql TEXT NOT NULL UNIQUE
)`,

                querystats: `CREATE TABLE IF NOT EXISTS z3_stats.querystats (
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
        }
        
        for (let d in dbs) {
            const tables = dbs[d]

            for (let t in tables) {
                log.info(`  - creating table ${r(d)}.${b(t)}`)
                if (truebug.run === 'real') db.prepare(tables[t]).run()
            }
        }
    }
}

const insertStatements = {
    treatments: {
        treatments: `INSERT INTO treatments (
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
                --@created,
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
                --created=excluded.created,
                deleted=excluded.deleted,
                updated=strftime('%s','now')`,

        treatmentAuthors: `INSERT INTO treatmentAuthors (
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

        materialsCitations: `INSERT INTO materialsCitations (
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

        collectionCodes: `INSERT INTO collectionCodes (collectionCode)
            VALUES (@collectionCode)
            ON CONFLICT (collectionCode)
            DO UPDATE SET collectionCode=excluded.collectionCode, updated=strftime('%s','now')`,

        materialsCitations_x_collectionCodes: `INSERT INTO materialsCitations_x_collectionCodes (
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

        treatmentCitations: `INSERT INTO treatmentCitations (
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

        figureCitations: `INSERT INTO figureCitations (
                figureCitationId,
                treatmentId,
                captionText,
                httpUri,
                --thumbnailUri,
                deleted
            )
            VALUES ( 
                @figureCitationId,
                @treatmentId,
                @captionText,
                @httpUri,
                --@thumbnailUri,
                @deleted
            )
            ON CONFLICT (figureCitationId, treatmentId)
            DO UPDATE SET
                treatmentId=excluded.treatmentId,
                captionText=excluded.captionText,
                httpUri=excluded.httpUri,
                --thumbnailUri=excluded.thumbnailUri,
                deleted=excluded.deleted,
                updated=strftime('%s','now')`,

        bibRefCitations: `INSERT INTO bibRefCitations (
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

    // incrementalFts: {
    //     vtreatments: 'INSERT INTO vtreatments (treatmentId, fulltext) VALUES (@treatmentId, @fulltext)'
    // },

    etlStats: {
        etl: 'INSERT INTO etl (started, ended, downloaded, parsed, loaded) VALUES (@started, @ended, @downloaded, @parsed, @loaded)'
    }
}



const createInsertStatements = function(truebug) {
    const dbs = {
        treatments: {
            treatments: `INSERT INTO treatments (
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
                    --@created,
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
                    --created=excluded.created,
                    deleted=excluded.deleted,
                    updated=strftime('%s','now')`,
            vtreatments_0: 'INSERT INTO vtreatments SELECT treatmentId, fulltext FROM treatments WHERE deleted = 0',
            vtreatments_1: `INSERT INTO vtreatments (treatmentId, fulltext) 
                VALUES (@treatmentId, @fulltext) 
                ON CONFLICT (treatmentId)
                DO UPDATE SET
                    treatmentId=excluded.treatmentId,
                    fulltext=exculuded.fulltext`
        },

        treatmentAuthors: {
            treatmentAuthors: `INSERT INTO treatmentAuthors (
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
        },

        materialsCitations: {
            materialsCitations: `INSERT INTO materialsCitations (
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

            collectionCodes: `INSERT INTO collectionCodes (collectionCode)
                VALUES (@collectionCode)
                ON CONFLICT (collectionCode)
                DO UPDATE SET 
                    collectionCode=excluded.collectionCode, 
                    updated=strftime('%s','now')`,

            materialsCitations_x_collectionCodes: `INSERT INTO materialsCitations_x_collectionCodes (
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

            vloc_geopoly: `INSERT INTO vloc_geopoly (
                    treatmentId, 
                    materialsCitationId, 
                    _shape
                ) 
                SELECT 
                    treatments.treatmentId, 
                    materialsCitationId, 
                    '[[' || longitude || ',' || latitude || '],[' || longitude || ',' || latitude || '],[' || longitude || ',' || latitude || '],[' || longitude || ',' || latitude || ']]' AS _shape 
                FROM 
                    treatments JOIN 
                    materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId 
                WHERE latitude != '' AND longitude != ''`
        },

        treatmentCitations: {
            treatmentCitations: `INSERT INTO treatmentCitations (
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
        },

        figureCitations: {
            figureCitations: `INSERT INTO figureCitations (
                    figureCitationId,
                    treatmentId,
                    captionText,
                    httpUri,
                    --thumbnailUri,
                    deleted
                )
                VALUES ( 
                    @figureCitationId,
                    @treatmentId,
                    @captionText,
                    @httpUri,
                    --@thumbnailUri,
                    @deleted
                )
                ON CONFLICT (figureCitationId, treatmentId)
                DO UPDATE SET
                    treatmentId=excluded.treatmentId,
                    captionText=excluded.captionText,
                    httpUri=excluded.httpUri,
                    --thumbnailUri=excluded.thumbnailUri,
                    deleted=excluded.deleted,
                    updated=strftime('%s','now')`,
            vfigurecitations_0: 'INSERT INTO vfigurecitations SELECT figureCitationId, captionText FROM figureCitations WHERE deleted = 0',
            vfigurecitations_1: `INSERT INTO vfigurecitations (
                    figureCitationId, 
                    captionText
                )
                VALUES (
                    @figureCitationId, 
                    @captionText
                )
                ON CONFLICT (@figureCitationId)
                DO UPDATE SET
                    figureCitationId=excluded.figureCitationId,
                    captionText=exculuded.captionText`,
        },
        bibRefCitations: {
            bibRefCitations: `INSERT INTO bibRefCitations (
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
                updated=strftime('%s','now')`,
            vbibrefcitations_0: 'INSERT INTO vbibrefcitations SELECT bibRefCitationId, refString FROM bibRefCitations WHERE deleted = 0',
            vbibrefcitations_1: `INSERT INTO vbibrefcitations (
                    bibRefCitationId, 
                    refString
                )
                VALUES (
                    @bibRefCitationId, 
                    @refString
                )
                ON CONFLICT (@bibRefCitationId)
                DO UPDATE SET
                    bibRefCitationId=excluded.bibRefCitationId,
                    refString=exculuded.refString`,
        },

        // incrementalFts: {
        //     vtreatments: 'INSERT INTO vtreatments (treatmentId, fulltext) VALUES (@treatmentId, @fulltext)'
        // },

        etlStats: {
            etl: 'INSERT INTO etl (started, ended, downloaded, parsed, loaded) VALUES (@started, @ended, @downloaded, @parsed, @loaded)'
        }
    }

    log.info('creating insert statements')

    for (let db in rawInsertStatements) {
        const stmts = rawInsertStatements[db]

        for (let s in stmts) {
            log.info(`  - creating insert statement ${b(s)}`)
            if (truebug.run === 'real') {
                truebug.preparedInsertStatements[ s ] = DB[db].prepare(stmts[s])
            }
        }
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
const insertData = function(truebug, data) {
    const s = truebug.switches

    if (s.insertData) {
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
                    const insertMany = DB.treatments.transaction((rows) => {
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

    const insertStatements = {
        vtreatments: 'INSERT INTO vtreatments SELECT treatmentId, fulltext FROM treatments WHERE deleted = 0',
        vfigurecitations: 'INSERT INTO vfigurecitations SELECT figureCitationId, captionText FROM figureCitations WHERE deleted = 0',
        vbibrefcitations: 'INSERT INTO vbibrefcitations SELECT bibRefCitationId, refString FROM bibRefCitations WHERE deleted = 0',
        vlocations: "INSERT INTO vlocations(treatmentId, materialsCitationId, _shape) SELECT treatments.treatmentId, materialsCitationId, '[[' || longitude || ',' || latitude || '],[' || longitude || ',' || latitude || '],[' || longitude || ',' || latitude || '],[' || longitude || ',' || latitude || ']]' AS _shape FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE latitude != '' AND longitude != ''"
    }

    if (s.loadFTS) {
        log.info(`loading FTS tables`)

        // truebug.fts.forEach(f => {
        //     log.info(`  - loading ${b(f)}`)

        //     if (truebug.run === 'real') {
        //         try {
        //             truebug.preparedInsertStatements[f].run()
        //         }
        //         catch(error) {
        //             log.error(error)
        //         }
        //     }
        // })

        for (let [table, sql] of Object.entries(insertStatements)) {
            log.info(`  - loading ${b(table)}`)

            if (truebug.run === 'real') {
                try {
                    DB.treatments.prepare(sql).run()
                }
                catch(error) {
                    log.error(error)
                }
            }
        }
    }
}

const buildIndexes = function(truebug) {
    const s = truebug.switches

    if (s.buildIndexes) {
        log.info('indexing tables')

        const indexes = {
            ix_treatmentCitations_treatmentCitation  : 'CREATE INDEX IF NOT EXISTS ix_treatmentCitations_treatmentCitation   ON treatmentCitations (deleted, Lower(treatmentCitation)) WHERE deleted = 0',
            ix_treatmentCitations_refString          : 'CREATE INDEX IF NOT EXISTS ix_treatmentCitations_refString           ON treatmentCitations (deleted, Lower(refString)) WHERE deleted = 0',
            ix_bibRefCitations_year                  : 'CREATE INDEX IF NOT EXISTS ix_bibRefCitations_year                   ON bibRefCitations    (deleted, year) WHERE deleted = 0',
            ix_treatments_treatmentId                : 'CREATE INDEX IF NOT EXISTS ix_treatments_treatmentId                 ON treatments         (deleted, treatmentId)',
            ix_treatments_treatmentTitle             : 'CREATE INDEX IF NOT EXISTS ix_treatments_treatmentTitle              ON treatments         (deleted, treatmentTitle COLLATE NOCASE)',
            ix_treatments_articleTitle               : 'CREATE INDEX IF NOT EXISTS ix_treatments_articleTitle                ON treatments         (deleted, articleTitle COLLATE NOCASE)',
            ix_treatments_publicationDate            : 'CREATE INDEX IF NOT EXISTS ix_treatments_publicationDate             ON treatments         (deleted, publicationDate)',
            ix_treatments_journalTitle               : 'CREATE INDEX IF NOT EXISTS ix_treatments_journalTitle                ON treatments         (deleted, journalTitle COLLATE NOCASE)',
            ix_treatments_journalYear                : 'CREATE INDEX IF NOT EXISTS ix_treatments_journalYear                 ON treatments         (deleted, journalYear)',
            ix_treatments_authorityName              : 'CREATE INDEX IF NOT EXISTS ix_treatments_authorityName               ON treatments         (deleted, authorityName COLLATE NOCASE)',
            ix_treatments_taxonomicNameLabel         : 'CREATE INDEX IF NOT EXISTS ix_treatments_taxonomicNameLabel          ON treatments         (deleted, taxonomicNameLabel COLLATE NOCASE)',
            ix_treatments_kingdom                    : 'CREATE INDEX IF NOT EXISTS ix_treatments_kingdom                     ON treatments         (deleted, kingdom COLLATE NOCASE)',
            ix_treatments_phylum                     : 'CREATE INDEX IF NOT EXISTS ix_treatments_phylum                      ON treatments         (deleted, phylum COLLATE NOCASE)',
            ix_treatments_order                      : 'CREATE INDEX IF NOT EXISTS ix_treatments_order                       ON treatments         (deleted, "order" COLLATE NOCASE)',
            ix_treatments_family                     : 'CREATE INDEX IF NOT EXISTS ix_treatments_family                      ON treatments         (deleted, family COLLATE NOCASE)',
            ix_treatments_genus                      : 'CREATE INDEX IF NOT EXISTS ix_treatments_genus                       ON treatments         (deleted, genus COLLATE NOCASE)',
            ix_treatments_species                    : 'CREATE INDEX IF NOT EXISTS ix_treatments_species                     ON treatments         (deleted, species COLLATE NOCASE)',
            ix_treatments_status                     : 'CREATE INDEX IF NOT EXISTS ix_treatments_status                      ON treatments         (deleted, status COLLATE NOCASE)',
            ix_treatments_rank                       : 'CREATE INDEX IF NOT EXISTS ix_treatments_rank                        ON treatments         (deleted, rank COLLATE NOCASE)',
            ix_treatments_k_phylum                   : 'CREATE INDEX IF NOT EXISTS ix_treatments_k_phylum                    ON treatments         (deleted, kingdom, phylum)',
            ix_treatments_k_p_order                  : 'CREATE INDEX IF NOT EXISTS ix_treatments_k_p_order                   ON treatments         (deleted, kingdom, phylum, "order")',
            ix_treatments_k_p_o_family               : 'CREATE INDEX IF NOT EXISTS ix_treatments_k_p_o_family                ON treatments         (deleted, kingdom, phylum, "order", family)',
            ix_treatments_k_p_o_f_genus              : 'CREATE INDEX IF NOT EXISTS ix_treatments_k_p_o_f_genus               ON treatments         (deleted, kingdom, phylum, "order", family, genus)',
            ix_treatments_k_p_o_f_g_species          : 'CREATE INDEX IF NOT EXISTS ix_treatments_k_p_o_f_g_species           ON treatments         (deleted, kingdom, phylum, "order", family, genus, species)',
            ix_treatments_facets                     : 'CREATE INDEX IF NOT EXISTS ix_treatments_facets                      ON treatments         (deleted, treatmentId, journalTitle, journalYear, kingdom, phylum, "order", family, genus, species, status, rank)',
            ix_treatments_deleted                    : 'CREATE INDEX IF NOT EXISTS ix_treatments_deleted                     ON treatments         (deleted)',
            ix_treatmentAuthors_treatmentAuthorId    : 'CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_treatmentAuthorId     ON treatmentAuthors   (deleted, treatmentAuthorId)',
            ix_treatmentAuthors_treatmentId          : 'CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_treatmentId           ON treatmentAuthors   (deleted, treatmentId)',
            ix_treatmentAuthors_treatmentAuthor      : 'CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_treatmentAuthor       ON treatmentAuthors   (deleted, treatmentAuthor COLLATE NOCASE)',
            ix_treatmentAuthors_deleted              : 'CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_deleted               ON treatmentAuthors   (deleted)',
            ix_materialsCitations_materialsCitationId: 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_materialsCitationId ON materialsCitations (deleted, materialsCitationId)',
            ix_materialsCitations_treatmentId        : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_treatmentId         ON materialsCitations (deleted, treatmentId)',
            ix_materialsCitations_collectingDate     : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectingDate      ON materialsCitations (deleted, collectingDate COLLATE NOCASE)',
            ix_materialsCitations_collectionCode     : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectionCode      ON materialsCitations (deleted, collectionCode COLLATE NOCASE)',
            ix_materialsCitations_collectorName      : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectorName       ON materialsCitations (deleted, collectorName COLLATE NOCASE)',
            ix_materialsCitations_country            : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_country             ON materialsCitations (deleted, country COLLATE NOCASE)',
            ix_materialsCitations_collectingRegion   : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectingRegion    ON materialsCitations (deleted, collectingRegion COLLATE NOCASE)',
            ix_materialsCitations_municipality       : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_municipality        ON materialsCitations (deleted, municipality COLLATE NOCASE)',
            ix_materialsCitations_county             : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_county              ON materialsCitations (deleted, county COLLATE NOCASE)',
            ix_materialsCitations_stateProvince      : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_stateProvince       ON materialsCitations (deleted, stateProvince COLLATE NOCASE)',
            ix_materialsCitations_location           : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_location            ON materialsCitations (deleted, location COLLATE NOCASE)',
            ix_materialsCitations_locationDeviation  : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_locationDeviation   ON materialsCitations (deleted, locationDeviation COLLATE NOCASE)',
            ix_materialsCitations_specimenCountFemale: 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_specimenCountFemale ON materialsCitations (deleted, specimenCountFemale COLLATE NOCASE)',
            ix_materialsCitations_specimenCountMale  : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_specimenCountMale   ON materialsCitations (deleted, specimenCountMale COLLATE NOCASE)',
            ix_materialsCitations_specimenCount      : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_specimenCount       ON materialsCitations (deleted, specimenCount COLLATE NOCASE)',
            ix_materialsCitations_specimenCode       : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_specimenCode        ON materialsCitations (deleted, specimenCode COLLATE NOCASE)',
            ix_materialsCitations_typeStatus         : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_typeStatus          ON materialsCitations (deleted, typeStatus COLLATE NOCASE)',
            ix_materialsCitations_determinerName     : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_determinerName      ON materialsCitations (deleted, determinerName COLLATE NOCASE)',
            ix_materialsCitations_collectedFrom      : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectedFrom       ON materialsCitations (deleted, collectedFrom COLLATE NOCASE)',
            ix_materialsCitations_collectingMethod   : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectingMethod    ON materialsCitations (deleted, collectingMethod COLLATE NOCASE)',
            ix_materialsCitations_latitude           : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_latitude            ON materialsCitations (deleted, latitude)',
            ix_materialsCitations_longitude          : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_longitude           ON materialsCitations (deleted, longitude)',
            ix_materialsCitations_elevation          : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_elevation           ON materialsCitations (deleted, elevation)',
            ix_materialsCitations_deleted            : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_deleted             ON materialsCitations (deleted)',
            ix_treatmentCitations_treatmentCitationId: 'CREATE INDEX IF NOT EXISTS ix_treatmentCitations_treatmentCitationId ON treatmentCitations (deleted, treatmentCitationId)',
            ix_treatmentCitations_treatmentId        : 'CREATE INDEX IF NOT EXISTS ix_treatmentCitations_treatmentId         ON treatmentCitations (deleted, treatmentId)',
            ix_treatmentCitations_deleted            : 'CREATE INDEX IF NOT EXISTS ix_treatmentCitations_deleted             ON treatmentCitations (deleted)',
            ix_figureCitations_treatmentId           : 'CREATE INDEX IF NOT EXISTS ix_figureCitations_treatmentId            ON figureCitations    (deleted, treatmentId)',
            ix_figureCitations_figureCitationId      : 'CREATE INDEX IF NOT EXISTS ix_figureCitations_figureCitationId       ON figureCitations    (deleted, figureCitationId, treatmentId)',
            ix_bibRefCitations_bibRefCitationId      : 'CREATE INDEX IF NOT EXISTS ix_bibRefCitations_bibRefCitationId       ON bibRefCitations    (deleted, bibRefCitationId)',
            ix_bibRefCitations_treatmentId           : 'CREATE INDEX IF NOT EXISTS ix_bibRefCitations_treatmentId            ON bibRefCitations    (deleted, treatmentId)',
            ix_bibRefCitations_deleted               : 'CREATE INDEX IF NOT EXISTS ix_bibRefCitations_deleted                ON bibRefCitations    (deleted)',
            ix_collectionCodes_collectionCode        : 'CREATE INDEX IF NOT EXISTS ix_collectionCodes_collectionCode         ON collectionCodes    (collectionCode COLLATE NOCASE)'
        }

        for (let i in indexes) {
            log.info(`  - creating index ${b(i)}`)

            if (truebug.run === 'real') {
                try {
                    DB.treatments.prepare(indexes[i]).run()
                }
                catch(error) {
                    log.error('… skipping (already exists)')
                }
            }
        }
    }
}

const dropIndexes = (truebug) => {
    const s = truebug.switches

    if (s.dropIndexes) {
        log.info('dropping indexes')

        for (let i in indexes) {
            log.info(`  - dropping index ${b(i)}`)

            if (truebug.run === 'real') {
                try {
                    DB.treatments.prepare(`DROP INDEX IF EXISTS ${i}`).run()
                }
                catch(error) {
                    log.error("… wasn't able to drop index; maybe it doesn't exist)")
                }
            }
        }
    }
}

const insertEtlStats = function(truebug) {
    const s = truebug.switches

    if (s.insertEtlStats) {
        log.info('calculating and inserting ETL stats')

        truebug.etlStats.loaded = selCountOfTreatments() - truebug.etlStats.loaded
        if (truebug.run === 'real') {
            truebug.preparedInsertStatements.etl.run({
                started: truebug.etlStats.started,
                ended: truebug.etlStats.ended,
                downloaded: truebug.etlStats.downloaded,
                parsed: JSON.stringify(truebug.etlStats.parsed),
                loaded: truebug.etlStats.loaded
            })
        }
    }
}

module.exports = {
    createTables,
    createInsertStatements,
    insertData,
    loadFTS,
    buildIndexes,
    dropIndexes,
    insertEtlStats,
    getDateOfLastEtl,
    selCountOfTreatments
}