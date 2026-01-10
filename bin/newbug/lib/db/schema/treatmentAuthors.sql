CREATE TABLE IF NOT EXISTS treatmentAuthors (
    id INTEGER PRIMARY KEY,
    treatmentAuthorId TEXT NOT NULL Check(Length(treatmentAuthorId) = 32),
    treatments_id INTEGER NOT NULL REFERENCES treatments(id),

    -- The author of this treatment (author of the article is used if
    -- no treatment authority is found)
    treatmentAuthor TEXT COLLATE NOCASE,
    email TEXT COLLATE NOCASE
);

CREATE TRIGGER IF NOT EXISTS treatmentAuthors_ai AFTER INSERT ON treatmentAuthors 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('treatmentAuthors', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'treatmentAuthors'; 
    END;
CREATE TRIGGER IF NOT EXISTS treatmentAuthors_ad AFTER DELETE ON treatmentAuthors 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'treatmentAuthors'; 
    END;