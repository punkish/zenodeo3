export const dictKeywords = [
    {
        name: 'id',
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the keyword',
        },
        isResourceId: true,
        sqltype: 'INTEGER',
        notDefaultCol: true
    },
    {
        name: 'q',
        alias: {
            select: 'fa.keywords.keyword',
            where : 'fa.keywords.keyword'
        },
        schema: {
            type: 'string',
            description: 'The keyword'
        },
        sqltype: 'TEXT',
        defaultOp: 'starts_with'
    }
]