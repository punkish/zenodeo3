CREATE TABLE IF NOT EXISTS treatmentCitations (
    id INTEGER PRIMARY KEY,
    treatmentCitationId TEXT UNIQUE NOT NULL CHECK(Length(treatmentCitationId) = 32),
    treatments_id INTEGER NOT NULL REFERENCES treatments(id),
    bibRefCitations_id INTEGER REFERENCES bibRefCitations(id),

    -- The taxonomic name and the author of the species, 
    -- plus the author of the treatment being cited
    treatmentCitation TEXT COLLATE NOCASE,

    -- The bibliographic reference string of the treatments cited by
    -- this treatment
    refString TEXT COLLATE NOCASE
);

CREATE VIEW IF NOT EXISTS treatmentCitationsView AS
    SELECT
        t.treatmentCitationId,
        t.treatments_id,
        t.treatmentCitation,
        t.refString,
        t.bibRefCitations_id,
        b.bibRefCitationId
    FROM
        treatmentCitations t 
        JOIN bibRefCitations b ON t.bibRefCitations_id = b.id;

CREATE TRIGGER IF NOT EXISTS treatmentCitationsView_ii INSTEAD OF INSERT ON treatmentCitationsView
    BEGIN
        INSERT INTO treatmentCitations (
            treatmentCitationId,
            treatments_id,
            treatmentCitation,
            refString
        )
        VALUES (
            new.treatmentCitationId,
            new.treatments_id,
            new.treatmentCitation,
            new.refString
        );

        UPDATE treatmentCitations
        SET bibRefCitations_id = (
            SELECT id 
            FROM bibRefCitations 
            WHERE bibRefCitationId = new.bibRefCitationId
        )
        WHERE treatmentCitationId = new.treatmentCitationId;

        -- update rowcount
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('treatmentCitations', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'treatmentCitations';
    END;

CREATE TRIGGER IF NOT EXISTS treatmentCitations_ad AFTER DELETE ON treatmentCitations 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'treatmentCitations'; 
    END;