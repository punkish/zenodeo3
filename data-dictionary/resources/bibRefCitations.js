'use strict'

module.exports = [
    {
        name: 'bibRefCitationId',
        type: 'resourceId',
        description: 'The unique ID of the bibRefCitation',
        sqltype: 'TEXT NOT NULL UNIQUE',
        cheerio: '$("bibRefCitation").attr("id")',
        defaultCols: true,
        defaultOp: 'eq',
    },

    {
        name: 'treatmentId',
        type: 'fk',
        description: 'The unique ID of the parent treatment (FK)',
        sqltype: 'TEXT NOT NULL',
        cheerio: '$("document").attr("????")',
        defaultCols: true,
        defaultOp: 'eq',
    },

    {
        name: 'refString',
        type: 'fts',
        description: 'The reference cited by the treatment',
        sqltype: 'TEXT',
        cheerio: '$("bibRefCitation").attr("refString")',
        defaultCols: true,
        defaultOp: 'match',
        where: 'vbibrefcitations',
        join: 'vbibrefcitations ON bibRefCitations.bibRefCitationId = vbibrefcitations.bibRefCitationId'
    },

    {
        name: 'type',
        type: 'string',
        description: 'The type of reference cited by the treatment',
        sqltype: 'TEXT',
        cheerio: '$("bibRefCitation").attr("type")',
        defaultCols: true
    },

    {
        name: 'year',
        type: 'year',
        description: 'TThe year of the reference cited by this treatment',
        sqltype: 'TEXT',
        cheerio: '$("bibRefCitation").attr("year")',
        defaultCols: true
    }
]