'use strict'

/*
 * All params are queryable unless false
 * Params with 'defaultCols' = true are SELECT-ed by default
 * Param 'type' is looked up in ../definitions.js to create the schema
 * Param 'sqltype' is used in CREATE-ing the db table
 * Param 'sqlname' is used when 'name' is inappropriate for SQL
 */
module.exports = [
    {
        name: 'treatmentId',
        type: 'resourceId',
        description: 'The unique ID of the treatment',
        sqlname: 'treatments.treatmentId',
        sqltype: 'TEXT NOT NULL UNIQUE',
        cheerio: '$("document").attr("docId")',
        defaultCols: true,
        defaultOp: 'eq'
    },

    {
        name: 'treatmentTitle',
        type: 'string',
        description: 'Title of the treatment',
        sqltype: 'TEXT',
        cheerio: '$("document").attr("docTitle")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },
    
    {
        name: 'doi',
        type: 'doi',
        description: 'DOI of journal article (for example, "10.15560/16.5.1159")',
        sqltype: 'TEXT',
        cheerio: '$("document").attr("ID-DOI")',
        defaultCols: true,
        defaultOp: 'eq'
    },

    {
        name: 'zenodoDep',
        type: 'string',
        description: 'Zenodo record of journal article',
        sqltype: 'TEXT',
        cheerio: '$("document").attr("ID-Zenodo-Dep")',
        queryable: false
    },

    {
        name: 'articleTitle',
        type: 'string',
        description: 'The article in which the treatment was published',
        sqltype: 'TEXT',
        cheerio: '$("document").attr("masterDocTitle")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'publicationDate',
        type: 'date',
        description: 'The publication date of the treatment',
        sqltype: 'TEXT',
        cheerio: '$("mods\\\\:detail[type=pubDate] mods\\\\:number").text()',
        defaultCols: true,
        defaultOp: 'eq'
    },

    {
        name: 'journalTitle',
        type: 'string',
        description: 'The journal in which the treatment was published',
        sqltype: 'TEXT',
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:titleInfo mods\\\\:title").text()',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'journalYear',
        type: 'year',
        description: 'The year of the journal',
        sqltype: 'TEXT',
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:date").text()',
        defaultCols: true,
        defaultOp: 'eq'
    },

    {
        name: 'journalVolume',
        type: 'string',
        description: 'The volume of the journal',
        sqltype: 'TEXT',
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:detail[type=volume] mods\\\\:number").text()',
        defaultCols: true,
        defaultOp: 'eq'
    },

    {
        name: 'journalIssue',
        type: 'string',
        description: 'The issue of the journal',
        sqltype: 'TEXT',
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:detail[type=issue] mods\\\\:number").text()',
        defaultCols: true,
        defaultOp: 'eq'
    },

    {
        name: 'pages',
        type: 'string',
        description: 'The "from" and "to" pages where the treatment occurs in the article',
        sqltype: 'TEXT',
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:extent[unit=page] mods\\\\:start").text() + "–" + $("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:extent[unit=page] mods\\\\:end").text()',
        defaultCols: true,
        queryable: false
    },

    {
        name: 'authorityName',
        type: 'string',
        description: 'The author(s) of the treatment (not necessarily the same as the authors of the journal article, but omitted if same as article authors)',
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("authorityName")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'authorityYear',
        type: 'year',
        description: 'The year when the taxon name was published',
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("authorityYear")',
        defaultCols: true,
        defaultOp: 'eq'
    },

    {
        name: 'kingdom',
        type: 'string',
        description: 'The higher category of the taxonomicName',
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("kingdom")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'phylum',
        type: 'string',
        description: 'The higher category of the taxonomicName',
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("phylum")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'order',
        type: 'string',
        description: 'The higher category of the taxonomicName',
        sqlname: '"order"',
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("order")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'family',
        type: 'string',
        description: 'The higher category of the taxonomicName',
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("family")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'genus',
        type: 'string',
        description: 'The higher category of the taxonomicName',
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("genus")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'species',
        type: 'string',
        description: 'The higher category of the taxonomicName',
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("species")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'status',
        type: 'string',
        description: 'The descriptor for the taxonomic status proposed by a given treatment (can be new species, or new combination, or new combination and new synonym)',
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("status")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'taxonomicNameLabel',
        type: 'string',
        description: 'The Taxonomic Name Label of a new species',
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").text()',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'rank',
        type: 'string',
        description: 'The taxonomic rank of the taxon, e.g. species, family',
        sqlname: 'treatments.rank',
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("rank")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'geolocation',
        type: 'geolocation',
        description: 'The geo-location of the treatment',
        join: 'materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId'
    },

    {
        name: 'q',
        type: 'fts',
        description: 'The full text of the treatment',
        sqltype: 'TEXT',
        cheerio: '$("treatment").text()',
        defaultCols: false,
        defaultOp: 'match',
        where: 'vtreatments',
        join: 'vtreatments ON treatments.treatmentId = vtreatments.treatmentId'
    }
    
]