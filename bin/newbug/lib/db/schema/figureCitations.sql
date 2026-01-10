CREATE TABLE IF NOT EXISTS figureCitations (
    id INTEGER PRIMARY KEY,
    figureCitationId TEXT NOT NULL Check(Length(figureCitationId = 32)),
    treatments_id INTEGER NOT NULL REFERENCES treatments(id),
    httpUri TEXT NOT NULL UNIQUE ON CONFLICT IGNORE,

    figureDoiOriginal TEXT,

    -- The DOI of the image cleaned up
    figureDoi TEXT GENERATED ALWAYS AS (Iif(
        Instr(figureDoiOriginal, '/10.'), 
        Substr(figureDoiOriginal, Instr(figureDoiOriginal, '/10.') + 1), 
        figureDoiOriginal
    )) STORED,

    -- serial number of figure for a figureCitationId and 
    -- treatmentId combination
    figureNum INTEGER DEFAULT 0,
    updateVersion INTEGER,
    captionText TEXT COLLATE NOCASE,
    UNIQUE (figureCitationId, figureNum)
);

CREATE VIEW IF NOT EXISTS images AS
    SELECT
        id,
        treatments_id,
        httpUri,
        figureDoi,
        captionText
    FROM
        figureCitations
    WHERE
        httpUri != '' AND httpUri IS NOT NULL;


CREATE VIRTUAL TABLE IF NOT EXISTS imagesFts USING fts5 (
    captionText,
    content='images',
    content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS figureCitations_ai AFTER INSERT ON figureCitations 
    BEGIN
        INSERT INTO imagesFts (captionText)
        VALUES (NEW.captionText);

        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('figureCitations', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'figureCitations';
    END;

CREATE TRIGGER IF NOT EXISTS figureCitations_ad AFTER DELETE ON figureCitations 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'figureCitations'; 
    END;