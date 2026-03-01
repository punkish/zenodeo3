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