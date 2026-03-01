/* this table has a row of treatment xml and json for every row  */
/* in main.treatments. Both xml and json are stored compressed. */
CREATE TABLE IF NOT EXISTS treatmentsDump (
    id INTEGER PRIMARY KEY,
    xml BLOB NOT NULL,
    json BLOB NOT NULL
);

/* every ETL process is unique */
CREATE TABLE IF NOT EXISTS etl (
    id INTEGER PRIMARY KEY,

    -- timestamps stored as ms since unix epoch matches nodejs 
    -- `new Date().getTime()`. The timezone is UTC, 1 hr before 
    -- CET where this program was written
    started INTEGER DEFAULT (unixepoch('subsec') * 1000),
    ended INTEGER,
    d INTEGER GENERATED AS (ended - started) VIRTUAL
);

CREATE TABLE IF NOT EXISTS archives (
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

CREATE TABLE IF NOT EXISTS transactions (
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