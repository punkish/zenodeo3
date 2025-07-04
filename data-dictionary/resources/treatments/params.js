import * as utils from '../../../lib/utils.js';
import { externalParams } from './external-params.js';

/** 
 * first we define all the params corresponding to the columns in the 
 * treatments table
 */

/**
 * NOTE: All params are REST params unless they don't have a 'schema' 
 * key. And if they are table column, they will also have a 'sql' key.
 */
const params = [
    {
        name: 'id',
        alias: 'treatments_id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        },
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the treatment',
        },
        defaultOp: 'eq'
    },
    {
        name: 'treatmentId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `Has to be a 32 character string:
- \`treatmentId=388D179E0D564775C3925A5B93C1C407\``,
        },
        sql: {
            desc: 'The unique resourceId of the treatment',
            type: 'TEXT UNIQUE NOT NULL CHECK(Length(treatmentId) = 32)'
        },
        cheerio: '$("document").attr("docId")',
        isResourceId: true
    },
    {
        name: 'treatmentTitle',
        schema: { 
            type: 'string',
            description: `Can use the following syntax:
- \`treatmentTitle=Ichneumonoidea (Homolobus) Foerster 1863\`
- \`treatmentTitle=eq(Ichneumonoidea (Homolobus) Foerster 1863)\`
- \`treatmentTitle=starts_with(Ichneumonoidea)\`
- \`treatmentTitle=ends_with(Foerster 1863)\`
- \`treatmentTitle=contains(Homolobus)\`

  **Note 1:** the first two options above (='…' and =eq(…)) are the same
  **Note 2:** queries involving inexact matches will be considerably slow`
        },
        sql: {
            desc: 'Title of the treatment',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("document").attr("docTitle")',
        defaultOp: 'starts_with'
    },
    {
        name: 'treatmentVersion',
        schema: { 
            type: 'integer',
            description: 'Might be lower than the version of the parent article, as not all treatments change in each new version of the article.'
        },
        sql: {
            desc: 'The version of the treatment',
            type: 'INTEGER'
        },
        cheerio: '$("document").attr("docVersion")',
        defaultCol: false,
        queryable: false
    },
    {
        name: 'treatmentDOIorig',
//         schema: { 
//             type: 'string',
//             description: `For example:
// - \`doi=10.5281/zenodo.275008\``
//         },
        sql: {
            desc: 'DOI of the treatment as extracted',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("treatment").attr("ID-DOI")',
        indexed: false
    },
    {
        name: 'treatmentDOI',
        schema: { 
            type: 'string',
            description: `For example:
- \`doi=10.5281/zenodo.275008\``
        },
        sql: {
            desc: 'DOI of the treatment cleaned up',
            type: `TEXT GENERATED ALWAYS AS (
                Iif(
                    Instr(treatmentDOIorig, '/10.'), 
                    Substr(
                        treatmentDOIorig, 
                        Instr(treatmentDOIorig, '/10.') + 1
                    ), 
                    treatmentDOIorig
                ) 
            ) STORED`
        }
    },
    {
        name: 'treatmentLSID',
        schema: { 
            type: 'string',
            description: `For example:
- \`lsid=urn:lsid:plazi:treatment:000B06B02350EF7F0E538C1045DA36A8\``
        },
        sql: {
            desc: 'LSID of the treatment',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("treatment").attr("LSID")',
        indexed: false,
        defaultOp: 'eq'
    },
    {
        name: 'zenodoDep',
        schema: {
            type: 'integer',
            description: ''
        },
        sql: {
            desc: 'Zenodo deposition number',
            type: 'INTEGER'
        },
        cheerio: '$("document").attr("ID-Zenodo-Dep")',
        queryable: false,
        indexed: false,
        defaultOp: 'eq'
    },
    {
        name: 'zoobankId',
        schema: {
            type: 'string',
            description: ''
        },
        sql: {
            desc: 'ZooBank ID of the journal article',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("document").attr("ID-ZooBank")',
        queryable: false,
        indexed: false
    },
    {
        name: 'articleId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `Has to be a 32 character string:
- \`articleId=8F39FF8A1E18FF9AFFF6FFB2FFEC6749\``
        },
        sql: {
            desc: 'The unique ID of the article',
            type: 'TEXT NOT NULL'
        },
        cheerio: '$("document").attr("masterDocId")',
    },
    {
        name: 'articleTitle',
        schema: { 
            type: 'string',
            description: `Can use the following syntax:
- \`articleTitle=Checklist of British and Irish Hymenoptera - Braconidae\`
- \`articleTitle=eq(Checklist of British and Irish Hymenoptera - Braconidae)\`
- \`articleTitle=starts_with(Checklist)\`
- \`articleTitle=ends_with(Braconidae)\`
- \`articleTitle=contains(British and Irish)\`

  **Note 1:** the first two options above (='…' and =eq(…)) are the same
  **Note 2:** queries involving inexact matches will be considerably slow`
        },
        sql: {
            desc: 'The article in which the treatment was published',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("document").attr("masterDocTitle")',
        defaultOp: 'starts_with'
    },
    {
        name: 'articleAuthor',
        schema: { 
            type: 'string',
            description: `Unless there is a nomenclature act, this is also the author of the treatment (there only is a nomenclature act if there is a taxonomicNameLabel in the "nomenclature" subSubSection, in which case the treatment authors are to be taken from the authorityName attribute of the first taxonomicName in the "nomenclature" subSubSection … and if said attribute is absent, the treatment author defaults to this field). Can use the following syntax:
- \`articleAuthor=Kronestedt, Torbjörn &amp; Marusik, Yuri M.\`
- \`articleAuthor=eq(Kronestedt, Torbjörn &amp; Marusik, Yuri M.)\`
- \`articleAuthor=starts_with(Kronestedt)\`
- \`articleAuthor=ends_with(Yuri M.)\`
- \`articleAuthor=contains(Torbjörn)\`

  **Note 1:** the first two options above (='…' and =eq(…)) are the same
  **Note 2:** queries involving inexact matches will be considerably slow`
        },
        sql: {
            desc: 'The author of the article in which the treatment was published',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("document").attr("docAuthor")',
        defaultOp: 'starts_with'
    },
    {
        name: 'articleDOIorig',
//         schema: { 
//             type: 'string',
//             description: `For example:
// - \`doi=10.3897/BDJ.4.e8151\``
//         },
        sql: {
            desc: 'DOI of journal article as extracted',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("mods\\\\:identifier[type=DOI]").text()',
        indexed: false
    },
    {
        name: 'articleDOI',
        schema: { 
            type: 'string',
            description: `For example:
- \`doi=10.3897/BDJ.4.e8151\``
        },
        sql: {
            desc: 'DOI of journal article cleaned up',
            type: `TEXT GENERATED ALWAYS AS (
                Iif(
                    Instr(articleDOIorig, '/10.'), 
                    Substr(
                        articleDOIorig, 
                        Instr(articleDOIorig, '/10.') + 1
                    ), 
                    articleDOIorig
                ) 
            ) STORED`
        }
    },
    {
        name: 'publicationDate',
        alias: 'publicationDateOrig',
        schema: {
            type: 'string',
            pattern: utils.getPattern('baredate'),
            description: `Can use the following syntax: 
- \`publicationDate=eq(2018-1-12)\`
- \`publicationDate=since(2018-12-03)\`
- \`publicationDate=until(2018-03-22)\`
- \`publicationDate=between(2018-03-22 and 2019-12-03)\`

  **Note:** Date is made of yyyy-m?-d?
- yyyy: a four digit year
- m?: one or two digit month
- d?: one or two digit day`,
        },
        sql: {
            desc: 'The publication date of the treatment',
            type: 'TEXT'
        },
        zqltype: 'datetime',
        cheerio: '$("mods\\\\:detail[type=pubDate] mods\\\\:number").text()',
        defaultOp: 'eq'
    },
    {
        name: 'publicationDateMs',
        alias: 'publicationDate',
//         schema: {
//             type: 'string',
//             pattern: datePattern,
//             description: `Can use the following syntax: 
// - \`publicationDate=eq(2018-1-12)\`
// - \`publicationDate=since(2018-12-03)\`
// - \`publicationDate=until(2018-03-22)\`
// - \`publicationDate=between(2018-03-22 and 2019-12-03)\`

//   **Note:** Date is made of yyyy-m?-d?
// - yyyy: a four digit year
// - m?: one or two digit month
// - d?: one or two digit day`,
//         },
        sql: {
            desc: 'The publication date of the treatment in ms since unixepoch',
            type: utils.unixEpochMs('publicationDate')
        },
        zqltype: 'datetime',
        cheerio: '$("mods\\\\:detail[type=pubDate] mods\\\\:number").text()',
        defaultOp: 'eq'
    },
    {
        name: 'journals_id',
        schema: {},
        sql: {
            desc: 'ID of the journal',
            type: 'INTEGER DEFAULT NULL REFERENCES journals(id)'
        },
        defaultCol: false,
        notQueryable: true
    },
    {
        name: 'journalYear',
        schema: {
            type: 'integer',
            description: ''
        },
        sql: {
            desc: 'The year of the journal',
            type: 'INTEGER'
        },
        zqltype: 'datetime',
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:date").text()',
        facet: 'count > 1'
    },
    {
        name: 'journalVolume',
        schema: {
            type: 'string',
            description: ''
        },
        sql: {
            desc: 'The volume of the journal',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:detail[type=volume] mods\\\\:number").text()',
        indexed: false
    },
    {
        name: 'journalIssue',
        schema: {
            type: 'string',
            description: 'The issue of the journal'
        },
        sql: {
            desc: 'The issue of the journal',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:detail[type=issue] mods\\\\:number").text()',
        indexed: false
    },
    {
        name: 'pages',
        schema: {
            type: 'string',
            description: ''
        },
        sql: {
            desc: 'The "from" and "to" pages where the treatment occurs in the published article',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:extent[unit=page] mods\\\\:start").text() + "–" + $("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:extent[unit=page] mods\\\\:end").text()',
        queryable: false,
        indexed: false
    },
    {
        name: 'authorityName',
        schema: {
            type: 'string',
            description: `Not necessarily the same as the authors of the journal article, but omitted if same as article authors. Can use the following syntax:
- \`authorityName=Foerster\`
- \`authorityName=eq(Foerster)\`
- \`authorityName=starts_with(Foe)\`
- \`authorityName=ends_with(ster)\`
- \`authorityName=contains(erst)\`

  **Note 1:** the first two options above (='…' and =eq(…)) are the same
  **Note 2:** queries involving inexact matches will be considerably slow`
        },
        sql: {
            desc: 'The author(s) of the treatment',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("authorityName")',
        defaultOp: 'starts_with'
    },
    {
        name: 'authorityYear',
        schema: {
            type: 'string',
            //pattern: utils.re.year,
            pattern: utils.getPattern('bareyear'),
            description: ''
        },
        sql: {
            desc: 'The year when the taxon name was published',
            type: 'INTEGER'
        },
        zqltype: 'datetime',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("authorityYear")',
        defaultOp: 'eq'
    },
    {
        name: 'kingdoms_id',
        schema: { 
            type: 'integer', 
            description: '',
        },
        sql: {
            desc: 'The unique ID of the kingdom',
            type: 'INTEGER DEFAULT NULL REFERENCES kingdoms(id)'
        },
        defaultCol: false,
        notQueryable: true
    },
    {
        name: 'phyla_id',
        schema: {},
        sql: {
            desc: 'ID of the phylum',
            type: 'INTEGER DEFAULT NULL REFERENCES phyla(id)'
        },
        defaultCol: false,
        notQueryable: true
    },
    {
        name: 'classes_id',
        schema: {},
        sql: {
            desc: 'ID of the class',
            type: 'INTEGER DEFAULT NULL REFERENCES classes(id)'
        },
        defaultCol: false,
        notQueryable: true
    },
    {
        name: 'orders_id',
        schema: {},
        sql: {
            desc: 'ID of the order',
            type: 'INTEGER DEFAULT NULL REFERENCES orders(id)'
        },
        defaultCol: false,
        notQueryable: true
    },
    {
        name: 'families_id',
        schema: {},
        sql: {
            desc: 'ID of the family',
            type: 'INTEGER DEFAULT NULL REFERENCES families(id)'
        },
        defaultCol: false,
        notQueryable: true
    },
    {
        name: 'genera_id',
        schema: {},
        sql: {
            desc: 'ID of the genus',
            type: 'INTEGER DEFAULT NULL REFERENCES genera(id)'
        },
        defaultCol: false,
        notQueryable: true
    },
    {
        name: 'species_id',
        schema: {},
        sql: {
            desc: 'ID of the species',
            type: 'INTEGER DEFAULT NULL REFERENCES species(id)'
        },
        defaultCol: false,
        notQueryable: true
    },
    {
        name: 'status',
        schema: {
            type: 'string',
            description: 'Can be new species, or new combination, or new combination and new synonym',
        },
        sql: {
            desc: 'The descriptor for the taxonomic status proposed by a given treatment',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("status")',
        facet: 'count > 1'
    },
    {
        name: 'taxonomicNameLabel',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- \`taxonomicNameLabel=Nilothauma paucisetis\`
- \`taxonomicNameLabel=eq(Nilothauma paucisetis)\`
- \`taxonomicNameLabel=starts_with(Nilothauma)\`
- \`taxonomicNameLabel=ends_with(paucisetis)\`
- \`taxonomicNameLabel=contains(hauma pauci)\`

  **Note 1:** the first two options above (='…' and =eq(…)) are the same
  **Note 2:** queries involving inexact matches will be considerably slow`
        },
        sql: {
            desc: 'The Taxonomic Name Label of a new species',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").text()',
        defaultOp: 'starts_with'
    },
    {
        name: 'rank',
        schema: {
            type: 'string',
            description: '',
            enum: [ 'kingdom', 'phylum', 'order', 'family', 'genus', 'species']
        },
        sql: {
            desc: 'The taxonomic rank of the taxon, e.g. species, family',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("rank")',
        facet: 'count > 1'
    },
    {
        name: 'updateTime',
        schema: {
            type: 'string',
            pattern: utils.getPattern('baredate'),
            description: `Can use the following syntax: 
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
        sql: {
            desc: 'The time when the treatment was last updated (stored as ms since unixepoch)',
            type: 'INTEGER'
        },
        zqltype: 'datetime',
        cheerio: '$("document").attr("updateTime")'
    },
    {
        name: 'checkinTime',
        schema: {
            type: 'string',
            pattern: utils.getPattern('baredate'),
            description: `Can use the following syntax: 
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
        sql: {
            desc: 'The time when the article was first uploaded into the system (stored as ms since unixepoch)',
            type: 'INTEGER'
        },
        zqltype: 'datetime',
        cheerio: '$("document").attr("checkinTime")'
    },
    {
        name: 'fulltext',
        schema: {
            type: 'string',
            description: '',
        },
        sql: {
            desc: 'The full text of the treatment',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("treatment").cleanText()',
        defaultCol: false,
        queryable: false,
        indexed: false
    },
    {
        name: 'deleted',
        schema: { 
            type: 'boolean',
            description: '',
        },
        sql: {
            desc: 'A boolean that tracks whether or not this resource is considered deleted/revoked, 1 if yes, 0 if no',
            type: 'INTEGER DEFAULT 0'
        },
        cheerio: '$("document").attr("deleted")',
        defaultCol: false
    },
    {
        name: 'checkInYear',
        schema: {},
        sql: {
            desc: 'Four digit year of checkinTime',
            type: `INTEGER GENERATED ALWAYS AS (
        strftime('%Y', datetime(checkinTime/1000, 'unixepoch'))
    ) VIRTUAL`
        },
        zqltype: 'datetime',
        defaultCol: false,
        queryable: false,
        indexed: false
    },
    {
        name: 'created',
        schema: {},
        sql: {

            // see https://sqlite.org/forum/forumpost/1f173cd9ea810bd0
            desc: 'ms since epoch record created in zenodeo',
            type: 'INTEGER DEFAULT ((julianday() - 2440587.5) * 86400 * 1000)'
        },
        defaultCol: false,
        queryable: false,
        indexed: false
    },
    {
        name: 'updated',
        schema: {},
        sql: {
            desc: 'ms since epoch record updated in zenodeo',
            type: 'INTEGER'
        },
        defaultCol: false,
        queryable: false,
        indexed: false
    },
    {
        name: 'timeToParseXML',
        schema: {},
        sql: {
            desc: 'time taken in ms to parse XML',
            type: 'INTEGER'
        },
        defaultCol: false,
        queryable: false,
        indexed: false
    },
    {
        name: 'validGeo',
        schema: {
            type: 'boolean',
            description: ''
        },
        sql: {
            desc: 'true if treatment has geolocation',
            type: 'BOOLEAN'
        },
        defaultCol: false,
    },
    {
        name: 'summary',
        schema: {
            type: 'string',
            description: 'Summary of species'
        },
        sql: {
            desc: 'true if treatment has geolocation',
            type: 'TEXT'
        },
        defaultCol: true,
    },
    {
        name: 'httpUri',
        schema: {
            type: 'string',
            description: '',
        },
        defaultCol: false,
        //dict: images,
        // joins: [
        //     'JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid'
        // ],
    },

    {
        name: 'heyzai',
        schema: {
            type: 'string',
            description: '',
        },
        defaultCol: false
    },

    {
        name: 'model',
        schema: {
            type: 'string',
            description: '',
        },
        defaultCol: false
    },

    {
        name: 'cachedQueries',
        schema: {
            type: 'boolean',
            description: '',
        },
        defaultCol: false
    }
];

//
// To the above, we add params that are in other tables but
// linked to this table via a FK.
//
// +--------+           +--------+         +--------+              
// | parent |          /|  this  |        /| child  |              
// | table  |-||-----o--| table  |-||---o--| table  |              
// |        |          \|        |        \|        |              
// +--------+           +--------+         +--------+              
// journalId (PK)       treatmentId (PK)   materialCitationId (PK) 
//                      journalId (FK)     treatmentId (FK)        
//                      journalId (FK)     treatmentId (FK)        
//                      journalId (FK)     treatmentId (FK)        
// 
// We call such params 'FK'
//
//  
// We also add params that are in other tables but can be queried 
// via this REST endpoint. We call them 'external'
const allNewParams = utils.addExternalParams(externalParams);
params.push(...allNewParams);

export { params }