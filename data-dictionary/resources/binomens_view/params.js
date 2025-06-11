export const params = [
    {
        name: 'genera_id',
        sql: {
            type: 'INTEGER',
            desc: ''
        },
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the genus',
        }
    },
    {
        name: 'species_id',
        sql: {
            type: 'INTEGER',
            desc: ''
        },
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the species',
        }
    },
    {
        name: 'binomen',
        sql: {
            type: "TEXT",
            desc: 'Binomen of the species'
        },
        schema: { 
            type: 'string', 
            description: ''
        },
        defaultSort: 'ASC'
    }
]