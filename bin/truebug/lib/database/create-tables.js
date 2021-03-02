'use strict'

const chalk = require('chalk')
const Database = require('better-sqlite3')
const config = require('config')
const db = new Database(config.get('data.treatmentsTmp'))
const etlStats = new Database(config.get('data.etlStats'))

const createTables = function(opts) {
    console.log('creating tables')

    const tables = {
        treatments: `CREATE TABLE IF NOT EXISTS treatments ( 
    id INTEGER PRIMARY KEY,
    treatmentId TEXT NOT NULL UNIQUE,
    treatmentTitle TEXT,
    doi TEXT,
    zenodoDep TEXT,
    zoobank TEXT,
    articleTitle TEXT,
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
    q TEXT,
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

        vlocations: 'CREATE VIRTUAL TABLE IF NOT EXISTS vlocations USING geopoly(treatmentId, materialsCitationId)',

        etl: `CREATE TABLE IF NOT EXISTS etl ( 
    id INTEGER PRIMARY KEY,
    num_of_records INTEGER,
    created INTEGER DEFAULT (strftime('%s','now'))
)`,

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
    
    for (let t in tables) {
        process.stdout.write(`   - creating table ${chalk.bold(t)} … `)
        if (!opts.dryrun) db.prepare(tables[t]).run()
        console.log(chalk.green('done'))
    }
}

module.exports = createTables