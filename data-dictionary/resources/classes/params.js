export const params = [
    {
        name: 'id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        },
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the class',
        },
        isResourceId: true
    },
    {
        name: 'class',
        schema: {
            type: 'string',
            description: '',
        },
        sql: {
            desc: 'The higher category of the taxonomicName',
            type: 'TEXT UNIQUE NOT NULL COLLATE NOCASE'
        },
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("class")'
    },
]