'use strict'

module.exports = [
    {
        name: 'figureCitationId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the figureCitation. Has to be a 32 character string like: '10922A65E320FF95FC0FFC83FB80FCAA'`,
            isResourceId: true
        },
        sqltype: 'TEXT NOT NULL UNIQUE',
        cheerio: '$("figureCitation").attr("id")'
    },

    {
        name: 'treatmentId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the parent treatment (FK). Has to be a 32 character string like:  '000087F6E320FF95FF7EFDC1FAE4FA7B'`
        },
        sqltype: 'TEXT NOT NULL'
    },

    {
        name: 'figureNum',
        schema: { 
            type: 'integer', 
            description: `serial number of figure for a figureCitationId and treatmentId combination`
        },
        sqltype: 'INTEGER DEFAULT 0',
        cheerio: '$("figureCitation").attr("figureNum")'
    },

    {
        name: 'captionText',
        schema: {
            type: 'string',
            description: `The full text of the figure cited by this treatment. Can use the following syntax: \`captionText=spiders\``
        },
        sqltype: 'TEXT',
        cheerio: '$("figureCitation").attr("captionText")',
        defaultOp: 'match',
        constraint: 'vfigurecitations MATCH @captionText',
        joins: {
            select: null,
            where : [ 'JOIN vfigurecitations ON figureCitations.figureCitationId = vfigurecitations.figureCitationId' ]
        }
    },

    {
        name: 'httpUri',
        schema: {
            type: 'string',
            description: `The URI of the image. Can use the following syntax: 
- \`httpUri=eq(http://example.com)\`
- \`httpUri=ne()\``
        },
        sqltype: 'TEXT',
        cheerio: '$("figureCitation").attr("httpUri")'
    },

    // {
    //     name: 'hasImage',
    //     alias: {
    //         select: "Iif(httpUri = '', 0, 1) AS hasImage",
    //         where : null
    //     },
    //     schema: {
    //         type: 'number',
    //         description: 'true if the record has a valid image'
    //     },
    //     defaultCols: false
    // }
]