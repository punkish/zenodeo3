CREATE TABLE bibRefCitations (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The unique ID of the bibRefCitation
    "bibRefCitationId" TEXT UNIQUE NOT NULL CHECK(Length(bibRefCitationId) = 32),

    -- The DOI of the citation
    "DOI" TEXT COLLATE NOCASE,

    -- The author
    "author" TEXT COLLATE NOCASE,

    -- The journal or publisher
    "journalOrPublisher" TEXT COLLATE NOCASE,

    -- The title of the citation
    "title" TEXT COLLATE NOCASE,

    -- The full text of the reference cited by the treatment
    "refString" TEXT COLLATE NOCASE,

    -- The type of reference cited by the treatment
    "type" TEXT COLLATE NOCASE,

    -- The year of the reference cited by this treatment
    "year" INTEGER,

    -- The innertext text of the bibRefCitation
    "innertext" TEXT COLLATE NOCASE,

    -- The ID of the parent treatment (FK)
    "treatments_id" INTEGER NOT NULL REFERENCES treatments(id)
);
CREATE TRIGGER bc_afterInsert 
AFTER INSERT ON bibRefCitations 
BEGIN

    --insert new entry in fulltext index
    INSERT INTO bibRefCitationsFts( refString ) 
    VALUES ( new.refString );
END;
CREATE TRIGGER bc_afterUpdate
AFTER UPDATE ON bibRefCitations 
BEGIN

    -- "delete" the old index from the fts table
    INSERT INTO bibRefCitationsFts( bibRefCitationsFts, rowid, refString ) 
    VALUES( 'delete', old.id, old.refString );

    -- add the new index to the fts table
    INSERT INTO bibRefCitationsFts( rowid, refString ) 
    VALUES ( new.id, new.refString );
END;
CREATE TRIGGER bc_afterDelete 
AFTER DELETE ON bibRefCitations 
BEGIN

    -- "delete" the old index from the fts table
    INSERT INTO bibRefCitationsFts( bibRefCitationsFts, rowid, refString ) 
    VALUES( 'delete', old.id, old.refString );
END;
CREATE INDEX ix_bibRefCitations_DOI ON bibRefCitations ("DOI");
CREATE INDEX ix_bibRefCitations_author ON bibRefCitations ("author");
CREATE INDEX ix_bibRefCitations_journalOrPublisher ON bibRefCitations ("journalOrPublisher");
CREATE INDEX ix_bibRefCitations_title ON bibRefCitations ("title");
CREATE INDEX ix_bibRefCitations_year ON bibRefCitations ("year");
CREATE VIRTUAL TABLE bibRefCitationsFts USING fts5 (
    refString,
    content='bibRefCitations',
    content_rowid='id'
)
/* bibRefCitationsFts(refString) */;