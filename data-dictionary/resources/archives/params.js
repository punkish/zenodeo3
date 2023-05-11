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
            type: 'integer', 
            description: ''
        },
        sql: {
            type: 'INTEGER NOT NULL',
            desc: 'Time when the archive was created in UTC ms since epoch'
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