const tables = [
    {
        name: 'etlstats',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS etlstats ( 
            id INTEGER PRIMARY KEY,
            started INTEGER,
            ended INTEGER,
            process TEXT,
            timeOfArchive INTEGER,
            typeOfArchive TEXT,
            result TEXT
        )`,
        insert: `INSERT INTO etlstats (
                started, 
                ended, 
                process,
                timeOfArchive,
                typeOfArchive,
                result
            ) 
            VALUES (
                @started, 
                @ended, 
                @process,
                @timeOfArchive,
                @typeOfArchive,
                @result
            )`,
        preparedinsert: ''
    },
    {
        name: 'webqueries',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS webqueries (
            id INTEGER PRIMARY KEY,
            -- stringified queryObject
            q TEXT NOT NULL UNIQUE,
            -- counter tracking queries
            count INTEGER DEFAULT 1
        )`,
        insert: '',
        preparedinsert: ''
    },
    {
        name: 'sqlqueries',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS sqlqueries (
            id INTEGER PRIMARY KEY,
            -- SQL query
            sql TEXT NOT NULL UNIQUE
        )`,
        insert: '',
        preparedinsert: ''
    },
    {
        name: 'querystats',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS querystats (
            id INTEGER PRIMARY KEY,
            -- Foreign Keys
            webqueries_id INTEGER,
            sqlqueries_id INTEGER,
            -- query performance time in ms
            timeTaken INTEGER,
            -- timestamp of query
            created INTEGER DEFAULT (strftime('%s','now'))
        )`,
        insert: '',
        preparedinsert: ''
    }
]

const indexes = []

module.exports = { tables, indexes }