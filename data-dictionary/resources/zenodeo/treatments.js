import * as utils from '../../../lib/utils.js';
import { dictMaterialCitations } from './materialcitations.js';
import { dictFigureCitations } from './figurecitations.js';
import { dictCollectionCodes } from './collectioncodes.js';

const datePattern = utils.getPattern('date');
/** 
 * first we define all the params corresponding to the columns in the 
 * treatments table
 */
const dictionary = [
    {
        name: 'treatmentId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the treatment. Has to be a 32 character string:
- \`treatmentId=388D179E0D564775C3925A5B93C1C407\``,
        },
        isResourceId: true,
        sqltype: 'TEXT NOT NULL UNIQUE',
        cheerio: '$("document").attr("docId")'
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
            description: 'Zenodo record of the journal article'
        },
        sqltype: 'TEXT',
        cheerio: '$("document").attr("ID-Zenodo-Dep")',
        notQueryable: true
    },
    {
        name: 'zoobankId',
        schema: {
            type: 'string',
            description: 'ZooBank ID of the journal article'
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
            pattern: datePattern,
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
- \`journalTitle=not_like(Data Journal)\`
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
        name: 'class',
        schema: {
            type: 'string',
            description: 'The higher category of the taxonomicName',
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("class")',
    },
    {
        name: 'order',
        alias: {
            select: 'tr.treatments."order"',
            where : 'tr.treatments."order"'
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
            pattern: datePattern,
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
            pattern: datePattern,
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
        cheerio: '$("treatment").text().replace(/(?:\\r\\n|\\r|\\n)/g, " ").replace(/  /g, " ").replace(/  /g, " ")',
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
            description: 'A boolean that tracks whether or not this resource is considered deleted/revoked, 1 if yes, 0 if no',
        },
        sqltype: 'INTEGER DEFAULT 0',
        cheerio: '$("document").attr("deleted")',
        notDefaultCol: true
    },

    /** 
     * ==== select ====
     * 
     * SELECT 
     *      '…' || 
     *      Substring(tr.treatments.fulltext, instr(tr.treatments.fulltext, 'agosti') - 20, 20) || 
     *      '<span class="hilite">agosti</span>' || 
     *      Substring(tr.treatments.fulltext, instr(tr.treatments.fulltext, 'agosti') + 6, 20) || 
     *      '…' AS snippet 
     * FROM tr.treatments JOIN 
     *      tr.ftsTreatments ON tr.treatments.id = tr.ftsTreatments.rowid 
     * WHERE tr.ftsTreatments.ftsTreatments MATCH @q 
     * …
     * 
     * ==== where ====
     * 
     * SELECT … 
     * FROM tr.treatments JOIN 
     *      tr.ftsTreatments ON tr.treatments.id = tr.ftsTreatments.rowid 
     * WHERE tr.ftsTreatments.ftsTreatments MATCH @q 
     * …
     */
    {
        name: 'q',
        alias: {
            select: () => `'…' || Substring(Replace(tr.treatments.fulltext, '\r\n', ' '), Instr(Replace(tr.treatments.fulltext, '\r\n', ' '), @q) - @sides, @sides) || '<span class="' || @cssClass || '">' || @q || '</span>' || Substring(Replace(tr.treatments.fulltext, '\r\n', ' '), Instr(Replace(tr.treatments.fulltext, '\r\n', ' '), @q) + Length(@q), @sides) || '…' AS snippet`,
            where : 'tr.ftsTreatments.ftsTreatments'
        },
        schema: {
            type: 'string',
            description: `A snippet extracted from the full text of the treatment. Can use the following syntax: 
- \`q=spiders\``
        },
        sqltype: 'TEXT',
        //zqltype: 'expression',
        notDefaultCol: true,
        defaultOp: 'match',
        joins: {
            select: [ 'JOIN tr.ftsTreatments ON tr.treatments.id = tr.ftsTreatments.rowid' ],
            where : [ 'JOIN tr.ftsTreatments ON tr.treatments.id = tr.ftsTreatments.rowid' ]
        },
    }
];

/** 
 * then we add params that are in other tables but can be queried 
 * via this REST endpoint
 */
