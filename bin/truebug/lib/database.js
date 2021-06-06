'use strict'

const chalk = require('chalk')
const Database = require('better-sqlite3')
const config = require('config')
const DB = {
    treatments: new Database(config.get('data.treatments')),
    etlStats: new Database(config.get('data.etlStats')),
    queryStats: new Database(config.get('data.queryStats'))
}

const selCountOfTreatments = function() {
    return DB.treatments.prepare('SELECT Count(*) AS c FROM treatments')
        .get()
        .c
}

const createTables = function(opts) {
    console.log('creating tables')

    const dbs = {

        treatments: {
            treatments: `CREATE TABLE IF NOT EXISTS treatments ( 
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
        author TEXT,
        deleted INTEGER DEFAULT 0,
        created INTEGER DEFAULT (strftime('%s','now')),
        updated INTEGER
    )`,
            
            treatmentAuthors: `CREATE TABLE IF NOT EXISTS treatmentAuthors ( 
        id INTEGER PRIMARY KEY,
        treatmentAuthorId TEXT NOT NULL,
        treatmentId TEXT NOT NULL,
        treatmentAuthor TEXT,
        deleted INTEGER DEFAULT 0,
        created INTEGER DEFAULT (strftime('%s','now')),
        updated INTEGER,
        UNIQUE (treatmentAuthorId, treatmentId)
    )`,
            
            materialsCitations: `CREATE TABLE IF NOT EXISTS materialsCitations ( 
        id INTEGER PRIMARY KEY,
        materialsCitationId TEXT NOT NULL,
        treatmentId TEXT NOT NULL,
        collectingDate TEXT,
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

            materialsCitationsXCollectionCodes: `CREATE TABLE IF NOT EXISTS materialsCitationsXcollectionCodes ( 
        id INTEGER PRIMARY KEY,
        materialsCitationId TEXT,
        collectionCode TEXT,
        created INTEGER DEFAULT (strftime('%s','now')),
        updated INTEGER,
        UNIQUE (collectionCode, materialsCitationId)
    )`,

            collectionCodes: `CREATE TABLE IF NOT EXISTS collectionCodes ( 
        id INTEGER PRIMARY KEY,
        collectionCode TEXT NOT NULL UNIQUE,
        created INTEGER DEFAULT (strftime('%s','now')),
        updated INTEGER
    )`,
            
            treatmentCitations: `CREATE TABLE IF NOT EXISTS treatmentCitations ( 
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
            
            figureCitations: `CREATE TABLE IF NOT EXISTS figureCitations ( 
        id INTEGER PRIMARY KEY,
        figureCitationId TEXT NOT NULL,
        treatmentId TEXT NOT NULL,
        captionText TEXT,
        httpUri TEXT,
        thumbnailUri TEXT,
        deleted INTEGER DEFAULT 0,
        created INTEGER DEFAULT (strftime('%s','now')),
        updated INTEGER,
        UNIQUE (figureCitationId, treatmentId)
    )`,
            
            bibRefCitations: `CREATE TABLE IF NOT EXISTS bibRefCitations ( 
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
            
            vtreatments: 'CREATE VIRTUAL TABLE IF NOT EXISTS vtreatments USING FTS5(treatmentId, fullText)',
            vfigurecitations: 'CREATE VIRTUAL TABLE IF NOT EXISTS vfigurecitations USING FTS5(figureCitationId, captionText)',
            vbibrefcitations: 'CREATE VIRTUAL TABLE IF NOT EXISTS vbibrefcitations USING FTS5(bibRefCitationId, refString)',
            vlocations: 'CREATE VIRTUAL TABLE IF NOT EXISTS vlocations USING geopoly(treatmentId, materialsCitationId)'
        },

        etlStats: {

            etl: `CREATE TABLE IF NOT EXISTS etl ( 
    id INTEGER PRIMARY KEY,
    started INTEGER,
    ended INTEGER,
    downloaded INTEGER,
    parsed TEXT,
    loaded INTEGER
    )`,
        },

        queryStats: {

            webqueries: `CREATE TABLE IF NOT EXISTS webqueries (
        id INTEGER PRIMARY KEY,

        -- stringified queryObject
        qp TEXT NOT NULL UNIQUE,

        -- counter tracking queries
        count INTEGER DEFAULT 1
    )`,

            sqlqueries: `CREATE TABLE IF NOT EXISTS sqlqueries (
        id INTEGER PRIMARY KEY,

        -- SQL query
        sql TEXT NOT NULL UNIQUE
    )`,

            stats: `CREATE TABLE IF NOT EXISTS stats (
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
    
    for (let db in dbs) {
        const tables = dbs[db]

        for (let t in tables) {
            process.stdout.write(`   - creating table ${chalk.bold(t)} … `)
            if (opts.runtype === 'real') DB[db].prepare(tables[t]).run()
            console.log(chalk.green('done'))
        }
    }

    createInsertStatements(opts)
    
}

const createInsertStatements = function(opts) {
    const updateTime = Math.floor(new Date().getTime() / 1000)
    const rawInsertStatements = {
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
                    author=excluded.author,
                    deleted=excluded.deleted,
                    updated=${updateTime}`,

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
                    updated=${updateTime}`,

            materialsCitations: `INSERT INTO materialsCitations (
                    materialsCitationId,
                    treatmentId,
                    collectingDate,
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
                    updated=${updateTime}`,

            collectionCodes: `INSERT INTO collectionCodes (collectionCode)
                VALUES (@collectionCode)
                ON CONFLICT (collectionCode)
                DO UPDATE SET collectionCode=excluded.collectionCode, updated=${updateTime}`,

            materialsCitationsXcollectionCodes: `INSERT INTO materialsCitationsXcollectionCodes (
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
                        updated=${updateTime}`,

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
                    updated=${updateTime}`,

                    //thumbnailUri,
            figureCitations: `INSERT INTO figureCitations (
                    figureCitationId,
                    treatmentId,
                    captionText,
                    httpUri,
                    
                    deleted
                )
                VALUES ( 
                    @figureCitationId,
                    @treatmentId,
                    @captionText,
                    @httpUri,
                    
                    @deleted
                )
                ON CONFLICT (figureCitationId, treatmentId)
                DO UPDATE SET
                    treatmentId=excluded.treatmentId,
                    captionText=excluded.captionText,
                    httpUri=excluded.httpUri,
                    
                    deleted=excluded.deleted,
                    updated=${updateTime}`,

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
                    updated=${updateTime}`,
        
            vtreatments: 'INSERT INTO vtreatments SELECT treatmentId, fulltext FROM treatments WHERE deleted = 0',
            vfigurecitations: 'INSERT INTO vfigurecitations SELECT figureCitationId, captionText FROM figureCitations WHERE deleted = 0',
            vbibrefcitations: 'INSERT INTO vbibrefcitations SELECT bibRefCitationId, refString FROM bibRefCitations WHERE deleted = 0',
            vlocations: "INSERT INTO vlocations(treatmentId, materialsCitationId, _shape) SELECT treatments.treatmentId, materialsCitationId, '[[' || longitude || ',' || latitude || '],[' || longitude || ',' || latitude || '],[' || longitude || ',' || latitude || '],[' || longitude || ',' || latitude || ']]' AS _shape FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE latitude != '' AND longitude != ''"
        },

        etlStats: {
            etl: 'INSERT INTO etl (started, ended, downloaded, parsed, loaded) VALUES (@started, @ended, @downloaded, @parsed, @loaded)'
        }
    }

    console.log('creating insert statements')

    for (let db in rawInsertStatements) {
        const stmts = rawInsertStatements[db]

        for (let s in stmts) {
            process.stdout.write(`   - creating insert statement ${chalk.bold(s)} … `)
            if (opts.runtype === 'real') opts.preparedInsertStatements[ s ] = DB[db].prepare(stmts[s])
            console.log(chalk.green('done'))
        }
    }    
}

const getDateOfLastEtl = function() {
    return DB.etlStats.prepare("SELECT date(started/1000, 'unixepoch') AS d FROM etl WHERE id = (SELECT Max(id) FROM etl)")
        .get()
        .d
}

const insertData = function(opts, data) {

    // const counts = {
    //     treatments: data.length,
    //     treatmentAuthors   : 0, 
    //     materialsCitations : 0, 
    //     treatmentCitations : 0, 
    //     figureCitations    : 0, 
    //     bibRefCitations    : 0
    // }
    // for (let i = 0, j = data.length; i < j; i++) {
    //     if (data[i].treatmentAuthors)   counts.treatmentAuthors   += data[i].treatmentAuthors.length
    //     if (data[i].materialsCitations) counts.materialsCitations += data[i].materialsCitations.length
    //     if (data[i].treatmentCitations) counts.treatmentCitations += data[i].treatmentCitations.length
    //     if (data[i].figureCitations)    counts.figureCitations    += data[i].figureCitations.length
    //     if (data[i].bibRefCitations)    counts.bibRefCitations    += data[i].bibRefCitations.length
    // }

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
     *         materialsCitations: [ {}, {} …  ],
     *         collectionCodes: [ {}, {} …  ],
     *         treatmentCitations:  [ {}, {} …  ],
     *         figureCitations:     [ {}, {} …  ],
     *         bibRefCitations:     [ {}, {} …  ] 
     *     },
     * 
     *     // treatment 2 and its related data
     *     { 
     *         treatment: { },
     *         treatmentAuthors:    [ {}, {} …  ],
     *         materialsCitations:   [ {}, {} …  ],
     *         collectionCodes: [ {}, {} …  ],
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
     *     materialsCitationsXcollectionCodes: [
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

    const d = {
        treatments: [],
        treatmentAuthors: [],
        materialsCitations: [],
        materialsCitationsXcollectionCodes: [],
        collectionCodes: [],
        treatmentCitations: [],
        figureCitations: [],
        bibRefCitations: []
    };

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
                    opts.preparedInsertStatements[ table ].run(row)
                }
            })

            insertMany(d[ table ])
        }
    }
}

