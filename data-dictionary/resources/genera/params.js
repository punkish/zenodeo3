export const params = [
    {
        name: 'id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        },
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the genus',
        },
        isResourceId: true
    },
    {
        name: 'genus',
        schema: {
            type: 'string',
            description: 'The name of the genus'
        },
        sql: {
            desc: 'The higher category of the taxonomicName',
            type: 'TEXT UNIQUE NOT NULL COLLATE NOCASE'
        },
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("genus")'
    },
    // {
    //     name: 'q',
    //     selname: 'genera.genus',
    //     schema: {
    //         type: 'string',
    //         description: 'The name of the genus'
    //     },
    //     defaultCol: false,
    //     defaultOp: 'starts_with'
    //     // sql: {
    //     //     desc: 'The higher category of the taxonomicName',
    //     //     type: 'TEXT UNIQUE NOT NULL COLLATE NOCASE'
    //     // },
    //     //cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("genus")'
    // }
]