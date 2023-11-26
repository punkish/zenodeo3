import { db } from '../dbconn.js';

function tr() {
    console.log('creating table treatments');

    const sql = `CREATE TABLE IF NOT EXISTS treatments (
        id INTEGER PRIMARY KEY,
        treatment TEXT
    )`;

    db.prepare(sql).run();
}

export { tr }