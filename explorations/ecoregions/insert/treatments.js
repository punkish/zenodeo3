import { db } from '../dbconn.js';

function tr() {
    console.log('insert data in table treatments');

    const sql = `INSERT INTO treatments ( treatment ) 
    VALUES ( @treatment )`;

    const insert = db.prepare(sql);

    const data = [
        { treatment: 'one treatment' },
        { treatment: 'two treatment' },
        { treatment: 'three treatment' }
    ];


    const insertMany = db.transaction((data) => {
        for (const row of data) insert.run(row);
    });

    insertMany(data);
}

export { tr }