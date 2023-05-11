export const dictAuthors = [
    {
        name: 'id',
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the author',
        },
        isResourceId: true,
        sqltype: 'INTEGER',
        notDefaultCol: true
    },
    {
        name: 'q',
        alias: {
            select: 'fa.authors.author',
            where : 'fa.authors.author'
        },
        schema: {
            type: 'string',
            description: 'The author'
        },
        sqltype: 'TEXT',
        defaultOp: 'starts_with'
    }
]