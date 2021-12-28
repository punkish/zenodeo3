const db = {
    name: 'stats',
    alias: 'st'
}

db.tables = [
    {
        name: 'etlstats',
        create: `CREATE TABLE IF NOT EXISTS ${db.alias}.etlstats ( 
            id INTEGER PRIMARY KEY,
            started INTEGER,
            ended INTEGER,
            parsed TEXT
        )`,
        insert: `INSERT INTO ${db.alias}.etlstats (
            started, 
            ended, 
            parsed
        ) 
        VALUES (
            @started, 
            @ended, 
            @parsed
        )`
    },
    {
        name: 'webqueries',
        create: `CREATE TABLE IF NOT EXISTS ${db.alias}.webqueries (
            id INTEGER PRIMARY KEY,
            -- stringified queryObject
            qp TEXT NOT NULL UNIQUE,
            -- counter tracking queries
            count INTEGER DEFAULT 1
        )`
    },
    {
        name: 'sqlqueries',
        create: `CREATE TABLE IF NOT EXISTS ${db.alias}.sqlqueries (
            id INTEGER PRIMARY KEY,
            -- SQL query
            sql TEXT NOT NULL UNIQUE
        )`
    },
    {
        name: 'querystats',
        create: `CREATE TABLE IF NOT EXISTS ${db.alias}.querystats (
            id INTEGER PRIMARY KEY,
            -- Foreign Keys
            webqueries_id INTEGER,
            sqlqueries_id INTEGER,
            -- query performance time in ms
            timeTaken INTEGER,
            -- timestamp of query
            created INTEGER DEFAULT (strftime('%s','now'))
        )`
    }
]

module.exports = db