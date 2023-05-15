'use strict';

import Chance from 'chance';
const chance = Chance();

import Database from 'better-sqlite3';
const dbFts = new Database('./fts.sqlite');
const dbFtsExt = new Database('./ftsExt.sqlite');
const dbFtsNone = new Database('./ftsNone.sqlite');

const createTables = () => {
    
    const stmTable = `
    CREATE TABLE t (
        id INTEGER PRIMARY KEY,
        title TEXT,
        fulltext TEXT
    )`;

    dbFts.prepare(stmTable).run();

    dbFts.prepare(`
        CREATE VIRTUAL TABLE tFts USING fts5 (
            fulltext
        )
    `).run();
    
    dbFts.prepare(`
        CREATE TRIGGER t_aftIns 
        AFTER INSERT ON t 
        BEGIN
            INSERT INTO tFts(
                rowid,
                fulltext
            ) 
            VALUES (
                new.id,
                new.fulltext
            );
        END; 
    `).run();

    dbFtsExt.prepare(stmTable).run();

    dbFtsExt.prepare(`
        CREATE VIRTUAL TABLE tFtsExt USING fts5 (
            fulltext, 
            content='t', 
            content_rowid='id'
        )
    `).run();

    dbFtsExt.prepare(`
        CREATE TRIGGER t_aftIns 
        AFTER INSERT ON t 
        BEGIN
            INSERT INTO tFtsExt(
                fulltext
            ) 
            VALUES ( 
                new.fulltext
            );
        END; 
    `).run();

    dbFtsNone.prepare(stmTable).run();

    dbFtsNone.prepare(`
        CREATE VIRTUAL TABLE tFtsNone USING fts5 (
            fulltext,
            content=''
        )
    `).run();

    dbFtsNone.prepare(`
        CREATE TRIGGER t_aftIns 
        AFTER INSERT ON t 
        BEGIN
            INSERT INTO tFtsNone(
                rowid, 
                fulltext
            ) 
            VALUES (
                new.id, 
                new.fulltext
            );
        END; 
    `).run();

    
}

const insertData = () => {
    const s = `
    INSERT INTO t (title, fulltext)
    VALUES (@title, @fulltext)
`;

    const stmtFts = dbFts.prepare(s);
    const stmtFtsExt = dbFtsExt.prepare(s);
    const stmtFtsNone = dbFtsNone.prepare(s);

    const data = [...Array(10000).keys()].map(i => {
        return {
            title   : chance.sentence({ words: 5 }),
            fulltext: chance.paragraph({ sentences: 10 })
        }
    });

    data.push(
        {
            title   : 'Overview of FTS5',
            fulltext: 'FTS5 is an SQLite virtual table module that provides full-text search functionality to database applications. In their most elementary form, full-text search engines allow the user to efficiently search a large collection of documents for the subset that contain one or more instances of a search term. The search functionality provided to world wide web users by Google is, among other things, a full-text search engine, as it allows users to search for all documents on the web that contain, for example, the term "fts5".'
        },
        {
            title   : 'Building FTS5 as part of SQLite',
            fulltext: 'As of version 3.9.0 (2015-10-14), FTS5 is included as part of the SQLite amalgamation. If using one of the two autoconf build system, FTS5 is enabled by specifying the "--enable-fts5" option when running the configure script. (FTS5 is currently disabled by default for the source-tree configure script and enabled by default for the amalgamation configure script, but these defaults might change in the future). Or, if sqlite3.c is compiled using some other build system, by arranging for the SQLITE_ENABLE_FTS5 pre-processor symbol to be defined.'
        },
        {
            title   : 'FTS5 Column Filters',
            fulltext: 'A single phrase or NEAR group may be restricted to matching text within a specified column of the FTS table by prefixing it with the column name followed by a colon character. Or to a set of columns by prefixing it with a whitespace separated list of column names enclosed in parenthesis ("curly brackets") followed by a colon character. Column names may be specified using either of the two forms described for strings above. Unlike strings that are part of phrases, column names are not passed to the tokenizer module. Column names are case-insensitive in the usual way for SQLite column names - upper/lower case equivalence is understood for ASCII-range characters only.'
        }
    )

    for (const row of data) {
        stmtFts.run(row);
        stmtFtsExt.run(row);
        stmtFtsNone.run(row);
    }
}

const selectData = () => {
    const q = 'prefixing';

    const resFts = dbFts.prepare(`SELECT t.id, t.title, snippet(tFts, 0, '<b>', '</b>', '…', 25) AS snip 
    FROM t JOIN tFts ON t.id = tFts.rowid
    WHERE tFts.fulltext MATCH ?`).get(q);

    const resFtsExt = dbFtsExt.prepare(`SELECT t.id, t.title, snippet(tFtsExt, 0, '<b>', '</b>', '…', 25) AS snip
    FROM t JOIN tFtsExt ON t.id = tFtsExt.rowid
    WHERE tFtsExt.fulltext MATCH ?`).get(q);

    const resFtsNone = dbFtsNone.prepare(`SELECT t.id, t.title, Substring(t.fulltext, 1, 25) AS snip
    FROM t JOIN tFtsNone ON t.id = tFtsNone.rowid
    WHERE tFtsNone.fulltext MATCH ?`).get(q);

    console.log('FTS')
    console.log('-'.repeat(50));
    console.log(resFts);
    console.log('='.repeat(50));
    console.log('FTS External Content')
    console.log('-'.repeat(50));
    console.log(resFtsExt);
    console.log('='.repeat(50));
    console.log('FTS Contentless')
    console.log('-'.repeat(50));
    console.log(resFtsNone);
    console.log('='.repeat(50));
}
    
createTables();
insertData();
selectData();

// const printResults = (rows, res) => {
//     console.log('-'.repeat(50));
//     console.log('inserted');
//     console.log('='.repeat(50));
//     console.table(rows);
//     console.log('-'.repeat(50));
//     console.log('got');
//     console.table(res);
//     console.log('*'.repeat(50));
// }


