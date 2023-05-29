export const params = [
    {
        name: 'id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        }
    },
    {
        name: 'typeOfArchive',
        sql: {
            type: "TEXT NOT NULL CHECK (typeOfArchive IN ('yearly', 'monthly', 'weekly', 'daily'))",
            desc: 'One of yearly, monthly, weekly or daily'
        }
    },
    {
        name: 'timeOfArchive',
        schema: { 
            type: 'string', 
            description: ''
        },
        sql: {
            type: 'TEXT NOT NULL',
            desc: 'Date when the archive was created'
        }
    },
    {
        name: 'sizeOfArchive',
        sql: {
            type: 'INTEGER NOT NULL',
            desc: 'Size of the archive in kilobytes'
        }
    }
]