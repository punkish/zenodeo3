CREATE TABLE IF NOT EXISTS bibRefCitations (
    id INTEGER PRIMARY KEY,
    bibRefCitationId TEXT UNIQUE NOT NULL CHECK(Length(bibRefCitationId) = 32),
    treatments_id INTEGER NOT NULL REFERENCES treatments(id),
    DOI TEXT COLLATE NOCASE,
    author TEXT COLLATE NOCASE,
    journalOrPublisher TEXT COLLATE NOCASE,
    title TEXT COLLATE NOCASE,
    type TEXT COLLATE NOCASE,
    year INTEGER,

    -- The full text and innertext of the reference 
    -- cited by the treatment
    refString TEXT COLLATE NOCASE,
    innertext TEXT COLLATE NOCASE
);