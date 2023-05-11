export const params = [
    {
        name: 'id',
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the keyword',
        },
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        },
        isResourceId: true
    },
    {
        name: 'keyword',
        schema: {
            type: 'string',
            description: 'The keyword'
        },
        sql: {
            type: 'TEXT NOT NULL UNIQUE COLLATE NOCASE',
            desc: 'keyword'
        }
    }
]