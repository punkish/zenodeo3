CREATE TABLE archives (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- One of yearly, monthly, weekly or daily
    "typeOfArchive" TEXT  NOT NULL CHECK (typeOfArchive IN ('yearly', 'monthly', 'weekly', 'daily')),

    -- Time when the archive was created in UTC ms since epoch
    "timeOfArchive" INTEGER,

    -- Size of the archive in kilobytes
    "sizeOfArchive" INTEGER
);
CREATE TABLE downloads (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- FK to archives(id)
    "archiveId" INTEGER NOT NULL REFERENCES archives(id),

    -- start of process in ms
    "started" INTEGER,

    -- end of process in ms
    "ended" INTEGER
);
CREATE TABLE etl (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- FK to archives(id)
    "archiveId" INTEGER NOT NULL REFERENCES archives(id),

    -- Time ETL process started in UTC ms since epoch
    "started" INTEGER,

    -- Time ETL process ended in UTC ms since epoch
    "ended" INTEGER,

    -- Number of treatments in the archive
    "treatments" INTEGER,

    -- Number of treatmentCitations in the archive
    "treatmentCitations" INTEGER,

    -- Number of materialCitations in the archive
    "materialCitations" INTEGER,

    -- Number of figureCitations in the archive
    "figureCitations" INTEGER,

    -- Number of bibRefCitations in the archive
    "bibRefCitations" INTEGER,

    -- Number of authors in the archive
    "treatmentAuthors" INTEGER,

    -- Number of collection codes in the archive
    "collectionCodes" INTEGER,

    -- Number of journals in the archive
    "journals" INTEGER
);
CREATE TABLE queries (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- md5 hash corresponding to the cached file on disk
    "queryId" TEXT NOT NULL UNIQUE,

    -- The query conducted via the web
    "search" TEXT NOT NULL UNIQUE,

    -- The query conducted via the db
    "sql" TEXT NOT NULL UNIQUE,

    -- Number of queries
    "num" INTEGER DEFAULT 1
);
CREATE TABLE queryStats (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- FK to the query
    "queryId" INTEGER NOT NULL REFERENCES queries(id),

    -- query performance time in ms
    "timeTaken" INTEGER NOT NULL,

    -- timestamp of query
    "created" INTEGER DEFAULT (strftime('%s','now'))
);
CREATE VIEW queriesView AS
SELECT

    -- md5 hash corresponding to the cached file on disk
    queryId,

    -- The query conducted via the web
    search,

    -- the duration of the process
    ("ended" - "started") AS duration,

    -- the name of the process
    "process" FROM queries
/* queriesView(queryId,search,duration,"""process""") */;
CREATE TABLE unzip (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- FK to archives(id)
    "archiveId" INTEGER NOT NULL REFERENCES archives(id),

    -- start of process in ms
    "started" INTEGER,

    -- end of process in ms
    "ended" INTEGER,

    -- number of files in the zip archive
    "numOfFiles" INTEGER
);
CREATE INDEX ix_archives_typeOfArchive ON archives ("typeOfArchive");
CREATE INDEX ix_downloads_archiveId ON downloads ("archiveId");
CREATE INDEX ix_downloads_started ON downloads ("started");
CREATE INDEX ix_downloads_ended ON downloads ("ended");
CREATE INDEX ix_etl_archiveId ON etl ("archiveId");
CREATE INDEX ix_etl_started ON etl ("started");
CREATE INDEX ix_etl_ended ON etl ("ended");
CREATE INDEX ix_unzip_archiveId ON unzip ("archiveId");
CREATE INDEX ix_unzip_started ON unzip ("started");
CREATE INDEX ix_unzip_ended ON unzip ("ended");
CREATE INDEX ix_unzip_numOfFiles ON unzip ("numOfFiles");