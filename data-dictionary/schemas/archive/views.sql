CREATE VIEW IF NOT EXISTS etlView AS
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

CREATE VIEW IF NOT EXISTS archivesView AS
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

CREATE VIEW IF NOT EXISTS tbArchivesUpdatesView AS
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

CREATE VIEW IF NOT EXISTS transactionsView AS
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

CREATE VIEW IF NOT EXISTS etlTransactions AS 
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