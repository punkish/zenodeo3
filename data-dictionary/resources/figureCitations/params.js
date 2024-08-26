export const params = [
    {
        name: 'id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        }
    },
    {
        name: 'figureCitationId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `Has to be a 32 character string like: '10922A65E320FF95FC0FFC83FB80FCAA'`,
        },
        isResourceId: true,
        sql: {
            desc: 'The resourceId of the figureCitation',
            type: 'TEXT NOT NULL Check(Length(figureCitationId = 32))'
        },
        cheerio: '$("figureCitation").attr("id")'
    },
    {
        name: 'figureNum',
        schema: { 
            type: 'integer', 
            description: ``
        },
        sql: {
            desc: 'serial number of figure for a figureCitationId and treatmentId combination',
            type: 'INTEGER DEFAULT 0'
        },
        cheerio: '$("figureCitation").attr("figureNum")',
        indexed: false
    },
    {
        name: 'treatments_id',
        schema: { 
            type: 'integer', 
            description: ''
        },
        sql: {
            desc: 'The ID of the parent treatment (FK)',
            type: 'INTEGER NOT NULL REFERENCES treatments("id")'
        },
    },
    {
        name:'_uniq',
        sql: {
            desc: 'unique declaration',
            type: 'UNIQUE ("figureCitationId", "figureNum")'
        }
    }
]