export const params = [
    {
        name: 'journals_id',
        sql: {
            desc: 'FK to journals(id)',
            type: 'INTEGER NOT NULL REFERENCES journals(id)'
        }
    },
    {
        name: 'journalYear',
        schema: { 
            type: 'string',
            description: '',
        },
        sql: {
            desc: 'Year the journal was published',
            type: 'INTEGER NOT NULL'
        }
    },
    {
        name: 'num',
        sql: {
            desc: 'Number of times the journal was processed in a given year',
            type: 'INTEGER NOT NULL'
        },
        indexed: false
    },
    {
        name:'_pk',
        sql: {
            desc: 'Primary Key',
            type: 'PRIMARY KEY ("journals_id", "journalYear")'
        }
    }
]