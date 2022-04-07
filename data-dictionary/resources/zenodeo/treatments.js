'use strict'

const utils = require('../../../lib/utils.js');


// see https://github.com/plazi/Plazi-Communications/issues/1044#issuecomment-661246289 
// for notes from @gsautter

/*
elements are extracted from articles (-> cheerio expression)
and stored in a db (-> sql column) table (-> resource).

rest query is made of params that can be directly mapped to a sql column 
or can be a sql expression
*/

/*


  All params are queryable unless notqueryable is true
 
  Params with 'defaultCols' = true are SELECT-ed by default
  
  Param 'sqltype' is used to CREATE the db table
  
  Param 'selname' is used when 'name' is inappropriate for SQL. 
  For example, when a column exists in two JOIN-ed tables, we 
  can use 'selname' to prefix the column name with the table. Or,
  if a column name is a reserved SQL word, we can double quote it 
  as in the case of "order"
  
  
 */
const treatments = [
    {
        // the name used in the REST query
        name: 'treatmentId',

        // alternative name to use in the SELECT and 
        // WHERE clauses of SQL
        /*
        alias: {
            select: 'treatments.rank',
            where : 'treatments.rank'
        },
        */
        
        // JSON schema that verifies the queries
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the treatment. Has to be a 32 character string:
- \`treatmentId=388D179E0D564775C3925A5B93C1C407\``,
            // isResourceId: true
        },

        isResourceId: true,
        
        // SQL datatype
        sqltype: 'TEXT NOT NULL UNIQUE',

        // zqltype is 'text' by default unless defined explicitly
        /*
        zqltype: 'date' | 'geolocation' | 'number'
        */

        // cheerio expression used to parse the value 
        // from the XML
        cheerio: '$("document").attr("docId")',

        // all columns are included in the query results by 
        // default unless notDefaultCol is true
        /*
        notDefaultCol: true
        */

        // all params are queryable unless notqueryable is true
        /*
        notQueryable: true
        */
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
        notDefaultCol: true
    },

    {
        name: 'treatmentDOI',
        schema: { 
            type: 'string',
            description: `DOI of the treatment (for example, "10.5281/zenodo.275008"):
- \`doi=10.5281/zenodo.275008\``
        },
        sqltype: 'TEXT',
        cheerio: '$("treatment").attr("ID-DOI")',
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
    },

    {
        name: 'zenodoDep',
        schema: {
            type: 'string',
            description: 'Zenodo record of journal article'
        },
        sqltype: 'TEXT',
        cheerio: '$("document").attr("ID-Zenodo-Dep")',
        notQueryable: true
    },

    {
        name: 'zoobankId',
        schema: {
            type: 'string',
            description: 'ZooBank ID of journal article'
        },
        sqltype: 'TEXT',
        cheerio: '$("document").attr("ID-ZooBank")',
        notQueryable: true
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
    },

    {
        name: 'publicationDate',
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
        sqltype: 'TEXT',
        zqltype: 'date',
        cheerio: '$("mods\\\\:detail[type=pubDate] mods\\\\:number").text()',
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
        defaultOp: 'starts_with',
        facet: 'count > 100'
    },

    {
        name: 'journalYear',
        schema: {
            type: 'string',
            pattern: utils.re.year,
            description: 'The year of the journal'
        },
        sqltype: 'TEXT',
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:date").text()',
        facet: 'count > 1'
    },

    {
        name: 'journalVolume',
        schema: {
            type: 'string',
            description: 'The volume of the journal'
        },
        sqltype: 'TEXT',
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:detail[type=volume] mods\\\\:number").text()'
    },

    {
        name: 'journalIssue',
        schema: {
            type: 'string',
            description: 'The issue of the journal'
        },
        sqltype: 'TEXT',
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:detail[type=issue] mods\\\\:number").text()',
    },

    {
        name: 'pages',
        schema: {
            type: 'string',
            description: 'The "from" and "to" pages where the treatment occurs in the article'
        },
        sqltype: 'TEXT',
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:extent[unit=page] mods\\\\:start").text() + "–" + $("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:extent[unit=page] mods\\\\:end").text()',
        notQueryable: true
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
        defaultOp: 'starts_with'
    },

    {
        name: 'authorityYear',
        schema: {
            type: 'string',
            pattern: utils.re.year,
            description: 'The year when the taxon name was published'
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("authorityYear")',
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
    },

    {
        name: 'phylum',
        schema: {
            type: 'string',
            description: 'The higher category of the taxonomicName',
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("phylum")',
    },

    {
        name: 'order',
        alias: {
            select: 'treatments."order"',
            where : 'treatments."order"'
        },
        schema: {
            type: 'string',
            description: 'The higher category of the taxonomicName',
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("order")',
    },

    {
        name: 'family',
        schema: {
            type: 'string',
            description: 'The higher category of the taxonomicName',
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("family")',
    },

    {
        name: 'genus',
        schema: {
            type: 'string',
            description: 'The higher category of the taxonomicName',
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("genus")',
    },

    {
        name: 'species',
        schema: {
            type: 'string',
            description: 'The higher category of the taxonomicName',
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("species")',
    },

    {
        name: 'status',
        schema: {
            type: 'string',
            description: 'The descriptor for the taxonomic status proposed by a given treatment (can be new species, or new combination, or new combination and new synonym)',
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("status")',
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
        defaultOp: 'starts_with'
    },

    {
        name: 'rank',
        // alias: {
        //     select: 'treatments.rank',
        //     where : 'treatments.rank'
        // },
        schema: {
            type: 'string',
            description: 'The taxonomic rank of the taxon, e.g. species, family',
            enum: [ 'kingdom', 'phylum', 'order', 'family', 'genus', 'species']
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("rank")',
        facet: 'count > 1'
    },

    {
        name: 'updateTime',
        schema: {
            type: 'string',
            pattern: utils.getPattern('date'),
            description: `The time when the treatment was last updated (as a result of an update to the article). Can use the following syntax: 
- \`updateTime=eq(2018-1-12)\`
- \`updateTime=since(2018-12-03)\`
- \`updateTime=until(2018-03-22)\`
- \`updateTime=between(2018-03-22 and 2019-12-03)\`

  **Note1:** Date is made of yyyy-m?-d?
- yyyy: a four digit year
- m?: one or two digit month
- d?: one or two digit day

    **Note2:** Even though this field is called "updateTime", for now it can be queried only for dates.`,
        },
        sqltype: 'INTEGER',
        zqltype: 'date',
        cheerio: '$("document").attr("updateTime")'
    },

    {
        name: 'checkinTime',
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
        sqltype: 'INTEGER',
        zqltype: 'date',
        cheerio: '$("document").attr("checkinTime")'
    },

    {
        name: 'fulltext',
        schema: {
            type: 'string',
            description: 'The full text of the treatment',
        },
        sqltype: 'TEXT',
        cheerio: '$("treatment").text()',
        notDefaultCol: true,
        notQueryable: true
    },

    {
        name: 'deleted',
        alias: {
            select: 'treatments.deleted',
            where : 'treatments.deleted'
        },
        schema: { 
            type: 'boolean',
            default: false,
            description: 'A boolean that tracks whether or not this resource is considered deleted/revoked, 1 if yes, 0 if no',
            isResourceId: false
        },
        sqltype: 'INTEGER DEFAULT 0',
        cheerio: '$("document").attr("deleted")',
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
        }
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
        }
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
        zqltype: 'expression',
        notDefaultCol: true,
        joins: {
            select: null,
            where : [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ]
        }
    },

    {
        name: 'isOnLand',
        alias: {
            select: 'materialsCitations.isOnLand',
            where : 'materialsCitations.isOnLand'
        },
        schema: {
            type: 'number',
            description: `True if treatment is on land.`,
        },
        notDefaultCol: true,
        joins: {
            select: [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ],
            where : [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ]
        }
    },

    {
        name: 'validGeo',
        alias: {
            select: 'materialsCitations.validGeo',
            where : 'materialsCitations.validGeo'
        },
        schema: {
            type: 'number',
            description: `True if geolocation is valid.`,
        },
        notDefaultCol: true,
        joins: {
            select: [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ],
            where : [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ]
        }
    },

    {
        name: 'collectionCode',
        alias: {
            select: 'collectionCodes.collectionCode',
            where : 'collectionCodes.collectionCode'
        },
        schema: {
            type: 'string',
            description: `The collection code of the materialsCitations of the treatment. Can use the following syntax:
- \`collectionCode=USNM\`
- \`collectionCode=starts_with(US)\`
    **Note:** queries involving inexact matches will be considerably slow`
        },
        joins: {
            select: [
                'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId',
                'JOIN materialsCitations_x_collectionCodes ON materialsCitations.materialsCitationId = materialsCitations_x_collectionCodes.materialsCitationId',
                'JOIN collectionCodes ON materialsCitations_x_collectionCodes.collectionCode = collectionCodes.collectionCode',
                'LEFT JOIN gbifcollections.institutions ON collectionCodes.collectionCode = institution_code'
            ],
            where : [
                'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId',
                'JOIN materialsCitations_x_collectionCodes ON materialsCitations.materialsCitationId = materialsCitations_x_collectionCodes.materialsCitationId',
                'JOIN collectionCodes ON materialsCitations_x_collectionCodes.collectionCode = collectionCodes.collectionCode',
                'LEFT JOIN gbifcollections.institutions ON collectionCodes.collectionCode = institution_code'
            ]
        }
        //facet: 'count > 50'
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
        zqltype: 'expression',
        notDefaultCol: true,
        defaultOp: 'match',
        joins: {
            select: null,
            where : [ 'JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId' ]
        },
    },

    {
        name: 'httpUri',
        alias: {
            select: 'figureCitations.httpUri',
            where : 'figureCitations.httpUri'
        },
        schema: {
            type: 'string',
            description: `The URI of the image. Can use the following syntax: 
- \`httpUri=eq(http://example.com)\`
- \`httpUri=ne()\``
        },
        sqltype: 'TEXT',
        zqltype: 'text',
        notDefaultCol: true,
        joins: {
            select: [ 'JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId' ],
            where : [ 'JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId' ]
        }
    },

    {
        name: 'captionText',
        alias: {
            select: 'figureCitations.captionText',
            where : 'vfigurecitations'
        },
        schema: {
            type: 'string',
            description: 'The full text of the figure cited by this treatment'
        },
        sqltype: 'TEXT',
        notDefaultCol: true,
        defaultOp: 'match',
        joins: {
            select: [ 'JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId' ],
            where : [ 'JOIN vfigurecitations ON treatments.treatmentId = vfigurecitations.treatmentId']
        }
    }
 
];

module.exports = treatments;