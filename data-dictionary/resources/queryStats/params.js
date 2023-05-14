import * as utils from '../../../lib/utils.js';

export const params = [
    {
        name: 'id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        }
    },
    {
        name: 'queries_id',
        sql: {
            type: 'INTEGER NOT NULL REFERENCES queries(id)',
            desc: 'FK to the query'
        }
    },
    {
        name: 'timeTaken',
        sql: {
            type: 'INTEGER NOT NULL',
            desc: 'query performance time in ms'
        },
        indexed: false
    },
    {
        name: 'created',
        sql: {
            type: utils.unixEpochMs(),
            desc: 'timestamp of query'
        },
        indexed: false
    }
]