import Database from "better-sqlite3";
const dir = './explorations/fts/data/tmp';
const db = new Database(`${dir}/source.sqlite`);
// db.prepare(`ATTACH '${dir}/sourceFts.sqlite' AS fts`).run();

function createTables() {
    db.prepare(`
CREATE TABLE IF NOT EXISTS t (
    id INTEGER PRIMARY KEY, 
    a TEXT, 
    b TEXT
)`).run();

    db.prepare(`
CREATE VIRTUAL TABLE IF NOT EXISTS tFts USING fts5 (
    a UNINDEXED,
    b
)`).run();

    db.prepare(`
CREATE VIRTUAL TABLE IF NOT EXISTS tFtsTri USING fts5 (
    a UNINDEXED,
    b,
    tokenize='trigram'
)`).run();

    db.prepare(`
CREATE VIRTUAL TABLE tFtsVocab USING fts5vocab(
    'tFts', 
    'instance'
)`).run();

    db.prepare(`
CREATE TEMP TRIGGER IF NOT EXISTS ins AFTER INSERT ON t 
BEGIN
    INSERT INTO tFts(a, b) 
    VALUES (new.a, new.b);

    INSERT INTO tFtsTri(a, b) 
    VALUES (new.a, new.b);
END;`).run();

    db.prepare(`
CREATE TEMP TRIGGER IF NOT EXISTS upd AFTER UPDATE ON t 
BEGIN
    UPDATE tFts
    SET a = new.a, b = new.b
    WHERE tFts.rowid = old.id;

    UPDATE tFtsTri
    SET a = new.a, b = new.b
    WHERE tFtsTri.rowid = old.id;
END;`).run();

    db.prepare(`
CREATE TEMP TRIGGER IF NOT EXISTS del AFTER DELETE ON t 
BEGIN
    DELETE FROM tFts
    WHERE tFts.rowid = old.id;

    DELETE FROM tFtsTri
    WHERE tFtsTri.rowid = old.id;
END;`).run();
}

function populateTables() {
    db.prepare(`
INSERT INTO t (a, b) 
VALUES 
    ('foo', 'once upon a time in a tavern'),
    ('bar', 'those were the days my friend'),
    ('baz', 'una paloma blanca'),
    ('qux', 'I am just a bird in the sky')
    `).run();
}

function selects() {
    let res = db.prepare(`
SELECT a, snippet(tFts, 1, '<b>', '</b>', '…', 20) AS snip
FROM tFts
WHERE tFts.b MATCH 'paloma'`).all();
    console.table(res);

    res = db.prepare(`
SELECT a, snippet(tFtsTri, 1, '<b>', '</b>', '…', 20) AS snip
FROM tFtsTri
WHERE tFtsTri.b LIKE '%bir%'`).all();
    console.table(res);

    res = db.prepare(`
SELECT Count(doc) AS total
FROM tFtsVocab JOIN t ON tFtsVocab.doc = t.id 
WHERE term = 'the'`).all();
    console.table(res);

    res = db.prepare(`SELECT Count() AS num FROM t`).get();
    console.log(`count t: ${res.num}`);

    res = db.prepare(`SELECT Count() AS num FROM tFts`).get();
    console.log(`count tFts: ${res.num}`);

    res = db.prepare(`SELECT Count() AS num FROM tFtsTri`).get();
    console.log(`count tFtsTri: ${res.num}`);
}

function updates() {
    db.prepare(`
UPDATE t
SET b = 'sweeeeet caroline, pum, pum, p-pum'
WHERE id = 4`).run();

    let res = db.prepare(`
SELECT a, snippet(tFts, 1, '<b>', '</b>', '…', 20) AS snip
FROM tFts
WHERE tFts.b LIKE '%bir%'`).all();
    console.table(res);

    res = db.prepare(`SELECT Count() AS num FROM t`).get();
    console.log(`count t: ${res.num}`);

    res = db.prepare(`SELECT Count() AS num FROM tFts`).get();
    console.log(`count tFts: ${res.num}`);

    res = db.prepare(`
SELECT a, snippet(tFtsTri, 1, '<b>', '</b>', '…', 20) AS snip
FROM tFtsTri
WHERE tFtsTri.b LIKE '%pum%'`).all();
    console.table(res);

    res = db.prepare(`SELECT Count() AS num FROM t`).get();
    console.log(`count t: ${res.num}`);

    res = db.prepare(`SELECT Count() AS num FROM tFtsTri`).get();
    console.log(`count tFtsTri: ${res.num}`);
}

function deletes() {
    db.prepare(`
DELETE FROM t
WHERE id = 4`).run();
    
    let res = db.prepare(`
SELECT a, snippet(tFts, 1, '<b>', '</b>', '…', 20) AS snip
FROM tFts
WHERE tFts.b MATCH 'bird'`).all();
    console.table(res);

    res = db.prepare(`SELECT Count() AS num FROM t`).get();
    console.log(`count t: ${res.num}`);

    res = db.prepare(`SELECT Count() AS num FROM tFts`).get();
    console.log(`count tFts: ${res.num}`);
}

createTables();
populateTables();
selects();
updates();
deletes();