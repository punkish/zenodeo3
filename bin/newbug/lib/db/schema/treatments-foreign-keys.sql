CREATE TABLE IF NOT EXISTS journals (
    id INTEGER PRIMARY KEY, 
    journalTitle TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TABLE IF NOT EXISTS journalsByYears (
    journals_id INTEGER NOT NULL REFERENCES journals(id),
    journalYear INTEGER NOT NULL,

    -- Number of times a treatment from a journal with this 
    -- specific was journals_id was processed in this journalYear
    num INTEGER NOT NULL,
    PRIMARY KEY (journals_id, journalYear)
) WITHOUT rowid;

CREATE TABLE IF NOT EXISTS kingdoms (
    id INTEGER PRIMARY KEY, 
    kingdom TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TABLE IF NOT EXISTS phyla (
    id INTEGER PRIMARY KEY, 
    phylum TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY, 
    class TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY, 
    "order" TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TABLE IF NOT EXISTS genera (
    id INTEGER PRIMARY KEY, 
    genus TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TABLE IF NOT EXISTS families (
    id INTEGER PRIMARY KEY, 
    family TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TABLE IF NOT EXISTS species (
    id INTEGER PRIMARY KEY, 
    species TEXT UNIQUE ON CONFLICT IGNORE
);