const externalParams = [

    /** 
     * ==== select ====
     *
     * SELECT fc.figureCitations.httpUri 
     * FROM tr.treatments JOIN 
     *      fc.figureCitations ON 
     *          tr.treatments.treatmentId = fc.figureCitations.treatmentId 
     * WHERE … 
     * …
     * 
     * ==== where ====
     * 
     * SELECT … 
     * FROM tr.treatments JOIN
     *      fc.figureCitations ON 
     *          tr.treatments.treatmentId = fc.figureCitations.treatmentId 
     * WHERE fc.figureCitations.httpUri = @httpUri 
     * … 
     */
    {
        name: 'httpUri',
        dict: dictFigureCitations,
        alias: {
            select: 'fc.figureCitations.httpUri',
            where : 'fc.figureCitations.httpUri'
        },
        joins: {
            select: [ 'JOIN fc.figureCitations ON tr.treatments.treatmentId = fc.figureCitations.treatmentId' ],
            where : [ 'JOIN fc.figureCitations ON tr.treatments.treatmentId = fc.figureCitations.treatmentId' ]
        }
    },

    /** 
     * ==== select ====
     *
     * SELECT fc.figureCitations.captionText 
     * FROM tr.treatments JOIN
     *      fc.figureCitations ON 
     *          tr.treatments.treatmentId = fc.figureCitations.treatmentId 
     * WHERE … 
     * …
     * 
     * ==== where ====
     * 
     * SELECT … 
     * FROM tr.treatments JOIN 
     *      fc.figureCitations ON 
     *          tr.treatments.treatmentId = fc.figureCitations.treatmentId JOIN 
     *      fc.ftsFigureCitations ON 
     *          fc.figureCitations.id = fc.ftsFigureCitations.rowid
     * WHERE fc.figureCitations.captionText MATCH @captionText 
     * … 
     */
    {
        name: 'captionText',
        dict: dictFigureCitations,
        alias: {
            select: 'fc.figureCitations.captionText',
            where : 'fc.figureCitations.captionText'
        },
        defaultOp: 'match',
        joins: {
            select: [ 'JOIN fc.figureCitations ON tr.treatments.treatmentId = fc.figureCitations.treatmentId' ],
            where : [ 
                'JOIN fc.figureCitations ON tr.treatments.treatmentId = fc.figureCitations.treatmentId',
                'JOIN fc.ftsFigureCitations ON fc.figureCitations.id = fc.ftsFigureCitations.rowid'
            ]
        }
    },

    /** 
     * ==== select ====
     *
     * SELECT mc.collectionCodes.collectionCode 
     * FROM tr.treatments JOIN
     *      mc.materialsCitations ON 
     *          tr.treatments.treatmentId = mc.materialsCitations.treatmentId 
     * WHERE … 
     * …
     * 
     * ==== where ====
     * 
     * SELECT … 
     * FROM tr.treatments JOIN 
     *      fc.figureCitations ON 
     *          tr.treatments.treatmentId = fc.figureCitations.treatmentId JOIN 
     *      fc.ftsFigureCitations ON 
     *          fc.figureCitations.id = fc.ftsFigureCitations.rowid
     * WHERE fc.figureCitations.captionText MATCH @captionText 
     * … 
     */
    {
        name: 'collectionCode',
        dict: dictCollectionCodes,
        alias: {
            select: 'mc.collectionCodes.collectionCode',
            where : 'mc.collectionCodes.collectionCode'
        },
        isResourceId: false,
        joins: {
            select: [
                'LEFT JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId',
                'JOIN mc.materialsCitations_x_collectionCodes ON mc.materialsCitations.materialsCitationId = mc.materialsCitations_x_collectionCodes.materialsCitationId',
                'JOIN mc.collectionCodes ON mc.materialsCitations_x_collectionCodes.collectionCode = mc.collectionCodes.collectionCode',
                'LEFT JOIN gb.institutions ON mc.collectionCodes.collectionCode = gb.institutions.institution_code'
            ],
            where : [
                'LEFT JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId',
                'JOIN mc.materialsCitations_x_collectionCodes ON mc.materialsCitations.materialsCitationId = mc.materialsCitations_x_collectionCodes.materialsCitationId',
                'JOIN mc.collectionCodes ON mc.materialsCitations_x_collectionCodes.collectionCode = mc.collectionCodes.collectionCode',
                'LEFT JOIN gb.institutions ON mc.collectionCodes.collectionCode = gb.institutions.institution_code'
            ]
        }
    },
    {
        name: 'latitude',
        dict: dictMaterialCitations,
        alias: {
            select: 'mc.materialsCitations.latitude',
            where : 'mc.materialsCitations.latitude'
        },
        joins: {
            select: [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ],
            where : [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ]
        }
    },
    {
        name: 'longitude',
        dict: dictMaterialCitations,
        alias: {
            select: 'mc.materialsCitations.longitude',
            where : 'mc.materialsCitations.longitude'
        },
        joins: {
            select: [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ],
            where : [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ]
        }
    },
    {
        name: 'geolocation',
        dict: dictMaterialCitations,
        joins: {
            select: [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ],
            where : [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ]
        }
    },
    {
        name: 'isOnLand',
        dict: dictMaterialCitations,
        alias: {
            select: 'mc.materialsCitations.isOnLand',
            where : 'mc.materialsCitations.isOnLand'
        },
        joins: {
            select: [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ],
            where : [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ]
        }
    },
    {
        name: 'validGeo',
        dict: dictMaterialCitations,
        alias: {
            select: 'mc.materialsCitations.validGeo',
            where : 'mc.materialsCitations.validGeo'
        },
        joins: {
            select: [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ],
            where : [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ]
        }
    }
];

externalParams.forEach(param => utils.addExternalDef(param, dictionary));

export { dictionary as dictTreatments }