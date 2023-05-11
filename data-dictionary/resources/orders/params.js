export const params = [
    {
        name: 'id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        },
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the order',
        },
        isResourceId: true
    },
    {
        name: 'order',
        schema: {
            type: 'string',
            description: 'The name of the order'
        },
        sql: {
            desc: 'The higher category of the taxonomicName',
            type: 'TEXT UNIQUE NOT NULL COLLATE NOCASE'
        },
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("order")'
    }
]