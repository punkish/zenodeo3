'use strict';

import Database from 'better-sqlite3';
const db = new Database('./frequencies.sqlite');
import Chance from 'chance';
import process from 'node:process';

// get a random integer between min (inclusive) and less than max (exclusive)
const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

// create a list of journals
const createListOfJournals = (num) => {
    console.log(`making ${num} journals`);
    const chance = new Chance();
    const journals = [];

    for (let i = 0; i < num; i++) {
        journals.push(chance.sentence({ words: 5 }));
    }

    console.log(`- made ${journals.length} journals`);
    return journals;
}

const createListOfTreatments = (num, journals) => {
    console.log(`making ${num} treatments`);
    const chance = new Chance();
    const treatments = [];
    const numOfJournals = journals.length;

    for (let i = 0; i < num; i++) {
        treatments.push({
            treatmentId: chance.guid(),
            journalTitle: journals[getRandomInt(0, numOfJournals)],
            journalYear: chance.year({min: 1800, max: 2023})
        });
    }

    console.log(`- made ${treatments.length} treatments`);
    return treatments;
}

const createTables = () => {
    console.log('turning on foreign key support');
    db.prepare('PRAGMA foreign_keys = ON').run();

    console.log('creating table treatments');
    db.prepare(`CREATE TABLE IF NOT EXISTS treatments (
        id INTEGER PRIMARY KEY,
        treatmentId TEXT UNIQUE NOT NULL,
        journalId INTEGER,
        journalYear INTEGER,
        FOREIGN KEY(journalId) REFERENCES journals(journalId)
    )`).run();

    console.log('creating table journals');
    db.prepare(`CREATE TABLE IF NOT EXISTS journals (
        journalId INTEGER PRIMARY KEY,
        journalTitle TEXT UNIQUE NOT NULL
    )`).run();

    console.log('creating journals_x_years table');
    db.prepare(`CREATE TABLE IF NOT EXISTS journal_x_year (
        id INTEGER PRIMARY KEY,
        journalId INTEGER NOT NULL,
        journalYear INTEGER NOT NULL,
        num INTEGER NOT NULL,
        FOREIGN KEY(journalId) REFERENCES journals(journalId),
        UNIQUE(journalId, journalYear)
    )`).run();

    console.log('creating trigger for journals_x_years table');
    db.prepare(`CREATE TRIGGER IF NOT EXISTS aft_ins_treatments 
    AFTER INSERT ON treatments 
    BEGIN
        INSERT INTO journal_x_year ( journalId, journalYear, num )
        VALUES ( new.journalId, new.journalYear, 1 )
        ON CONFLICT(journalId, journalYear) 
        DO UPDATE SET num = num + 1;
    END;`).run();
}

const insertData = (data) => {

    const statements = [
        'INSERT OR IGNORE INTO journals (journalTitle) VALUES (@journalTitle)',
        'SELECT journalId FROM journals WHERE journalTitle = @journalTitle',
        `INSERT INTO treatments ( treatmentId, journalId, journalYear )
        VALUES ( @treatmentId, @journalId, @journalYear )`
    ].map(sql => db.prepare(sql));
    
    const myTransaction = db.transaction((rows) => {

        for (const row of rows) { 

            for (const stmt of statements) {
                if (stmt.reader) {
                    row.journalId = stmt.get(row).journalId;
                }
                else {
                    stmt.run(row);
                }
            }

        }

    })
    
    const batch = 10000;
    const dataLength = data.length;
    console.log(`inserting ${dataLength} treatments ${batch} at a time`);
    const startTime = process.hrtime.bigint();
    let i = 0;
    let count = 0;

    for (; i < dataLength; i = i + batch) {
        count++;
        const arr = data.slice(i, i + batch);
        const startTime = process.hrtime.bigint();
        myTransaction(arr);
        const took = Number(process.hrtime.bigint() - startTime) / 1e6;
        console.log(`- batch ${count}: ${arr.length} rows took ${took} ms`)
    }
    
    const took = Number(process.hrtime.bigint() - startTime) / 1e6;
    console.log(`The whole process took ${took} ms`);
}

const createBaseTables = () => {
    console.log(`creating base table`);

    db.prepare(`CREATE TABLE IF NOT EXISTS t (
        id INTEGER PRIMARY KEY,
        journal TEXT,
        year INTEGER
    )`).run();
}

const loadBaseTable = (num_entries) => {
    console.log(`loading ${num_entries} entries into the base table`);
    const sql = `INSERT INTO t (journal, year) VALUES (@journal, @year)`;
    const s = db.prepare(sql);

    // get 100 journals
    const num_journals = 100;
    const journals = getListOfJournals(num_journals);

    for (let i = 0; i < num_entries; i++) {

        s.run({
            journal: journals[ getRandomInt(0, num_journals) ],
            year: getRandomInt(1800, 2023)
        });

    }
}

const getYears = () => db.prepare(`SELECT DISTINCT year FROM t`).all();

const makePivotTable = () => {
    console.log(`making pivot table`);
    console.log('- getting years');
    const years = getYears();

    console.log('- constructing lines');
    const lines = years
        .map(y => `Count(year) FILTER (WHERE year = ${y.year}) AS "${y.year}"`)
        .join(", ");

    console.log('- creating the table');
    const sql = `CREATE TABLE IF NOT EXISTS journalFrequencies AS 
    SELECT journal, ${lines} 
    FROM t 
    GROUP BY journal`;
    db.prepare(sql).run();
}

const selectFrequencies = (journal) => {
    console.log(`selecting frequencies for journal '${journal}'`);    
    return db.prepare(`SELECT * FROM journalFrequencies WHERE journal = @journal`)
        .all({ journal });
    //fs.writeFileSync('freq.json', JSON.stringify(res2));
}

const getRandomJournal = (journal) => {
    const maxId = db.prepare('SELECT Max(id) AS maxId FROM t').get().maxId;
    const id = getRandomInt(1, maxId);
    return db.prepare(`SELECT journal FROM t WHERE id = @id`)
        .get({ id });
}

const getJournalsForYear = (year) => {

}

// createBaseTable();
// loadBaseTable(10000);
// makePivotTable();
// const journal = getRandomJournal().journal;
// const frequencies = selectFrequencies(journal);
// console.log(frequencies);

// input: journalId
// output: journalTitle

const repackageTreatment = (treatment) => {
    
    /**
     * Object.values(dbs) is [ treatments, treatmentcitations … ]
     */
    const dbs = databases.attached;
    Object.values(dbs).forEach(schema => {

        /**
         * schema is { tables, indexes, triggers }
         */
        const tables = schema.tables;
        tables.forEach(t => {
            if (t.type === 'normal') {

                /**
                 * note the name of the table is 
                 * 'treatments' (plural) 
                 */ 
                if (t.name === 'treatments') {
                    t.data.push(treatment.treatment);
                }
                else {
                    if (treatment[t.name].length) {
                        t.data.push(...treatment[t.name]);
                    }
                }
            }
        })
    })
    
}

createTables();
const journals = createListOfJournals(800);
const treatments = createListOfTreatments(1000000, journals);
insertData(treatments);


// create an array with 5000 elements
// const arr = [ ...Array(5010).keys() ];
// const batch = 500;
// let count = 0;
// let i = 0;
// const j = arr.length;

// for (; i < j; i = i + batch) {
//     count++;
//     const a = arr.slice(i, i + batch);
//     console.log(`- batch ${count}: from ${i} to ${i + batch}: ${a.length}`);
// }