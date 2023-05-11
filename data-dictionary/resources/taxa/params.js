export const params = [
    {
        name: 'id',
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the taxon',
        },
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        },
        isResourceId: true
    },
    {
        name: 'taxon',
        schema: {
            type: 'string',
            description: 'The name of the taxon'
        },
        sql: {
            type: 'TEXT NOT NULL UNIQUE COLLATE NOCASE',
            desc: 'Name of taxon'
        }
    }
]