import Database from 'better-sqlite3';
const db = new Database(':memory');

const DATA = [
    {
        "IP15": [
            {
                "humidity": 87,
                "iso": "2022-08-23T12:08:01.385Z",
                "location": "Garage",
                "temperature": 23.1,
                "timestamp": 1661256481
            }
        ]
    },

    {
        "IP25": [
            {
                "humidity": 12.1,
                "iso": "2022-08-23T12:10:55.634Z",
                "location": "Main - Loft",
                "temperature": 24.9,
                "timestamp": 1661256656
            }
        ]
    },

    {
        "IP91": [
            {
                "humidity": 47,
                "iso": "2022-08-23T12:11:42.206Z",
                "location": "En-suite ( Ceiling )",
                "temperature": 27.1,
                "timestamp": 1661256702
            }
        ]
    },

    {
        "IP90": [
            {
                "humidity": 45.6,
                "iso": "2022-08-23T12:07:52.763Z",
                "location": "Small Loft",
                "temperature": 24.5,
                "timestamp": 1661256473
            },
            {
                "humidity": 45.6,
                "iso": "2022-08-23T12:07:52.763Z",
                "location": "Bedroom 4 ( Cupboard )",
                "temperature": 24.5,
                "timestamp": 1661256473
            }
        ]
    }
];

const query = (data) => {
    const table = JSON.stringify(data);
    const sql = `SELECT * FROM json_tree('${table}', '$[3]')`;
    const res = db.prepare(sql).all();
    console.log(res);
}

query(DATA);