'use strict'

module.exports = [
    {
        name: 'collectionCode',
        schema: {
            type: 'string',
            description: 'The collection code for a natural history collection',
            isResourceId: true
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("collectionCode")',
        defaultCols: true,
        //join: [ 'z3collections.institutions ON collectionCode = institution_code' ]
    },
    {
        name: 'institution_name',
        schema: {
            type: 'string',
            description: 'The name of the institution that houses the collection',
        },
        sqltype: 'TEXT',
        //defaultCols: true,
        joins: {
            select: [ 'LEFT JOIN z3collections.institutions ON collectionCode = institution_code' ],
            where : [ 'LEFT JOIN z3collections.institutions ON collectionCode = institution_code' ]
        }
    }
]