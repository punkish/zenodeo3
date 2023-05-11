export const dictCollectionCodes = [
    {
        name: 'collectionCode',
        schema: {
            type: 'string',
            description: `The collection code for a natural history collection. Can use the following syntax:
- \`collectionCode=USNM\`
- \`collectionCode=starts_with(US)\`
**Note:** queries involving inexact matches will be considerably slow`,
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
            select: 'gb.institutions.institution_name',
            where : 'gb.institutions.institution_name'
        },
        sqltype: 'TEXT',
        joins: {
            select: [ 
                'LEFT JOIN gb.institutions ON mc.collectionCodes.collectionCode = gb.institutions.institution_code' 
            ],
            where : [ 
                'LEFT JOIN gb.institutions ON mc.collectionCodes.collectionCode = gb.institutions.institution_code' 
            ]
        }
    }
]