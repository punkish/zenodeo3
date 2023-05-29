CREATE TABLE figureCitations (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The resourceId of the figureCitation
    "figureCitationId" TEXT NOT NULL Check(Length(figureCitationId = 32)),

    -- serial number of figure for a figureCitationId and treatmentId
    -- combination
    "figureNum" INTEGER DEFAULT 0,

    -- The ID of the parent treatment (FK)
    "treatments_id" INTEGER NOT NULL REFERENCES treatments("id"),

    -- unique declaration
    UNIQUE ("figureCitationId", "figureNum")
);
CREATE INDEX ix_figureCitations_figureCitationId ON figureCitations ("figureCitationId");
CREATE INDEX ix_figureCitations_treatments_id ON figureCitations ("treatments_id");