export const params = [
    {
        name: 'treatmentAuthorId',
        schema: {
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the treatmentAuthor. Has to be a 32 character string like: 'EC3D4B08FFADFFCE66FAFA5E334CFA00'`,
        },
        isResourceId: true,
        sql: {
            desc: 'The unique resourceId of the treatmentAuthor',
            type: 'TEXT NOT NULL PRIMARY KEY Check(Length(treatmentAuthorId) = 32)'
        },
        cheerio: '$("treatmentAuthor").attr("id")'
    },
    {
        name: 'treatmentAuthor',
        schema: { 
            type: 'string',
            description: ''
        },
        sql: {
            desc: 'The author of this treatment (author of the article is used if no treatment authority is found)',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: 'mods\\\\:namePart',
        defaultOp: 'starts_with'
    },
    {
        name: 'email',
        schema: { 
            type: 'string',
            description: ''
        },
        sql: {
            desc: 'The email of the author',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: 'mods\\\\:namePart',
        defaultOp: 'starts_with'
    },
    {
        name: 'treatments_id',
        schema: { 
            type: 'integer', 
            description: ''
        },
        sql: {
            desc: 'The ID of the parent treatment (FK)',
            type: 'INTEGER NOT NULL REFERENCES treatments(id)'
        }
    }
]