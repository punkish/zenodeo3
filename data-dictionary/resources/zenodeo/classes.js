export const dictClasses = [
    {
        name: 'id',
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the class',
        },
        isResourceId: true,
        sqltype: 'INTEGER',
        notDefaultCol: true
    },
    {
        name: 'q',
        alias: {
            select: 'fa.classes.class',
            where : 'fa.classes.class'
        },
        schema: {
            type: 'string',
            description: 'The name of the class'
        },
        sqltype: 'TEXT',
        defaultOp: 'starts_with'
    }
]