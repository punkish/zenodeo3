CREATE TABLE IF NOT EXISTS treatmentAuthors (
    id INTEGER PRIMARY KEY,
    treatmentAuthorId TEXT NOT NULL Check(Length(treatmentAuthorId) = 32),
    treatments_id INTEGER NOT NULL REFERENCES treatments(id),

    -- The author of this treatment (author of the article is used if
    -- no treatment authority is found)
    treatmentAuthor TEXT COLLATE NOCASE,
    email TEXT COLLATE NOCASE
);