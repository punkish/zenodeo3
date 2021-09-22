'use strict'

const re = {
    date: '[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}',
    year: '^[0-9]{4}$'
}

// see https://github.com/plazi/Plazi-Communications/issues/1044#issuecomment-661246289 
// for notes from @gsautter

/*
 * All params are queryable unless false
 * Params with 'defaultCols' = true are SELECT-ed by default
 * Param 'type' is looked up in ../definitions.js to create the schema
 * Param 'sqltype' is used in CREATE-ing the db table
 * Param 'selname' is used when 'name' is inappropriate for SQL
 */
module.exports = [
    {
        name: 'treatmentId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the treatment. Has to be a 32 character string:
- \`treatmentId=388D179E0D564775C3925A5B93C1C407\``,
            isResourceId: true
        },
        selname: 'treatments.treatmentId',
        sqltype: 'TEXT NOT NULL UNIQUE',
        cheerio: '$("document").attr("docId")',
        defaultCols: true
    },

    {
        name: 'treatmentTitle',
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
        defaultCols: true,
        defaultOp: 'starts_with'
    },
    
    {
        name: 'treatmentVersion',
        schema: { 
            type: 'integer',
            description: 'The version of the treatment (might be lower than the version of the parent article, as not all treatments change in each new version of the article).'
        },
        sqltype: 'INTEGER',
        cheerio: '$("document").attr("docVersion")',
        defaultCols: false
    },

    {
        name: 'treatmentDOI',
        alias: 'doi',
        schema: { 
            type: 'string',
            description: `DOI of the treatment (for example, "10.5281/zenodo.275008"):
- \`doi=10.5281/zenodo.275008\``
        },
        sqltype: 'TEXT',
        cheerio: '$("treatment").attr("ID-DOI")',
        defaultCols: true,
    },

    {
        name: 'treatmentLSID',
        schema: { 
            type: 'string',
            description: `LSID of the treatment (for example, "urn:lsid:plazi:treatment:000B06B02350EF7F0E538C1045DA36A8"):
- \`lsidurn:lsid:plazi:treatment:000B06B02350EF7F0E538C1045DA36A8\``
        },
        sqltype: 'TEXT',
        cheerio: '$("treatment").attr("LSID")',
        defaultCols: true,
    },

    {
        name: 'zenodoDep',
        schema: {
            type: 'string',
            description: 'Zenodo record of journal article'
        },
        sqltype: 'TEXT',
        cheerio: '$("document").attr("ID-Zenodo-Dep")',
        queryable: false
    },

    {
        name: 'zoobankId',
        alias: 'zoobank',
        schema: {
            type: 'string',
            description: 'ZooBank ID of journal article'
        },
        sqltype: 'TEXT',
        cheerio: '$("document").attr("ID-ZooBank")',
        queryable: false
    },

    {
        name: 'articleId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the article. Has to be a 32 character string:
- \`articleId=8F39FF8A1E18FF9AFFF6FFB2FFEC6749\``
        },
        sqltype: 'TEXT NOT NULL',
        cheerio: '$("document").attr("masterDocId")',
        defaultCols: true
    },

    {
        name: 'articleTitle',
        schema: { 
            type: 'string',
            description: `The article in which the treatment was published. Can use the following syntax:
- \`articleTitle=Checklist of British and Irish Hymenoptera - Braconidae\`
- \`articleTitle=starts_with(Checklist)\`
- \`articleTitle=ends_with(Braconidae)\`
- \`articleTitle=contains(British and Irish)\`
  **Note:** queries involving inexact matches will be considerably slow`
        },
        sqltype: 'TEXT',
        cheerio: '$("document").attr("masterDocTitle")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'articleAuthor',
        schema: { 
            type: 'string',
            description: `The author of the article in which the treatment was published. Unless there is a nomenclature act, this is also the author of the treatment (there only is a nomenclature act if there is a taxonomicNameLabel in the "nomenclature" subSubSection, in which case the treatment authors are to be taken from the authorityName attribute of the first taxonomicName in the "nomenclature" subSubSection … and if said attribute is absent, the treatment author defaults to this field). Can use the following syntax:
- \`articleAuthor=Kronestedt, Torbjörn &amp; Marusik, Yuri M.\`
- \`articleAuthor=starts_with(Kronestedt)\`
- \`articleAuthor=ends_with(Yuri M.)\`
- \`articleAuthor=contains(Torbjörn)\`
  **Note:** queries involving inexact matches will be considerably slow`
        },
        sqltype: 'TEXT',
        cheerio: '$("document").attr("docAuthor")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'articleDOI',
        schema: { 
            type: 'string',
            description: `DOI of journal article (for example, "10.3897/BDJ.4.e8151"):
- \`doi=10.3897/BDJ.4.e8151\``
        },
        sqltype: 'TEXT',
        cheerio: '$("mods\\\\:identifier[type=DOI]").text()',
        defaultCols: true,
    },

    {
        name: 'publicationDate',
        schema: {
            type: 'string',
            pattern: `^((since|until)\\(${re.date}\\))|(${re.date})|(between\\(${re.date} and ${re.date}\\))$`,
            description: `The publication date of the treatment. Can use the following syntax: 
- \`publicationDate=2018-1-12\`
- \`publicationDate=since(2018-12-03)\`
- \`publicationDate=until(2018-03-22)\`
- \`publicationDate=between(2018-03-22 and 2019-12-03)\`

  **Note:** Date is made of yyyy-m?-d?
- yyyy: a four digit year
- m?: one or two digit month
- d?: one or two digit day`,
        },
        sqltype: 'TEXT',
        cheerio: '$("mods\\\\:detail[type=pubDate] mods\\\\:number").text()',
        defaultCols: true,
        defaultOp: 'eq'
    },

    {
        name: 'journalTitle',
        schema: {
            type: 'string',
            description: `The journal in which the treatment was published. Can use the following syntax:
- \`journalTitle=Biodiversity Data Journal 4\`
- \`journalTitle=starts_with(Biodiversity)\`
- \`journalTitle=ends_with(Journal 4)\`
- \`journalTitle=contains(Data Journal)\`
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sqltype: 'TEXT',
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:titleInfo mods\\\\:title").text()',
        defaultCols: true,
        defaultOp: 'starts_with',
        facet: 'count > 100'
    },

    {
        name: 'journalYear',
        schema: {
            type: 'string',
            pattern: re.year,
            description: 'The year of the journal'
        },
        sqltype: 'TEXT',
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:date").text()',
        defaultCols: true,
        facet: 'count > 1'
    },

    {
        name: 'journalVolume',
        schema: {
            type: 'string',
            description: 'The volume of the journal'
        },
        sqltype: 'TEXT',
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:detail[type=volume] mods\\\\:number").text()',
        defaultCols: true
    },

    {
        name: 'journalIssue',
        schema: {
            type: 'string',
            description: 'The issue of the journal'
        },
        sqltype: 'TEXT',
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:detail[type=issue] mods\\\\:number").text()',
        defaultCols: true
    },

    {
        name: 'pages',
        schema: {
            type: 'string',
            description: 'The "from" and "to" pages where the treatment occurs in the article'
        },
        sqltype: 'TEXT',
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:extent[unit=page] mods\\\\:start").text() + "–" + $("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:extent[unit=page] mods\\\\:end").text()',
        defaultCols: true,
        queryable: false
    },

    {
        name: 'authorityName',
        schema: {
            type: 'string',
            description: `The author(s) of the treatment (not necessarily the same as the authors of the journal article, but omitted if same as article authors). Can use the following syntax:
- \`authorityName=Foerster\`
- \`authorityName=starts_with(Foe)\`
- \`authorityName=ends_with(ster)\`
- \`authorityName=contains(erst)\`
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("authorityName")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'authorityYear',
        schema: {
            type: 'string',
            pattern: re.year,
            description: 'The year when the taxon name was published'
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("authorityYear")',
        defaultCols: true,
        defaultOp: 'eq'
    },

    {
        name: 'kingdom',
        schema: {
            type: 'string',
            description: 'The higher category of the taxonomicName',
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("kingdom")',
        defaultCols: true
    },

    {
        name: 'phylum',
        schema: {
            type: 'string',
            description: 'The higher category of the taxonomicName',
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("phylum")',
        defaultCols: true
    },

    {
        name: 'order',
        schema: {
            type: 'string',
            description: 'The higher category of the taxonomicName',
        },
        selname: '"order"',
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("order")',
        defaultCols: true
    },

    {
        name: 'family',
        schema: {
            type: 'string',
            description: 'The higher category of the taxonomicName',
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("family")',
        defaultCols: true
    },

    {
        name: 'genus',
        schema: {
            type: 'string',
            description: 'The higher category of the taxonomicName',
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("genus")',
        defaultCols: true
    },

    {
        name: 'species',
        schema: {
            type: 'string',
            description: 'The higher category of the taxonomicName',
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("species")',
        defaultCols: true
    },

    {
        name: 'status',
        schema: {
            type: 'string',
            description: 'The descriptor for the taxonomic status proposed by a given treatment (can be new species, or new combination, or new combination and new synonym)',
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("status")',
        defaultCols: true,
        facet: 'count > 1'
    },

    {
        name: 'taxonomicNameLabel',
        schema: {
            type: 'string',
            description: `The Taxonomic Name Label of a new species. Can use the following syntax:
- \`taxonomicNameLabel=Nilothauma paucisetis\`
- \`taxonomicNameLabel=starts_with(Nilothauma)\`
- \`taxonomicNameLabel=ends_with(paucisetis)\`
- \`taxonomicNameLabel=contains(hauma pauci)\`
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").text()',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'rank',
        schema: {
            type: 'string',
            description: 'The taxonomic rank of the taxon, e.g. species, family',
            enum: [ 'kingdom', 'phylum', 'order', 'family', 'genus', 'species']
        },
        selname: 'treatments.rank',
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("rank")',
        defaultCols: true,
        facet: 'count > 1'
    },

    {
        name: 'geoloc_operator',
        schema: {
            type: 'string',
            enum: [ 'within', 'near' ],
            description: 'The geolocation operator',
        },
        //queryable: false
    },

    {
        name: 'geolocation',
        schema: {
            type: 'object',
            properties: {
                radius: { type: 'integer' },
                units: {
                    type: 'string',
                    enum: [ 'kilometers', 'miles' ],
                    default: 'kilometers'
                },
                lat: {
                    type: 'number',
                    minimum: -90,
                    maximum: 90
                },
                lng: {
                    type: 'number',
                    minimum: -180,
                    maximum: 180
                }
            },
            description: `The geolocation of the treatment. Can use the following syntax:
- \`geolocation=within({radius:10, units: 'kilometers', lat:40.00, lng: -120})\`
- \`geolocation=near({lat: 40.00, lng: -120})\`
  **note:** radius defaults to 1 km when using *near*`,
        },
        join: [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ]
    },

    {
        name: 'collectionCode',
        schema: {
            type: 'string',
            description: `The collection code of the materialsCitations of the treatment. Can use the following syntax:
- \`collectionCode=USNM\`
- \`collectionCode=starts_with(US)\`
    **Note:** queries involving inexact matches will be considerably slow`
        },
        join: [
            'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId',
            'JOIN materialsCitationsXcollectionCodes ON materialsCitations.materialsCitationId = materialsCitationsXcollectionCodes.materialsCitationId',
            'JOIN collectionCodes ON materialsCitationsXcollectionCodes.collectionCode = collectionCodes.collectionCode',
            'LEFT JOIN z3collections.institutions ON collectionCodes.collectionCode = institution_code'
        ],
        facet: 'count > 50'
    },

    {
        name: 'fulltext',
        schema: {
            type: 'string',
            description: `The full text of the treatment. Can use the following syntax: 
- \`q=spiders\``
        },
        selname: "highlight(vtreatments, 1, '<b>', '</b>') fulltext",
        sqltype: 'TEXT',
        cheerio: '$("treatment").text()',
        defaultCols: false,
        defaultOp: 'match',
        where: 'vtreatments',
        join: [ 'JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId' ]
    },

    {
        name: 'q',
        schema: {
            type: 'string',
            description: `A snippet extracted from the full text of the treatment. Can use the following syntax: 
- \`q=spiders\``
        },
        selname: "snippet(vtreatments, 1, '<b>', '</b>', '…', 25) snippet",
        sqltype: 'TEXT',
        defaultCols: false,
        defaultOp: 'match',
        where: 'vtreatments',
        join: [ 'JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId' ]
    },

    {
        name: 'httpUri',
        schema: {
            type: 'string',
            description: `URI for the image`
        },
        //selname: "snippet(vtreatments, 1, '<b>', '</b>', '…', 25) snippet",
        sqltype: 'TEXT',
        defaultCols: false,
        //defaultOp: 'match',
        //where: 'figureCitation',
        join: [ 'JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId' ]
    },

    {
        name: 'deleted',
        schema: { 
            type: 'boolean',
            default: false,
            description: 'A boolean that tracks whether or not this resource is considered deleted/revoked, 1 if yes, 0 if no',
            isResourceId: false
        },
        sqltype: 'INTEGER DEFAULT 0',
        cheerio: '$("document").attr("deleted")',
        defaultCols: false
    }    
]