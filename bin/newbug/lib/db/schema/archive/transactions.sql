CREATE TABLE transactions (
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
CREATE VIEW transactionsView AS
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
    FROM transactions
/* transactionsView(transactions_id,archives_id,transactionStarted,transactionEnded,transactionDuration,treatments,treatmentCitations,materialCitations,figureCitations,bibRefCitations,treatmentAuthors,collectionCodes,journals,skipped) */;
CREATE VIEW etlTransactions AS 
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
        etlDuration
/* etlTransactions(etl_id,etlStarted,etlEnded,etlDuration,treatments,treatmentCitations,materialCitations,figureCitations,bibRefCitations,treatmentAuthors,collectionCodes,journals,skipped) */;