'use strict';

const utils = require('../../../lib/utils.js');

const treatmentImages = [
    {
        name: 'id',
        schema: {
            type:"integer",
            description: 'unique identifier of the record',
        },
        isResourceId: true,
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
            description: `The full text of the figure cited by this treatment. Can use the following syntax: 
- \`captionText=spiders\``
        },
        sqltype: 'TEXT',
    },

    {
        name: 'treatmentId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the parent treatment (FK). Has to be a 32 character string like: '000087F6E320FF95FF7EFDC1FAE4FA7B'`
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
        joins: {
            select: [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ],
            where : [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ]
        },
        sqltype: 'TEXT',
        cheerio: '$("document").attr("docTitle")',
        defaultOp: 'starts_with'
    },

    /*
    {
        name: 'treatmentDOI',
        alias: {
            select: 'treatments.treatmentDOI',
            where : 'treatments.treatmentDOI'
        },
        schema: { 
            type: 'string',
            description: `DOI of the treatment (for example, "10.5281/zenodo.275008"):
- \`doi=10.5281/zenodo.275008\``
        },
        joins: {
            select: [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ],
            where : [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ]
        },
        sqltype: 'TEXT',
        cheerio: '$("treatment").attr("ID-DOI")',
        notDefaultCol: true
    },
    */

    {
        name: 'zenodoDep',
        alias: {
            select: 'treatments.zenodoDep',
            where : 'treatments.zenodoDep'
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
        },
        notDefaultCol: true
    },

    {
        name: 'publicationDate',
        alias: {
            select: 'treatments.publicationDate',
            where : 'treatments.publicationDate'
        },
        schema: {
            type: 'string',
            pattern: utils.getPattern('date'),
            description: `The publication date of the treatment. Can use the following syntax: 
- \`publicationDate=eq(2018-1-12)\`
- \`publicationDate=since(2018-12-03)\`
- \`publicationDate=until(2018-03-22)\`
- \`publicationDate=between(2018-03-22 and 2019-12-03)\`

  **Note:** Date is made of yyyy-m?-d?
- yyyy: a four digit year
- m?: one or two digit month
- d?: one or two digit day`,
        },
        joins: {
            select: [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ],
            where : [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ]
        },
        sqltype: 'TEXT',
        zqltype: 'date',
        cheerio: '$("mods\\\\:detail[type=pubDate] mods\\\\:number").text()',
        defaultOp: 'eq',
        notDefaultCol: true
    },

    {
        name: 'checkinTime',
        alias: {
            select: 'treatments.checkinTime',
            where : 'treatments.checkinTime'
        },
        schema: {
            type: 'string',
            pattern: utils.getPattern('date'),
            description: `The time when the article was first uploaded into the system. Can use the following syntax: 
- \`checkinTime=eq(2018-1-12)\`
- \`checkinTime=since(2018-12-03)\`
- \`checkinTime=until(2018-03-22)\`
- \`checkinTime=between(2018-03-22 and 2019-12-03)\`

  **Note1:** Date is made of yyyy-m?-d?
- yyyy: a four digit year
- m?: one or two digit month
- d?: one or two digit day

  **Note2:** Even though this field is called "checkinTime", for now it can be queried only for dates.`,
        },
        joins: {
            select: [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ],
            where : [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ]
        },
        sqltype: 'INTEGER',
        zqltype: 'date',
        cheerio: '$("document").attr("checkinTime")',
        notDefaultCol: true
    },

    {
        name: 'latitude',
        alias: {
            select: 'materialsCitations.latitude',
            where : 'materialsCitations.latitude'
        },
        schema: {
            type: 'number',
            pattern: utils.re.real,
            description: `The geolocation of the treatment.`,
        },
        joins: {
            select: [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ],
            where : [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ]
        },
        notDefaultCol: true
    },

    {
        name: 'longitude',
        alias: {
            select: 'materialsCitations.longitude',
            where : 'materialsCitations.longitude'
        },
        schema: {
            type: 'number',
            pattern: utils.re.real,
            description: `The geolocation of the treatment.`,
        },
        joins: {
            select: [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ],
            where : [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ]
        },
        notDefaultCol: true
    },

    {
        name: 'geolocation',
        schema: {
            type: 'string',
            pattern: utils.getPattern('geolocation'),
            description: `The geolocation of the treatment. Can use the following syntax:
- \`geolocation=within({radius:10, units: 'kilometers', lat:40.00, lng: -120})\`
- \`geolocation=contained_in({lower_left:{lat: -40.00, lng: -120},upper_right: {lat:23,lng:6.564}})\`
`,
        },
        zqltype: 'geolocation',
        notDefaultCol: true,
        joins: {
            select: null,
            where : [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ]
        },
        notDefaultCol: true
    },

    {
        name: 'isOnLand',
        schema: {
            type: 'number',
            description: `True if treatment is on land.`,
        },
        notDefaultCol: true,
        joins: {
            select: [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ],
            where : [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ]
        },
        notDefaultCol: true
    },

    {
        name: 'validGeo',
        schema: {
            type: 'number',
            description: `True if geolocation is valid.`,
        },
        notDefaultCol: true,
        joins: {
            select: [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ],
            where : [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ]
        },
        notDefaultCol: true
    }
]

module.exports = treatmentImages;