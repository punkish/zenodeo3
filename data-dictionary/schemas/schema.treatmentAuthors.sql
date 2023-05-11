CREATE TABLE treatmentAuthors (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The unique resourceId of the treatmentAuthor
    "treatmentAuthorId" TEXT NOT NULL UNIQUE,

    -- The author of this treatment (author of the article is used if
    -- no treatment authority is found)
    "treatmentAuthor" TEXT,

    -- The ID of the parent treatment (FK)
    "treatmentId" TEXT NOT NULL REFERENCES treatments(treatmentId)
);