const loadFTS = function(opts) {
    opts.fts.forEach(f => {
        console.log(`loading ${f}`)
        if (opts.runtype === 'real') {
            try {
                opts.preparedInsertStatements[f].run()
                console.log(chalk.green('done'))
            }
            catch(error) {
                console.error(error)
            }
        }
    })
    
}

const buildIndexes = function(opts) {
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
    }

    for (let i in indexes) {
        process.stdout.write(`   - creating index ${chalk.bold(i)} … `)
        if (opts.runtype === 'real') {
            try {
                db.prepare(indexes[i]).run()
                console.log(chalk.green('done'))
            }
            catch(error) {
                console.log(`… skipping (already exists)`);
            }
        }
        else {
            console.log(chalk.green('done'))
        }
    }
}

const insertEtlStats = function(opts) {
    if (opts.runtype === 'real') {
        opts.preparedInsertStatements.etl.run({
            started: opts.etl.started,
            ended: opts.etl.ended,
            downloaded: opts.etl.downloaded,
            parsed: JSON.stringify(opts.etl.parsed),
            loaded: opts.etl.loaded
        })
    }
}

module.exports = {
    createTables,
    insertData,
    loadFTS,
    buildIndexes,
    insertEtlStats,
    getDateOfLastEtl,
    selCountOfTreatments
}