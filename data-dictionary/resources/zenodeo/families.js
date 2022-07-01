export const dictionary = [
    {
        name: 'id',
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the family',
        },
        isResourceId: true,
        sqltype: 'INTEGER',
        notDefaultCol: true
    },
    {
        name: 'q',
        alias: {
            select: 'families.family',
            where : 'families.family'
        },
        schema: {
            type: 'string',
            description: 'The name of the family'
        },
        sqltype: 'TEXT',
        defaultOp: 'starts_with'
    }
]