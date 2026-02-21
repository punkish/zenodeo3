CREATE TABLE archives (
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
CREATE VIEW archivesView AS
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
    FROM archives
/* archivesView(archives_id,etl_id,typeOfArchive,dateOfArchive,sizeOfArchive,nameOfArchive,archiveStarted,archiveEnded,archiveDuration) */;
CREATE VIEW tbArchivesUpdatesView AS
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
        END
/* tbArchivesUpdatesView(nameOfArchive,dateOfArchive,sizeOfArchive,archiveStarted,archiveEnded,archiveDuration) */;