import { dbmat } from '../dbconn.js';

function tr() {
    console.log('insert data in table treatments');

    const sql = `INSERT INTO treatments ( treatment ) 
    VALUES ( @treatment )`;

    const insert = dbmat.prepare(sql);

    const data = [
        { treatment: 'one treatment' },
        { treatment: 'two treatment' },
        { treatment: 'three treatment' }
    ];


    const insertMany = dbmat.transaction((data) => {
        for (const row of data) insert.run(row);
    });

    insertMany(data);
}

export { tr }