CREATE TABLE treatmentAuthors (

    -- The unique resourceId of the treatmentAuthor
    "treatmentAuthorId" TEXT NOT NULL PRIMARY KEY Check(Length(treatmentAuthorId) = 32),

    -- The author of this treatment (author of the article is used if
    -- no treatment authority is found)
    "treatmentAuthor" TEXT COLLATE NOCASE,

    -- The email of the author
    "email" TEXT COLLATE NOCASE,

    -- The ID of the parent treatment (FK)
    "treatments_id" INTEGER NOT NULL REFERENCES treatments(id)
) WITHOUT rowid;
CREATE INDEX ix_treatmentAuthors_treatmentAuthor ON treatmentAuthors ("treatmentAuthor");
CREATE INDEX ix_treatmentAuthors_email ON treatmentAuthors ("email");
CREATE INDEX ix_treatmentAuthors_treatments_id ON treatmentAuthors ("treatments_id");