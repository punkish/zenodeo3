CREATE TABLE IF NOT EXISTS rowcounts (
    tblname TEXT PRIMARY KEY NOT NULL, 
    rows INTEGER
);
CREATE INDEX IF NOT EXISTS rowcounts_tblname ON rowcounts(tblname);