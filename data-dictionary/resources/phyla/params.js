export const params = [
    {
        name: 'id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        },
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the phylum',
        },
        isResourceId: true
    },
    {
        name: 'phylum',
        schema: {
            type: 'string',
            description: 'The name of the phylum'
        },
        sql: {
            desc: 'The higher category of the taxonomicName',
            type: 'TEXT UNIQUE NOT NULL COLLATE NOCASE'
        },
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("phylum")'
    }
]