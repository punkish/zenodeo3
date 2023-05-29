CREATE TABLE treatmentCitations (

    -- The unique resourceId of the treatmentCitation
    "treatmentCitationId" TEXT UNIQUE NOT NULL PRIMARY KEY CHECK(Length(treatmentCitationId) = 32),

    -- The ID of the parent treatment (FK)
    "treatments_id" INTEGER NOT NULL REFERENCES treatments(id),

    -- The ID of the related bibRefCitation (FK)
    "bibRefCitations_id" INTEGER REFERENCES bibRefCitations(id),

    -- The taxonomic name and the author of the species, plus the author
    -- of the treatment being cited
    "treatmentCitation" TEXT COLLATE NOCASE,

    -- The bibliographic reference string of the treatments cited by
    -- this treatment
    "refString" TEXT COLLATE NOCASE
) WITHOUT rowid;
CREATE INDEX ix_treatmentCitations_treatments_id ON treatmentCitations ("treatments_id");
CREATE INDEX ix_treatmentCitations_bibRefCitations_id ON treatmentCitations ("bibRefCitations_id");
CREATE INDEX ix_treatmentCitations_treatmentCitation ON treatmentCitations ("treatmentCitation");
CREATE INDEX ix_treatmentCitations_refString ON treatmentCitations ("refString");