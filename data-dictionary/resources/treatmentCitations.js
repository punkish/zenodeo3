'use strict'

module.exports = [
    {
        name: 'treatmentCitationId',
        type: 'resourceId',
        description: 'The unique ID of the treatmentCitation',
        sqltype: 'TEXT NOT NULL UNIQUE',
        cheerio: '$("treatmentCitation").attr("id")',
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
        name: 'treatmentCitation',
        type: 'string',
        description: 'The taxonomic name and the author of the species, plus the author of the treatment being cited',
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=reference_group] treatmentCitationGroup taxonomicName").text() + " " + $("subSubSection[type=reference_Group] treatmentCitationGroup taxonomicName").attr("authority") + " sec. " + $("subSubSection[type=reference_Group] treatmentCitationGroup bibRefCitation").text()',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'refString',
        type: 'string',
        description: 'The bibliographic reference string of the treatments cited by this treatment',
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=referenceGroup] treatmentCitationGroup treatmentCitation bibRefCitation").attr("refString")',
        defaultCols: true,
        defaultOp: 'starts_with'
    }
]