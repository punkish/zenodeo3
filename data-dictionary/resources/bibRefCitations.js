'use strict'

const re = {
    date: '[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}',
    year: '^[0-9]{4}$'
}

module.exports = [
    {
        name: 'bibRefCitationId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the bibRefCitation. Has to be a 32 character string like: 'EC384B11E320FF95FB78F995FEA0F964'`,
            isResourceId: true
        },
        sqltype: 'TEXT NOT NULL UNIQUE',
        cheerio: '$("bibRefCitation").attr("id")',
        defaultCols: true
    },

    {
        name: 'treatmentId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the parent treatment (FK). Has to be a 32 character string like: '000087F6E320FF99FDC9FA73FA90FABE'`
        },
        sqltype: 'TEXT NOT NULL',
        defaultCols: true
    },

    {
        name: 'refString',
        schema: {
            type: 'string',
            description: `The full text of the reference cited by the treatment. Can use the following syntax: \`q=spiders\``
        },
        sqltype: 'TEXT',
        cheerio: '$("bibRefCitation").attr("refString")',
        defaultCols: true,
        defaultOp: 'match',
        where: 'vbibrefcitations',
        join: [ 'JOIN vbibrefcitations ON bibRefCitations.bibRefCitationId = vbibrefcitations.bibRefCitationId' ]
    },

    {
        name: 'type',
        schema: {
            type: 'string',
            description: 'The type of reference cited by the treatment'
        },
        sqltype: 'TEXT',
        cheerio: '$("bibRefCitation").attr("type")',
        defaultCols: true,
        facets: true
    },

    {
        name: 'year',
        schema: {
            type: 'string',
            pattern: re.year,
            description: 'The year of the reference cited by this treatment'
        },
        sqltype: 'TEXT',
        cheerio: '$("bibRefCitation").attr("year")',
        defaultCols: true,
        facets: true
    }
]