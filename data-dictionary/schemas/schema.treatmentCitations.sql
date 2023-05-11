CREATE TABLE treatmentCitations (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The unique resourceId of the treatmentCitation
    "treatmentCitationId" TEXT NOT NULL UNIQUE,

    -- The ID of the parent treatment (FK)
    "treatmentId" TEXT NOT NULL REFERENCES treatments(treatmentId),

    -- The taxonomic name and the author of the species, plus the author
    -- of the treatment being cited
    "treatmentCitation" TEXT,

    -- The bibliographic reference string of the treatments cited by
    -- this treatment
    "refString" TEXT
);
CREATE INDEX ix_treatmentCitations_treatmentCitationId ON treatmentCitations ("treatmentCitationId");
CREATE INDEX ix_treatmentCitations_treatmentId ON treatmentCitations ("treatmentId");
CREATE INDEX ix_treatmentCitations_treatmentCitation ON treatmentCitations ("treatmentCitation");