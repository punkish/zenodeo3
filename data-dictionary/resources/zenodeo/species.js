export const dictSpecies = [
    {
        name: 'id',
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the species',
        },
        isResourceId: true,
        sqltype: 'INTEGER',
        notDefaultCol: true
    },
    {
        name: 'q',
        alias: {
            select: 'fa.species.species',
            where : 'fa.species.species'
        },
        schema: {
            type: 'string',
            description: 'The name of the species'
        },
        sqltype: 'TEXT',
        defaultOp: 'starts_with'
    }
]