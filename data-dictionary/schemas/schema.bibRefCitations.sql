CREATE TABLE bibRefCitations (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The unique ID of the bibRefCitation
    "bibRefCitationId" TEXT NOT NULL UNIQUE CHECK(Length("bibRefCitationId") = 32),

    -- The ID of the parent treatment (FK)
    "treatmentId" TEXT NOT NULL REFERENCES treatments(treatmentId),

    -- The author
    "author" TEXT,

    -- The journal or publisher
    "journalOrPublisher" TEXT,

    -- The title of the citation
    "title" TEXT,

    -- The full text of the reference cited by the treatment
    "refString" TEXT,

    -- The type of reference cited by the treatment
    "type" TEXT,

    -- The year of the reference cited by this treatment
    "year" TEXT,

    -- The full text of the bibRefCitation
    "fulltext" TEXT
);
CREATE VIRTUAL TABLE bibRefCitationsFts USING fts5 (
    fulltext,
    content=''
)
/* bibRefCitationsFts(fulltext) */;
CREATE TABLE IF NOT EXISTS 'bibRefCitationsFts_data'(id INTEGER PRIMARY KEY, block BLOB);
CREATE TABLE IF NOT EXISTS 'bibRefCitationsFts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS 'bibRefCitationsFts_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
CREATE TABLE IF NOT EXISTS 'bibRefCitationsFts_config'(k PRIMARY KEY, v) WITHOUT ROWID;
CREATE TRIGGER bc_afterInsert
            AFTER INSERT ON bibRefCitations
            BEGIN

                -- insert new entry in fulltext index
                INSERT INTO bibRefCitationsFts(
                    rowid,
                    fulltext
                )
                VALUES (
                    new.id,
                    new.fulltext
                );
            END;
CREATE TRIGGER bc_afterUpdate
            AFTER UPDATE ON bibRefCitations
            BEGIN

                -- "delete" the old index from the fts table
                INSERT INTO bibRefCitationsFts(
                    bibRefCitationsFts,
                    rowid,
                    fulltext
                )
                VALUES(
                    'delete',
                    old.id,
                    old.fulltext
                );

                -- add the new index to the fts table
                INSERT INTO bibRefCitationsFts(
                    rowid,
                    fulltext
                )
                VALUES (
                    new.id,
                    new.fulltext
                );
            END;
CREATE TRIGGER bc_afterDelete
            AFTER DELETE ON bibRefCitations
            BEGIN

                -- "delete" the old index from the fts table
                INSERT INTO bibRefCitationsFts(
                    bibRefCitationsFts,
                    rowid,
                    fulltext
                )
                VALUES(
                    'delete',
                    old.id,
                    old.fulltext
                );
            END;
CREATE INDEX ix_bibRefCitations_bibRefCitationId ON bibRefCitations ("bibRefCitationId");
CREATE INDEX ix_bibRefCitations_treatmentId ON bibRefCitations ("treatmentId");
CREATE INDEX ix_bibRefCitations_year ON bibRefCitations ("year");