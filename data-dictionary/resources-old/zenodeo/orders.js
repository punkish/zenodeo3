export const dictOrders = [
    {
        name: 'id',
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the order',
        },
        isResourceId: true,
        sqltype: 'INTEGER',
        notDefaultCol: true
    },
    {
        name: 'q',
        alias: {
            select: 'fa.orders."order"',
            where : 'fa.orders."order"'
        },
        schema: {
            type: 'string',
            description: 'The name of the order'
        },
        sqltype: 'TEXT',
        defaultOp: 'starts_with'
    }
]