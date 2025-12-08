BEGIN TRANSACTION;

/* this table has a row of treatment xml and json for every row  */
/* in main.treatments. Both xml and json are stored compressed. */
CREATE TABLE IF NOT EXISTS arc.treatmentsDump (
    id INTEGER PRIMARY KEY,
    xml BLOB NOT NULL,
    json BLOB NOT NULL
);

/* every ETL process is unique */
CREATE TABLE IF NOT EXISTS arc.etl (
    id INTEGER PRIMARY KEY,

    -- timestamps stored as ms since unix epoch matches nodejs 
    -- `new Date().getTime()`. The timezone is UTC, 1 hr before 
    -- CET where this program was written
    started INTEGER DEFAULT (unixepoch('subsec') * 1000),
    ended INTEGER,
    d INTEGER GENERATED AS (ended - started) VIRTUAL
);

CREATE VIEW IF NOT EXISTS arc.etlView AS
    SELECT 
        id AS etl_id,

        -- human-readable timestamps and duration '2025-11-22 09:38:29'
        datetime(started/1000, 'unixepoch') AS etlStarted,
        datetime(ended/1000, 'unixepoch') AS etlEnded,
        CASE
            WHEN d < 1000 THEN d || 'ms'
            WHEN d < 60000 THEN (d/1000) || 's ' || (d%1000) || 'ms'
            WHEN d < 3600000 THEN (d/60000) || 'm ' || ((d%60000)/1000) || 's ' || (d%1000) || 'ms'
            WHEN d < 86400000 THEN (d/3600000) || 'h ' || ((d%3600000)/60000) || 'm ' || ((d%60000)/1000) || 's ' || (d%1000) || 'ms' 
            ELSE (d / 86400000) || 'd ' || ((d%86400000)/3600000) || 'h ' || ((d%3600000)/60000) || 'm ' || ((d%60000)/1000) || 's ' || (d%1000) || 'ms'
        END AS etlDuration
    FROM etl;

CREATE TABLE IF NOT EXISTS arc.archives (
    id INTEGER PRIMARY KEY,
    etl_id INTEGER NOT NULL REFERENCES etl(id),

    -- timestamps stored as ms since unix epoch
    -- matches nodejs new Date().getTime()
    started INTEGER DEFAULT (unixepoch('subsec') * 1000),
    ended INTEGER,
    d INTEGER GENERATED AS (ended - started) VIRTUAL,

    typeOfArchive TEXT NOT NULL CHECK (typeOfArchive IN (
        'tb', 'file', 'dir', 'synthetic'
    )),
    nameOfArchive TEXT NOT NULL,

    -- Date when the archive was created, stored as yyyy-mm-dd
    dateOfArchive TEXT NOT NULL,

    -- Size of the archive in kilobytes
    sizeOfArchive INTEGER NOT NULL,

    numOfFiles INTEGER NOT NULL
);

CREATE VIEW IF NOT EXISTS arc.archivesView AS
    SELECT 
        id AS archives_id,
        etl_id,
        typeOfArchive, 
        dateOfArchive, 
        sizeOfArchive,
        nameOfArchive,

        -- human-readable timestamps and duration
        datetime(started/1000, 'unixepoch') AS archiveStarted,
        datetime(ended/1000, 'unixepoch') AS archiveEnded,
        CASE
            WHEN d < 1000 THEN d || 'ms'
            WHEN d < 60000 THEN (d/1000) || 's ' || (d%1000) || 'ms'
            WHEN d < 3600000 THEN (d/60000) || 'm ' || ((d%60000)/1000) || 's ' || (d%1000) || 'ms'
            WHEN d < 86400000 THEN (d/3600000) || 'h ' || ((d%3600000)/60000) || 'm ' || ((d%60000)/1000) || 's ' || (d%1000) || 'ms' 
            ELSE (d / 86400000) || 'd ' || ((d%86400000)/3600000) || 'h ' || ((d%3600000)/60000) || 'm ' || ((d%60000)/1000) || 's ' || (d%1000) || 'ms'
        END AS archiveDuration
    FROM archives;

