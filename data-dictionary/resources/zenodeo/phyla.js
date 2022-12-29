export const dictPhyla = [
    {
        name: 'id',
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the phylum',
        },
        isResourceId: true,
        sqltype: 'INTEGER',
        notDefaultCol: true
    },
    {
        name: 'q',
        alias: {
            select: 'fa.phyla.phylum',
            where : 'fa.phyla.phylum'
        },
        schema: {
            type: 'string',
            description: 'The name of the phylum'
        },
        sqltype: 'TEXT',
        defaultOp: 'starts_with'
    }
]