export const params = [
    {
        name: 'id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        }
    },
    {
        name: 'archives_id',
        sql: {
            type: 'INTEGER NOT NULL REFERENCES archives(id)',
            desc: 'FK to archives(id)'
        }
    },
    {
        name: 'started',
        sql: {
            type: 'INTEGER',
            desc: 'start of process in ms'
        }
    },
    {
        name: 'ended',
        sql: {
            type: 'INTEGER',
            desc: 'end of process in ms'
        }
    }
]