import { dbmat } from '../dbconn.js';

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

    const insert = dbmat.prepare(sql);

    const data = [
        { 
            materialCitation: 'one materialCitation',
            treatments_id: '1',
            longitude: -5,
            latitude: 10
        },
        { 
            materialCitation: 'two materialCitation',
            treatments_id: '1',
            longitude: 14,
            latitude: 5
        },
        { 
            materialCitation: 'three materialCitation',
            treatments_id: '2',
            longitude: 23,
            latitude: 12
        },
        { 
            materialCitation: 'four materialCitation',
            treatments_id: '3',
            longitude: -5,
            latitude: -10
        },
        { 
            materialCitation: 'five materialCitation',
            treatments_id: '2',
            longitude: -15,
            latitude: -25
        },

        // bad lat long
        { 
            materialCitation: 'six materialCitation',
            treatments_id: '2',
            longitude: -160,
            latitude: '10a.3f'
        },
        { 
            materialCitation: 'seven materialCitation',
            treatments_id: '3',
            longitude: -15,
            latitude: 5
        },
    ];


    const insertMany = dbmat.transaction((data) => {
        for (const row of data) insert.run(row);
    });

    insertMany(data);
}

export { mc }