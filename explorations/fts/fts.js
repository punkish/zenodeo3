'use strict';

import Chance from 'chance';
const chance = Chance();

import { open } from 'node:fs/promises';


import Database from 'better-sqlite3';
const dbFts = new Database('./fts.sqlite');
const dbFtsExt1 = new Database('./ftsExt1.sqlite');
const dbFtsExt2 = new Database('./ftsExt2.sqlite');
const dbFtsExt3 = new Database('./ftsExt3.sqlite');

const createTables = () => {
    
    const stmTable = `
    CREATE TABLE t (
        id INTEGER PRIMARY KEY,
        title TEXT,
        line TEXT
    )`;

    dbFts.prepare(stmTable).run();

    dbFts.prepare(`
        CREATE VIRTUAL TABLE tFts USING fts5 (
            line
        )
    `).run();
    
    dbFts.prepare(`
        CREATE TRIGGER t_aftIns 
        AFTER INSERT ON t 
        BEGIN
            INSERT INTO tFts(
                rowid,
                line
            ) 
            VALUES (
                new.id,
                new.line
            );
        END; 
    `).run();

    dbFtsExt1.prepare(stmTable).run();

    dbFtsExt1.prepare(`
        CREATE VIRTUAL TABLE tFtsExt USING fts5 (
            line, 
            content='t', 
            content_rowid='id'
        )
    `).run();

    dbFtsExt1.prepare(`
        CREATE TRIGGER t_aftIns 
        AFTER INSERT ON t 
        BEGIN
            INSERT INTO tFtsExt( line ) 
            VALUES ( new.line );
        END; 
    `).run();

    dbFtsExt2.prepare(stmTable).run();

    dbFtsExt2.prepare(`
        CREATE VIRTUAL TABLE tFtsExt USING fts5 (
            title,
            line, 
            content='t', 
            content_rowid='id'
        )
    `).run();

    dbFtsExt2.prepare(`
        CREATE TRIGGER t_aftIns 
        AFTER INSERT ON t 
        BEGIN
            INSERT INTO tFtsExt( title, line ) 
            VALUES ( new.title, new.line );
        END; 
    `).run();

    dbFtsExt3.prepare(stmTable).run();

    dbFtsExt3.prepare(`
        CREATE VIRTUAL TABLE tFtsExt USING fts5 (
            title UNINDEXED,
            line, 
            content='t', 
            content_rowid='id'
        )
    `).run();

    dbFtsExt3.prepare(`
        CREATE TRIGGER t_aftIns 
        AFTER INSERT ON t 
        BEGIN
            INSERT INTO tFtsExt( title, line ) 
            VALUES ( new.title, new.line );
        END; 
    `).run();
}

const insertData = async () => {
    const s = `
    INSERT INTO t (title, line)
    VALUES (@title, @line)
    `;

    const stmtFts = dbFts.prepare(s);
    const stmtFtsExt1 = dbFtsExt1.prepare(s);
    const stmtFtsExt2 = dbFtsExt2.prepare(s);
    const stmtFtsExt3 = dbFtsExt3.prepare(s);

    const file = await open('./hard-times.txt');

    // How to read a text file line by line in JavaScript?
    // https://stackoverflow.com/a/74322454/183692
    for await (const line of file.readLines()) {
        const row = {
            title: chance.sentence({ words: 5 }),
            line
        };

        stmtFts.run(row);
        stmtFtsExt1.run(row);
        stmtFtsExt2.run(row);
        stmtFtsExt3.run(row);

    }
}

const selectData = () => {
    const q = 'whelp';

    const resFts = dbFts.prepare(`
    SELECT t.id, t.title, snippet(tFts, 0, '<b>', '</b>', '…', 25) AS snip 
    FROM t JOIN tFts ON t.id = tFts.rowid
    WHERE tFts.line MATCH ?`).get(q);

    const resFtsExt1 = dbFtsExt1.prepare(`
    SELECT t.id, t.title, snippet(tFtsExt, 0, '<b>', '</b>', '…', 25) AS snip
    FROM t JOIN tFtsExt ON t.id = tFtsExt.rowid
    WHERE tFtsExt.line MATCH ?`).get(q);

    const resFtsExt2 = dbFtsExt2.prepare(`
    SELECT rowid, title, snippet(tFtsExt, 1, '<b>', '</b>', '…', 25) AS snip
    FROM tFtsExt
    WHERE line MATCH ?`).get(q);

    const resFtsExt3 = dbFtsExt3.prepare(`
    SELECT rowid, title, snippet(tFtsExt, 1, '<b>', '</b>', '…', 25) AS snip
    FROM tFtsExt
    WHERE line MATCH ?`).get(q);

    console.log('FTS')
    console.log('-'.repeat(50));
    console.log(resFts);
    console.log('='.repeat(50));
    console.log('FTS External Content1')
    console.log('-'.repeat(50));
    console.log(resFtsExt1);
    console.log('='.repeat(50));
    console.log('FTS External Content2')
    console.log('-'.repeat(50));
    console.log(resFtsExt2);
    console.log('='.repeat(50));
}
    
//createTables();
await insertData();
//selectData();