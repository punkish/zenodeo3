export const params = [
    // {
    //     name: 'id',
    //     sql: {
    //         type: 'INTEGER PRIMARY KEY',
    //         desc: 'PK'
    //     }
    // },
    {
        name: 'queryId',
        sql: {
            type: 'TEXT NOT NULL PRIMARY KEY',
            desc: 'md5 hash corresponding to the cached file on disk'
        }
    },
    {
        name: 'search',
        sql: {
            type: 'TEXT NOT NULL UNIQUE',
            desc: 'The query conducted via the web'
        },
        indexed: false
    },
    {
        name: 'sql',
        sql: {
            type: 'TEXT NOT NULL UNIQUE',
            desc: 'The query conducted via the db'
        },
        indexed: false
    },
    {
        name: 'num',
        sql: {
            type: 'INTEGER DEFAULT 1',
            desc: 'Count of queries (how many times this query was performed)'
        },
        indexed: false
    }
]