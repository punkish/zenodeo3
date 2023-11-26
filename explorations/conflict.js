'use strict';

import Chance from 'chance';
const chance = Chance();

import Database from 'better-sqlite3';

// , { verbose: console.log }
// const db = new Database(":memory:");
// const db1 = new Database('./withGuid.sqlite');
// const db2 = new Database('./withInts.sqlite');


const testBind = () => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS classes (
            id INTEGER PRIMARY KEY,
            class TEXT NOT NULL UNIQUE COLLATE NOCASE
        )
    `).run();

    const stmt = db.prepare(`
        INSERT INTO classes (class)
        VALUES (?)
        ON CONFLICT (class) DO
            UPDATE SET id = id
            RETURNING id
    `);

    const data = [
        { class: 'foo' },
        { class: 'bar' },
        { class: 'baz' },
        { class: 'bar' }
    ];

    for (const row of data) {
        const res = stmt.get(row.class);
        if (res) {
            const { id } = res;
            console.log(`id: ${id}, class: ${row.class}`);
        }
    }

    const res = db.prepare(`SELECT * FROM classes`).all();
    console.log(res);
}

const testCase1 = () => {

    // tables that have related fts need to have a rowid to make JOINs, so they 
    // need 'id INTEGER PRIMARY KEY'. For example, table 'treatments'
    db.prepare(`
        CREATE TABLE IF NOT EXISTS treatments (
            id INTEGER PRIMARY KEY,
            treatmentId TEXT NOT NULL UNIQUE ON CONFLICT IGNORE,
            someText TEXT,
            year INTEGER
        )
    `).run();

    // a normal insert
    const stmt = db.prepare(`
        INSERT INTO treatments (treatmentId, someText, year) 
        VALUES (@treatmentId, @someText, @year)
        ON CONFLICT (treatmentId) 
            DO UPDATE
            SET 
                someText = excluded.someText,
                year = excluded.year
    `);

    const rows = [

        // insert two values
        { 
            treatmentId: 'one', 
            someText: chance.sentence({words: 4}), 
            year: chance.year() 
        },
        { 
            treatmentId: 'two', 
            someText: chance.sentence({words: 4}), 
            year: chance.year() 
        },
    
        // a few days later, insert two more, but one of them is a revision of an 
        // existing value, so we want to change what has changed, but keep the PK 
        // unchanged
        { 
            treatmentId: 'one', 
            someText: chance.sentence({words: 4}), 
            year: chance.year() 
        },
        { 
            treatmentId: 'thr', 
            someText: chance.sentence({words: 4}), 
            year: chance.year() 
        }
    ];
    
    for (const row of rows) {
        stmt.run(row);
    }
    
    const res = db.prepare(`
        SELECT * FROM treatments
    `).all();
    
    printResults(rows, res);
}

const testCase2 = () => {

    // tables that don't have related fts but also don't have any column 
    // suitable for PRIMARY KEY also need '<table>Id INTEGER PRIMARY KEY'. For 
    // example, tables 'journals' or 'classes'. This is esp true for PKs that 
    // will be used as FKs in another table
    db.prepare(`
    CREATE TABLE IF NOT EXISTS journals (
        journalId INTEGER PRIMARY KEY,
        journalName TEXT NOT NULL UNIQUE COLLATE NOCASE 
    )
    `).run();

    // an insert returning id
    const stmt = db.prepare(`
        INSERT INTO journals (journalName) 
        VALUES (@journalName)
        ON CONFLICT (journalName) 
            DO UPDATE
            SET 
                journalName = excluded.journalName
            RETURNING journalId
    `);

    const journalName = chance.sentence({words: 4});

    const rows = [

        // insert two values
        { journalName: chance.sentence({words: 4}) },
        { journalName: journalName },
    
        // a few days later, insert two more, but one of them is an existing 
        // value, so we want to keep it unchanged but get its id back
        { journalName: journalName },
        { journalName: chance.sentence({words: 4}) },
    ];
    
    for (const row of rows) {
        const { journalId } = stmt.get(row);
        console.log(`journalId: ${journalId}, journalName: ${row.journalName}`);
    }
    
    const res = db.prepare(`
        SELECT * FROM journals
    `).all();
    
    printResults(rows, res);
}

const testCase3 = () => {

    // tables that don't have related fts but have a column suitable for  
    // primary key can be 'WITHOUT rowid' esp if they will not be used as FK
    // anywhere else
    db.prepare(`
    CREATE TABLE IF NOT EXISTS treatmentCitations (
        treatmentCitationId TEXT NOT NULL UNIQUE PRIMARY KEY,
        someText TEXT,
        year INTEGER
    ) WITHOUT rowid
    `).run();

    // a normal insert 
    const stmt = db.prepare(`
        INSERT INTO treatmentCitations (treatmentCitationId, someText, year) 
        VALUES (@treatmentCitationId, @someText, @year)
        ON CONFLICT (treatmentCitationId) 
            DO UPDATE
            SET 
                someText = excluded.someText,
                year = excluded.year
    `);

    const rows = [

        // insert two values
        { 
            treatmentCitationId: 'one', 
            someText: chance.sentence({words: 4}), 
            year: chance.year() 
        },
        { 
            treatmentCitationId: 'two', 
            someText: chance.sentence({words: 4}), 
            year: chance.year() 
        },
    
        // a few days later, insert two more, but one of them is a revision of an 
        // existing value, so we want to change what has changed, but keep the PK 
        // unchanged
        { 
            treatmentCitationId: 'one', 
            someText: chance.sentence({words: 4}), 
            year: chance.year() 
        },
        { 
            treatmentCitationId: 'thr', 
            someText: chance.sentence({words: 4}), 
            year: chance.year() 
        }
    ];
    
    for (const row of rows) {
        stmt.run(row);
    }
    
    const res = db.prepare(`
        SELECT * FROM treatmentCitations
    `).all();
    
    printResults(rows, res);
}

const printResults = (rows, res) => {
    console.log('-'.repeat(50));
    console.log('inserted');
    console.log('='.repeat(50));
    console.table(rows);
    console.log('-'.repeat(50));
    console.log('got');
    console.table(res);
    console.log('*'.repeat(50));
}

const withInts = () => {

    // table with guid
    db1.prepare(`
        CREATE TABLE IF NOT EXISTS withGuid (
            treatmentId TEXT NOT NULL UNIQUE
        )
    `).run();

    db2.prepare(`
        CREATE TABLE IF NOT EXISTS withInts (
            treatmentId INTEGER PRIMARY KEY
        )
    `).run();

    // a normal insert
    const stmt1 = db1.prepare(`
        INSERT INTO withGuid (treatmentId) 
        VALUES (@treatmentId)
    `);

    const stmt2 = db2.prepare(`
        INSERT INTO withInts (treatmentId) 
        VALUES (@treatmentId)
    `);

    [...Array(800000).keys()].forEach(i => {
        stmt1.run({ treatmentId: chance.word({length: 32}) });
        stmt2.run({ treatmentId: i })
    });
}

// testCase1();
// testCase2();
// testCase3();
// withInts();
testBind();