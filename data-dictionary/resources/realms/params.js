export const params = [
    {
        name: 'id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        },
        isResourceId: true
    },
    {
        name: 'realm',
        schema: { 
            type: 'string', 
            description: ''
        },
        sql: {
            type: 'TEXT',
            desc: 'name of the realm'
        },
        defaultOp: 'starts_with'
    }
]