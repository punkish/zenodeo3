const tables = {
    etlstats: `CREATE TABLE IF NOT EXISTS etlstats ( 
        id INTEGER PRIMARY KEY,
        started INTEGER,            -- UTC ms since epoch
        ended INTEGER,              -- UTC ms since epoch
        process TEXT,               -- 'download' or 'etl'
        timeOfArchive INTEGER,      -- UTC ms since epoch
        typeOfArchive TEXT,         -- full | monthly | weekly | daily
        sizeOfArchive INTEGER,      -- kilobytes
        numOfFiles INTEGER,         -- files downloaded in archive
        treatments INTEGER,
        treatmentCitations INTEGER,
        materialsCitations INTEGER,
        figureCitations INTEGER,
        bibRefCitations INTEGER
    )`,

    webqueries : `CREATE TABLE IF NOT EXISTS webqueries (
        id INTEGER PRIMARY KEY,
        q TEXT NOT NULL UNIQUE,
        count INTEGER DEFAULT 1
    )`,

    sqlqueries: `CREATE TABLE IF NOT EXISTS sqlqueries (
        id INTEGER PRIMARY KEY,
        sql TEXT NOT NULL UNIQUE
    )`,

    querystats: `CREATE TABLE IF NOT EXISTS querystats (
        id INTEGER PRIMARY KEY,

        -- Foreign Keys
        webqueries_id INTEGER,
        sqlqueries_id INTEGER,

        -- query performance time in ms
        timeTaken INTEGER,
        
        -- timestamp of query
        created INTEGER DEFAULT (strftime('%s','now'))
    )`,

    processes : `CREATE VIEW IF NOT EXISTS processes AS 
            SELECT 
                datetime(started / 1000, 'unixepoch') AS start,
                datetime(ended / 1000, 'unixepoch') AS end,
                (ended - started) AS duration,
                process
            FROM
                etlstats`
}

const indexes = {
    ix_bibRefCitations_bibRefCitationId: `CREATE INDEX IF NOT EXISTS ix_etlstats_typeOfArchive ON etlstats (typeOfArchive)`
};

const triggers = {};

const inserts = {
    insertEtlstats: `INSERT INTO etlstats (
        started, 
        ended, 
        process,
        timeOfArchive,
        typeOfArchive,
        sizeOfArchive,
        numOfFiles,
        treatments,
        treatmentCitations,
        materialsCitations,
        figureCitations,
        bibRefCitations
    ) 
    VALUES (
        @started, 
        @ended, 
        @process,
        @timeOfArchive,
        @typeOfArchive,
        @sizeOfArchive,
        @numOfFiles,
        @treatments,
        @treatmentCitations,
        @materialsCitations,
        @figureCitations,
        @bibRefCitations
    )`
};

export { tables, indexes, triggers, inserts }