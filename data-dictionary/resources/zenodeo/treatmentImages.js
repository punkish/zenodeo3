'use strict';

module.exports = [
    {
        name: 'id',
        schema: {
            type:"integer",
            description: 'unique identifier of the record',
            isResourceId: true
        },
        sqltype: 'INTEGER PRIMARY KEY',
    },

    {
        name: 'httpUri',
        schema: { 
            type: 'string', 
            description: 'The URI of the image'
        },
        sqltype: 'TEXT NOT NULL UNIQUE'
    },

    {
        name: 'captionText',
        schema: { 
            type: 'string', 
            description: `The full text of the figure cited by this treatment. Can use the following syntax: \`captionText=spiders\``
        },
        sqltype: 'TEXT',
    },

    {
        name: 'treatmentId',
        alias: {
            select: 'treatmentImages.treatmentId',
            where : 'treatmentImages.treatmentId'
        },
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the parent treatment (FK). Has to be a 32 character string like:  '000087F6E320FF95FF7EFDC1FAE4FA7B'`
        },
        sqltype: 'TEXT',
    },

    {
        name: 'treatmentTitle',
        alias: {
            select: 'treatments.treatmentTitle',
            where : 'treatments.treatmentTitle'
        },
        schema: { 
            type: 'string',
            description: `Title of the treatment. Can use the following syntax:
- \`treatmentTitle=Ichneumonoidea (Homolobus) Foerster 1863\`
- \`treatmentTitle=starts_with(Ichneumonoidea)\`
- \`treatmentTitle=ends_with(Foerster 1863)\`
- \`treatmentTitle=contains(Homolobus)\`
  **Note:** queries involving inexact matches will be considerably slow`
        },
        sqltype: 'TEXT',
        cheerio: '$("document").attr("docTitle")',
        defaultOp: 'starts_with'
    },

    {
        name: 'zenodoDep',
        alias: {
            select: 'treatments.zenodoDep',
            where : null
        },
        schema: {
            type: 'string',
            description: 'Zenodo record of journal article'
        },
        sqltype: 'TEXT',
        cheerio: '$("document").attr("ID-Zenodo-Dep")',
        notQueryable: true,
        joins: {
            select: [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ],
            where : [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ]
        }
    },

    {
        name: 'q',
        alias: {
            select: "snippet(vtreatments, 1, '<b>', '</b>', '…', 25) snippet",
            where : 'vtreatments'
        },
        schema: {
            type: 'string',
            description: `A snippet extracted from the full text of the treatment. Can use the following syntax: 
- \`q=spiders\``
        },
        sqltype: 'TEXT',
        notDefaultCol: true,
        defaultOp: 'match',
        joins: {
            select: null,
            where : [ 'JOIN vtreatments ON treatmentImages.treatmentId = vtreatments.treatmentId' ]
        }
    },


]