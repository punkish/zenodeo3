CREATE TABLE figureCitations (

    -- PK
    "id" INTEGER PRIMARY KEY,

    -- The resourceId of the figureCitation
    "figureCitationId" TEXT NOT NULL UNIQUE,

    -- The ID of the parent treatment (FK)
    "treatmentId" TEXT NOT NULL REFERENCES treatments("treatmentId"),

    -- serial number of figure for a figureCitationId and treatmentId
    -- combination
    "figureNum" INTEGER DEFAULT 0,

    -- The full text of the figure cited by this treatment
    "captionText" TEXT,

    -- The URI of the image
    "httpUri" TEXT,

    -- unique declaration
    UNIQUE ("figureCitationId", "figureNum")
);
CREATE VIRTUAL TABLE figureCitationsFts USING fts5 (
    captionText,
    content=''
)
/* figureCitationsFts(captionText) */;
CREATE TABLE IF NOT EXISTS 'figureCitationsFts_data'(id INTEGER PRIMARY KEY, block BLOB);
CREATE TABLE IF NOT EXISTS 'figureCitationsFts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS 'figureCitationsFts_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
CREATE TABLE IF NOT EXISTS 'figureCitationsFts_config'(k PRIMARY KEY, v) WITHOUT ROWID;
CREATE TRIGGER fc_afterInsert
            AFTER INSERT ON figureCitations
            BEGIN

                -- insert new entry in fulltext index
                INSERT INTO figurecitationsFts(
                    rowid,
                    captionText
                )
                VALUES (
                    new.id,
                    new.captionText
                );
            END;
CREATE TRIGGER fc_afterUpdate
            AFTER UPDATE ON figureCitations
            BEGIN
                INSERT INTO figurecitationsFts(
                    figurecitationsFts,
                    rowid,
                    captionText
                )
                VALUES(
                    'delete',
                    old.id,
                    old.captionText
                );

                INSERT INTO figurecitationsFts(
                    rowid,
                    captionText
                )
                VALUES (
                    new.id,
                    new.captionText
                );
            END;
CREATE TRIGGER fc_afterDelete
            AFTER DELETE ON figureCitations
            BEGIN
                INSERT INTO figurecitationsFts(
                    figurecitationsFts,
                    rowid,
                    captionText
                )
                VALUES(
                    'delete',
                    old.id,
                    old.captionText
                );
            END;
CREATE INDEX ix_figureCitations_figureCitationId ON figureCitations ("figureCitationId");
CREATE INDEX ix_figureCitations_treatmentId ON figureCitations ("treatmentId");