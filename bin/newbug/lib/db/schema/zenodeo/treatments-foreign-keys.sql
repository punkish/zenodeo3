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

CREATE TRIGGER IF NOT EXISTS journals_ai AFTER INSERT ON journals 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('journals', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'journals'; 
    END;
CREATE TRIGGER IF NOT EXISTS journals_ad AFTER DELETE ON journals 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'journals'; 
    END;

CREATE TABLE IF NOT EXISTS kingdoms (
    id INTEGER PRIMARY KEY, 
    kingdom TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TRIGGER IF NOT EXISTS kingdoms_ai AFTER INSERT ON kingdoms 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('kingdoms', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'kingdoms'; 
    END;
CREATE TRIGGER IF NOT EXISTS kingdoms_ad AFTER DELETE ON kingdoms 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'kingdoms'; 
    END;

CREATE TABLE IF NOT EXISTS phyla (
    id INTEGER PRIMARY KEY, 
    phylum TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TRIGGER IF NOT EXISTS phyla_ai AFTER INSERT ON phyla 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('phyla', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'phyla'; 
    END;
CREATE TRIGGER IF NOT EXISTS phyla_ad AFTER DELETE ON phyla 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'phyla'; 
    END;

CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY, 
    class TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TRIGGER IF NOT EXISTS classes_ai AFTER INSERT ON classes 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('classes', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'classes'; 
    END;
CREATE TRIGGER IF NOT EXISTS classes_ad AFTER DELETE ON classes 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'classes'; 
    END;

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY, 
    "order" TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TRIGGER IF NOT EXISTS orders_ai AFTER INSERT ON orders 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('orders', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'orders'; 
    END;
CREATE TRIGGER IF NOT EXISTS orders_ad AFTER DELETE ON orders 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'orders'; 
    END;

CREATE TABLE IF NOT EXISTS genera (
    id INTEGER PRIMARY KEY, 
    genus TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TRIGGER IF NOT EXISTS genera_ai AFTER INSERT ON genera 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('genera', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'genera'; 
    END;
CREATE TRIGGER IF NOT EXISTS genera_ad AFTER DELETE ON genera 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'genera'; 
    END;

CREATE TABLE IF NOT EXISTS families (
    id INTEGER PRIMARY KEY, 
    family TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TRIGGER IF NOT EXISTS families_ai AFTER INSERT ON families 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('families', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'families'; 
    END;
CREATE TRIGGER IF NOT EXISTS families_ad AFTER DELETE ON families 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'families'; 
    END;

CREATE TABLE IF NOT EXISTS species (
    id INTEGER PRIMARY KEY, 
    species TEXT UNIQUE ON CONFLICT IGNORE
);

CREATE TRIGGER IF NOT EXISTS species_ai AFTER INSERT ON species 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('species', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'species'; 
    END;
CREATE TRIGGER IF NOT EXISTS species_ad AFTER DELETE ON species 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'species'; 
    END;