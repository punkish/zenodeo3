'use strict'

module.exports = [
    {
        name: 'figureCitationId',
        type: 'resourceId',
        description: 'The unique ID of the figureCitation',
        sqltype: 'TEXT NOT NULL UNIQUE',
        cheerio: '$("figureCitation").attr("id")',
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
        name: 'captionText',
        type: 'fts',
        description: 'The full text of the figure cited by this treatment',
        sqltype: 'TEXT',
        cheerio: '$("figureCitation").attr("captionText")',
        defaultCols: true,
        defaultOp: 'match',
        where: 'vfigurecitations',
        join: 'vfigurecitations ON figureCitations.figureCitationId = vfigurecitations.figureCitationId'
    },

    {
        name: 'httpUri',
        type: 'uri',
        description: 'The URI of the figure cited by this treatment',
        sqltype: 'TEXT',
        cheerio: '$("figureCitation").attr("httpUri")',
        defaultCols: true
    },

    {
        name: 'thumbnailUri',
        type: 'uri',
        description: 'The URI of the thumbnail figure cited by this treatment',
        sqltype: 'TEXT',
        cheerio: '$("figureCitation").attr("httpUri")',
        defaultCols: true
    }
]