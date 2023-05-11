export const params = [
    {
        name: 'id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        },
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the family',
        },
        isResourceId: true,
        sqltype: 'INTEGER',
        notDefaultCol: true
    },
    {
        name: 'family',
        schema: {
            type: 'string',
            description: 'The name of the family'
        },
        sql: {
            desc: 'The higher category of the taxonomicName',
            type: 'TEXT UNIQUE NOT NULL COLLATE NOCASE'
        },
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("family")'
    }
]