CREATE VIEW IF NOT EXISTS arc.tbArchivesUpdatesView AS
    SELECT 
        nameOfArchive, 
        dateOfArchive, 
        sizeOfArchive,
        archiveStarted,
        archiveEnded,
        archiveDuration
    FROM (
        SELECT 
            archives_id,
            typeOfArchive,
            nameOfArchive, 
            dateOfArchive, 
            sizeOfArchive,
            archiveStarted,
            archiveEnded,
            archiveDuration,

            -- ROW_NUMBER() keeps the latest per type by assigning row  
            -- numbers ordered by id DESC per nameOfArchive 
            ROW_NUMBER() OVER (
                PARTITION BY nameOfArchive 
                ORDER BY archives_id DESC
            ) AS rownum
        FROM archivesView
        WHERE typeOfArchive = 'tb'
    )

    -- keep only the first (rownum = 1), i.e., the most recent for each type
    WHERE rownum = 1
    ORDER BY

        -- The CASE expression defines a custom sort order
        CASE nameOfArchive
            WHEN 'yearly' THEN 1
            WHEN 'monthly' THEN 2
            WHEN 'weekly' THEN 3
            WHEN 'daily' THEN 4
        END;

CREATE TABLE IF NOT EXISTS arc.transactions (
    id INTEGER PRIMARY KEY,
    archives_id INTEGER REFERENCES archives(id),

    -- timestamps stored as ms since unix epoch
    -- matches nodejs new Date().getTime()
    started INTEGER DEFAULT (unixepoch('subsec') * 1000),
    ended INTEGER,
    d INTEGER GENERATED AS (ended - started) VIRTUAL,

    -- Number of treatments and its parts stored in the archive
    treatments INTEGER DEFAULT 0,
    treatmentCitations INTEGER DEFAULT 0,
    materialCitations INTEGER DEFAULT 0,
    figureCitations INTEGER DEFAULT 0,
    bibRefCitations INTEGER DEFAULT 0,
    treatmentAuthors INTEGER DEFAULT 0,
    collectionCodes INTEGER DEFAULT 0,
    journals INTEGER DEFAULT 0,
    skipped INTEGER
);

CREATE VIEW IF NOT EXISTS arc.transactionsView AS
    SELECT 
        id AS transactions_id,
        archives_id,

        -- human-readable timestamps and duration
        datetime(started/1000, 'unixepoch') AS transactionStarted,
        datetime(ended/1000, 'unixepoch') AS transactionEnded,
        CASE
            WHEN d < 1000 THEN d || 'ms'
            WHEN d < 60000 THEN (d/1000) || 's ' || (d%1000) || 'ms'
            WHEN d < 3600000 THEN (d/60000) || 'm ' || ((d%60000)/1000) || 's ' || (d%1000) || 'ms'
            WHEN d < 86400000 THEN (d/3600000) || 'h ' || ((d%3600000)/60000) || 'm ' || ((d%60000)/1000) || 's ' || (d%1000) || 'ms' 
            ELSE (d / 86400000) || 'd ' || ((d%86400000)/3600000) || 'h ' || ((d%3600000)/60000) || 'm ' || ((d%60000)/1000) || 's ' || (d%1000) || 'ms'
        END AS transactionDuration,
        treatments,
        treatmentCitations,
        materialCitations,
        figureCitations,
        bibRefCitations,
        treatmentAuthors,
        collectionCodes,
        journals,
        skipped
    FROM transactions;

CREATE VIEW IF NOT EXISTS arc.etlTransactions AS 
    SELECT 
        e.etl_id,
        e.etlStarted,
        e.etlEnded,
        e.etlDuration,
        Sum(t.treatments) AS treatments,
        Sum(t.treatmentCitations) AS treatmentCitations,
        Sum(t.materialCitations) AS materialCitations,
        Sum(t.figureCitations) AS figureCitations,
        Sum(t.bibRefCitations) AS bibRefCitations,
        Sum(t.treatmentAuthors) AS treatmentAuthors,
        Sum(t.collectionCodes) AS collectionCodes,
        Sum(t.journals) AS journals,
        Sum(t.skipped) AS skipped
    FROM
        etlView e
        JOIN archivesView a ON e.etl_id = a.etl_id
        JOIN transactionsView t ON a.archives_id = t.archives_id
    GROUP BY
        etlStarted,
        etlEnded,
        etlDuration;

COMMIT;