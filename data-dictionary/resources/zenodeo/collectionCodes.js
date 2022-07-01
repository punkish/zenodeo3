export const dictionary = [
    {
        name: 'collectionCode',
        schema: {
            type: 'string',
            description: 'The collection code for a natural history collection',
        },
        isResourceId: true,
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("collectionCode")',
    },

    {
        name: 'institution_name',
        schema: {
            type: 'string',
            description: 'The name of the institution that houses the collection',
        },
        alias: {
            select: 'g.institution_name',
            where : 'g.institution_name'
        },
        sqltype: 'TEXT',
        joins: {
            select: [ 
                'LEFT JOIN gbifcollections.institutions g ON collectionCodes.collectionCode = g.institution_code' 
            ],
            where : [ 
                'LEFT JOIN gbifcollections.institutions g ON collectionCodes.collectionCode = g.institution_code' 
            ]
        }
    }
]