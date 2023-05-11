export const dictTaxa = [
    {
        name: 'id',
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the taxon',
        },
        isResourceId: true,
        sqltype: 'INTEGER',
        notDefaultCol: true
    },
    {
        name: 'q',
        alias: {
            select: 'fa.taxa.taxon',
            where : 'fa.taxa.taxon'
        },
        schema: {
            type: 'string',
            description: 'The name of the taxon'
        },
        sqltype: 'TEXT',
        defaultOp: 'starts_with'
    }
]