export const dictGenera = [
    {
        name: 'id',
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the genus',
        },
        isResourceId: true,
        sqltype: 'INTEGER',
        notDefaultCol: true
    },
    {
        name: 'q',
        alias: {
            select: 'fa.genera.genus',
            where : 'fa.genera.genus'
        },
        schema: {
            type: 'string',
            description: 'The name of the genus'
        },
        sqltype: 'TEXT',
        defaultOp: 'starts_with'
    }
]