// This attached database stores the JSON derived from the processed xml
// files as well the stats from the ETLed archives
/*
CREATE TABLE treatments (
    treatmentId TEXT UNIQUE NOT NULL CHECK (Length(treatmentId) = 32),
    xml TEXT NOT NULL,
    json TEXT NOT NULL,
    PRIMARY KEY(treatmentId)
) WITHOUT rowid;
*/
export function dumpsSchema(alias) {
    return `
CREATE TABLE IF NOT EXISTS archive.treatmentsDump (
    id INTEGER PRIMARY KEY,
    xml TEXT NOT NULL,
    json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS archive.archives (
    id INTEGER PRIMARY KEY,

    -- One of yearly, monthly, weekly or daily
    typeOfArchive TEXT NOT NULL CHECK (typeOfArchive IN (
        'yearly', 'monthly', 'weekly', 'daily'
    )),

    -- Date when the archive was created, stored as yyyy-mm-dd
    dateOfArchive TEXT NOT NULL,

    -- Size of the archive in kilobytes
    sizeOfArchive INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS archive.etl (
    id INTEGER PRIMARY KEY,
    archives_id INTEGER NOT NULL REFERENCES archives(id),

    -- Time ETL process started and ended, in ms since epoch
    started INTEGER,
    ended INTEGER,

    -- Number of treatments and its parts stored in the archive
    treatments INTEGER,
    treatmentCitations INTEGER,
    materialCitations INTEGER,
    figureCitations INTEGER,
    bibRefCitations INTEGER,
    treatmentAuthors INTEGER,
    collectionCodes INTEGER,
    journals INTEGER
);

CREATE TABLE IF NOT EXISTS archive.downloads (
    id INTEGER PRIMARY KEY,
    archives_id INTEGER NOT NULL REFERENCES archives(id),

    -- start and end of the process in ms since epoch
    started INTEGER,
    ended INTEGER
);

CREATE TABLE IF NOT EXISTS archive.unzip (
    id INTEGER PRIMARY KEY,
    archives_id INTEGER NOT NULL REFERENCES archives(id),

    -- start and end of the process in ms since epoch
    started INTEGER,
    ended INTEGER,

    -- number of files in the zip archive
    numOfFiles INTEGER
);

CREATE VIEW IF NOT EXISTS archive.archivesView AS
    SELECT 
        a.id, a.typeOfArchive, a.dateOfArchive, a.sizeOfArchive,
        u.started AS unzipStarted, u.ended AS unzipEnded, u.numOfFiles,
        d.started AS downloadStarted, d.ended AS downloadEnded,
        e.started AS etlStarted, e.ended AS etlEnded, e.treatments,
        e.treatmentCitations, e.materialCitations, e.figureCitations,
        e.bibRefCitations, e.treatmentAuthors, e.collectionCodes,
        e.journals
    FROM 
        archives a
        JOIN unzip u ON a.id = u.archives_id
        JOIN downloads d ON a.id = d.archives_id 
        JOIN etl e ON a.id = e.archives_id;

CREATE TRIGGER IF NOT EXISTS archive.archivesView_ii 
    INSTEAD OF INSERT ON archivesView
    BEGIN
        INSERT INTO archives (typeOfArchive, dateOfArchive, sizeOfArchive)
        VALUES (new.typeOfArchive, new.dateOfArchive, new.sizeOfArchive);

        INSERT INTO unzip (archives_id, started, ended, numOfFiles)
        VALUES (
            last_insert_rowid(),
            new.unzipStarted, 
            new.unzipEnded, 
            new.numOfFiles
        );

        INSERT INTO downloads (archives_id, started, ended)
        VALUES (
            last_insert_rowid(),
            new.downloadStarted, 
            new.downloadEnded
        );

        INSERT INTO etl (
            archives_id, 
            started, 
            ended, 
            treatments,
            treatmentCitations,
            materialCitations,
            figureCitations,
            bibRefCitations,
            treatmentAuthors,
            collectionCodes,
            journals
        )
        VALUES (
            last_insert_rowid(),
            new.etlStarted, 
            new.etlEnded, 
            new.treatments,
            new.treatmentCitations,
            new.materialCitations,
            new.figureCitations,
            new.bibRefCitations,
            new.treatmentAuthors,
            new.collectionCodes,
            new.journals
        );
    END;
`
}