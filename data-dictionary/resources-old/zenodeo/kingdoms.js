export const dictKingdoms = [
    {
        name: 'id',
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the kingdom',
        },
        isResourceId: true,
        sqltype: 'INTEGER',
        notDefaultCol: true
    },
    {
        name: 'q',
        alias: {
            select: 'fa.kingdoms.kingdom',
            where : 'fa.kingdoms.kingdom'
        },
        schema: {
            type: 'string',
            description: 'The name of the kingdom'
        },
        sqltype: 'TEXT',
        defaultOp: 'starts_with'
    }
]