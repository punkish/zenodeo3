import { db } from '../dbconn.js';

function mc() {
    console.log('insert data in table materialCitations');

    const sql = `INSERT INTO materialCitations ( 
        materialCitation,
        treatments_id,
        longitude,
        latitude
    ) 
    VALUES ( 
        @materialCitation,
        @treatments_id,
        @longitude,
        @latitude
    )`;

    const insert = db.prepare(sql);

    const data = [
        { 
            materialCitation: 'one materialCitation',
            treatments_id: '1',
            longitude: -3,
            latitude: -11
        },
        { 
            materialCitation: 'two materialCitation',
            treatments_id: '1',
            longitude: -10,
            latitude: -6
        },
        { 
            materialCitation: 'three materialCitation',
            treatments_id: '2',
            longitude: -4,
            latitude: 6
        },
        { 
            materialCitation: 'four materialCitation',
            treatments_id: '3',
            longitude: 14,
            latitude: 5
        },
        { 
            materialCitation: 'five materialCitation',
            treatments_id: '2',
            longitude: 16,
            latitude: 10
        },

        // bad lat long
        { 
            materialCitation: 'six materialCitation',
            treatments_id: '2',
            longitude: -160,
            latitude: '10a.3f'
        }
    ];


    const insertMany = db.transaction((data) => {
        for (const row of data) insert.run(row);
    });

    insertMany(data);
}

export { mc }