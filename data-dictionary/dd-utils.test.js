'use strict'

const chalk = require('chalk')
const i = (i) => chalk.bold.blue(i)
const o = (o) => chalk.bold.green(o)

const ddUtils = require('../data-dictionary/dd-utils.js')

describe('getResources: returns all available resource', () => {
    const tests = [
        {
            input: '',
            output: [
                'treatments',
                'treatmentCitations',
                'bibRefCitations',
                'figureCitations',
                'materialsCitations',
                'collectionCodes',
                'images',
                'publications',
                'families',
                'fake'
            ]
        }
    ]

    tests.forEach(t => {
        xtest(`available resources – "${o(t.output.join(', '))}"`, () => {
            expect(ddUtils.getResources()).toEqual(t.output)
        })
    })
})

describe('getSourceOfResource: given a resource, returns its source', () => {
    const tests = [
        {
            input: 'images',
            output: 'zenodo'
        },
        {
            input: 'publications',
            output: 'zenodo'
        },
        {
            input: 'treatments',
            output: 'zenodeo'
        },
        {
            input: 'treatmentCitations',
            output: 'zenodeo'
        },
        {
            input: 'bibRefCitations',
            output: 'zenodeo'
        },
        {
            input: 'figureCitations',
            output: 'zenodeo'
        },
        {
            input: 'materialsCitations',
            output: 'zenodeo'
        },
        {
            input: 'collectionCodes',
            output: 'zenodeo'
        },
        {
            input: 'families',
            output: 'zenodeo'
        },
        {
            input: 'fake',
            output: 'zenodeo'
        }
    ]

    tests.forEach(t => {
        xtest(`source of ${i(t.input)} – "${o(t.output)}"`, () => {
            expect(ddUtils.getSourceOfResource(t.input)).toBe(t.output)
        })
    })
})

describe('getResourcesFromSpecifiedSource: given a source, returns its resources', () => {
    const tests = [
        {
            input: 'zenodo',
            output: [
                'images',
                'publications' 
            ]
        },
        {
            input: 'zenodeo',
            output: [
                'treatments',
                'treatmentCitations',
                'bibRefCitations',
                'figureCitations',
                'materialsCitations',
                'collectionCodes',
                'families',
                'fake'
            ]
        },
    ]

    tests.forEach(t => {
        xtest(`source ${i(t.input)} – resources "${o(t.output.join(', '))}"`, () => {
            expect(ddUtils.getResourcesFromSpecifiedSource(t.input)).toEqual(t.output)
        })
    })
})

describe('getResourceid: given a resource, returns its resourceId', () => {
    const tests = [
        {
            input: 'treatments',
            output: {
                name: 'treatmentId',
                selname: 'treatments.treatmentId'
            }
        },
        {
            input: 'bibRefCitations',
            output: {
                name: 'bibRefCitationId',
                selname: 'bibRefCitationId'
            }
        },
        {
            input: 'collectionCodes',
            output: {
                name: 'collectionCode',
                selname: 'collectionCode'
            }
        },
        {
            input: 'figureCitations',
            output: {
                name: 'figureCitationId',
                selname: 'figureCitations.figureCitationId'
            }
        },
        {
            input: 'materialsCitations',
            output: {
                name: 'materialsCitationId',
                selname: 'materialsCitations.materialsCitationId'
            }
        },
        {
            input: 'treatmentCitations',
            output: {
                name: 'treatmentCitationId',
                selname: 'treatmentCitationId'
            }
        },
        {
            input: 'families',
            output: {
                name: 'id',
                selname: 'id'
            }
        },
        {
            input: 'images',
            output: {
                name: 'id',
                selname: 'id'
            }
        },
        {
            input: 'publications',
            output: {
                name: 'id',
                selname: 'id'
            }
        },
        {
            input: 'fake',
            output: {
                name: 'fakeId',
                selname: 'fakeId'
            }
        },
    ]

    tests.forEach(t => {
        xtest(`resource ${i(t.input)} – resourceId "${o(JSON.stringify(t.output))}"`, () => {
            expect(ddUtils.getResourceid(t.input)).toEqual(t.output)
        })
    })
})

describe('getParams: given a resource, returns its params', () => {
    const tests = [
        {
            input: 'treatments',
            output: [
                {
                  name: 'treatmentId',
                  schema: {
                    type: 'string',
                    maxLength: 32,
                    minLength: 32,
                    description: 'The unique ID of the treatment. Has to be a 32 character string:\n' +
                      '- `treatmentId=388D179E0D564775C3925A5B93C1C407`',
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
                    description: 'Title of the treatment. Can use the following syntax:\n' +
                      '- `treatmentTitle=Ichneumonoidea (Homolobus) Foerster 1863`\n' +
                      '- `treatmentTitle=starts_with(Ichneumonoidea)`\n' +
                      '- `treatmentTitle=ends_with(Foerster 1863)`\n' +
                      '- `treatmentTitle=contains(Homolobus)`\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
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
                    description: 'DOI of the treatment (for example, "10.5281/zenodo.275008"):\n' +
                      '- `doi=10.5281/zenodo.275008`'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("treatment").attr("ID-DOI")',
                  defaultCols: true
                },
                {
                  name: 'treatmentLSID',
                  schema: {
                    type: 'string',
                    description: 'LSID of the treatment (for example, "urn:lsid:plazi:treatment:000B06B02350EF7F0E538C1045DA36A8"):\n' +
                      '- `lsidurn:lsid:plazi:treatment:000B06B02350EF7F0E538C1045DA36A8`'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("treatment").attr("LSID")',
                  defaultCols: true
                },
                {
                  name: 'zenodoDep',
                  schema: { type: 'string', description: 'Zenodo record of journal article' },
                  sqltype: 'TEXT',
                  cheerio: '$("document").attr("ID-Zenodo-Dep")',
                  queryable: false
                },
                {
                  name: 'zoobankId',
                  alias: 'zoobank',
                  schema: { type: 'string', description: 'ZooBank ID of journal article' },
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
                    description: 'The unique ID of the article. Has to be a 32 character string:\n' +
                      '- `articleId=8F39FF8A1E18FF9AFFF6FFB2FFEC6749`'
                  },
                  sqltype: 'TEXT NOT NULL',
                  cheerio: '$("document").attr("masterDocId")',
                  defaultCols: true
                },
                {
                  name: 'articleTitle',
                  schema: {
                    type: 'string',
                    description: 'The article in which the treatment was published. Can use the following syntax:\n' +
                      '- `articleTitle=Checklist of British and Irish Hymenoptera - Braconidae`\n' +
                      '- `articleTitle=starts_with(Checklist)`\n' +
                      '- `articleTitle=ends_with(Braconidae)`\n' +
                      '- `articleTitle=contains(British and Irish)`\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
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
                    description: 'The author of the article in which the treatment was published. Unless there is a nomenclature act, this is also the author of the treatment (there only is a nomenclature act if there is a taxonomicNameLabel in the "nomenclature" subSubSection, in which case the treatment authors are to be taken from the authorityName attribute of the first taxonomicName in the "nomenclature" subSubSection … and if said attribute is absent, the treatment author defaults to this field). Can use the following syntax:\n' +
                      '- `articleAuthor=Kronestedt, Torbjörn &amp; Marusik, Yuri M.`\n' +
                      '- `articleAuthor=starts_with(Kronestedt)`\n' +
                      '- `articleAuthor=ends_with(Yuri M.)`\n' +
                      '- `articleAuthor=contains(Torbjörn)`\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
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
                    description: 'DOI of journal article (for example, "10.3897/BDJ.4.e8151"):\n' +
                      '- `doi=10.3897/BDJ.4.e8151`'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("mods\\\\:identifier[type=DOI]").text()',
                  defaultCols: true
                },
                {
                  name: 'publicationDate',
                  schema: {
                    type: 'string',
                    pattern: '^((since|until)\\(\\d{4}-\\d{1,2}-\\d{1,2}\\))|(between\\(\\d{4}-\\d{1,2}-\\d{1,2} and \\d{4}-\\d{1,2}-\\d{1,2}\\))$',
                    description: 'The publication date of the treatment. Can use the following syntax: \n' +
                      '- `publicationDate=2018-1-12`\n' +
                      '- `publicationDate=since(2018-12-03)`\n' +
                      '- `publicationDate=until(2018-03-22)`\n' +
                      '- `publicationDate=between(2018-03-22 and 2019-12-03)`\n' +
                      '\n' +
                      '  **Note:** Date is made of yyyy-m?-d?\n' +
                      '- yyyy: a four digit year\n' +
                      '- m?: one or two digit month\n' +
                      '- d?: one or two digit day'
                  },
                  sqltype: 'TEXT',
                  zqltype: 'date',
                  cheerio: '$("mods\\\\:detail[type=pubDate] mods\\\\:number").text()',
                  defaultCols: true,
                  defaultOp: 'eq'
                },
                {
                  name: 'journalTitle',
                  schema: {
                    type: 'string',
                    description: 'The journal in which the treatment was published. Can use the following syntax:\n' +
                      '- `journalTitle=Biodiversity Data Journal 4`\n' +
                      '- `journalTitle=starts_with(Biodiversity)`\n' +
                      '- `journalTitle=ends_with(Journal 4)`\n' +
                      '- `journalTitle=contains(Data Journal)`\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
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
                    pattern: '^\\d{4}$',
                    description: 'The year of the journal'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:date").text()',
                  defaultCols: true,
                  facet: 'count > 1'
                },
                {
                  name: 'journalVolume',
                  schema: { type: 'string', description: 'The volume of the journal' },
                  sqltype: 'TEXT',
                  cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:detail[type=volume] mods\\\\:number").text()',
                  defaultCols: true
                },
                {
                  name: 'journalIssue',
                  schema: { type: 'string', description: 'The issue of the journal' },
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
                    description: 'The author(s) of the treatment (not necessarily the same as the authors of the journal article, but omitted if same as article authors). Can use the following syntax:\n' +
                      '- `authorityName=Foerster`\n' +
                      '- `authorityName=starts_with(Foe)`\n' +
                      '- `authorityName=ends_with(ster)`\n' +
                      '- `authorityName=contains(erst)`\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
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
                    pattern: '^\\d{4}$',
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
                    description: 'The higher category of the taxonomicName'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("kingdom")',
                  defaultCols: true
                },
                {
                  name: 'phylum',
                  schema: {
                    type: 'string',
                    description: 'The higher category of the taxonomicName'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("phylum")',
                  defaultCols: true
                },
                {
                  name: 'order',
                  schema: {
                    type: 'string',
                    description: 'The higher category of the taxonomicName'
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
                    description: 'The higher category of the taxonomicName'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("family")',
                  defaultCols: true
                },
                {
                  name: 'genus',
                  schema: {
                    type: 'string',
                    description: 'The higher category of the taxonomicName'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("genus")',
                  defaultCols: true
                },
                {
                  name: 'species',
                  schema: {
                    type: 'string',
                    description: 'The higher category of the taxonomicName'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("species")',
                  defaultCols: true
                },
                {
                  name: 'status',
                  schema: {
                    type: 'string',
                    description: 'The descriptor for the taxonomic status proposed by a given treatment (can be new species, or new combination, or new combination and new synonym)'
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
                    description: 'The Taxonomic Name Label of a new species. Can use the following syntax:\n' +
                      '- `taxonomicNameLabel=Nilothauma paucisetis`\n' +
                      '- `taxonomicNameLabel=starts_with(Nilothauma)`\n' +
                      '- `taxonomicNameLabel=ends_with(paucisetis)`\n' +
                      '- `taxonomicNameLabel=contains(hauma pauci)`\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
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
                    enum: [ 'kingdom', 'phylum', 'order', 'family', 'genus', 'species' ]
                  },
                  selname: 'treatments.rank',
                  sqltype: 'TEXT',
                  cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("rank")',
                  defaultCols: true,
                  facet: 'count > 1'
                },
                {
                  name: 'location',
                  schema: {
                    type: 'string',
                    pattern: '^within\\(radius:\\s*(?<radius>((\\+|-)?(\\d+)(\\.\\d+)?)|((\\+|-)?\\.?\\d+)),\\s*units:\\s*(kilometers|miles),\\s*lat:\\s*(((\\+|-)?(\\d+)(\\.\\d+)?)|((\\+|-)?\\.?\\d+)),\\s*lng:(((\\+|-)?(\\d+)(\\.\\d+)?)|((\\+|-)?\\.?\\d+))\\)$',
                    description: 'The geolocation of the treatment. Can use the following syntax:\n' +
                      "- `location=within({radius:10, units: 'kilometers', lat:40.00, lng: -120})`\n" +
                      '- `location=near({lat: 40.00, lng: -120})`\n' +
                      "  **note:** when using 'near'\n" +
                      '  - radius defaults to 1\n' +
                      '  - units default to kilometers'
                  },
                  zqltype: 'loc',
                  joins: {
                    query: null,
                    select: [
                      'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId'
                    ]
                  }
                },
                {
                  name: 'collectionCode',
                  schema: {
                    type: 'string',
                    description: 'The collection code of the materialsCitations of the treatment. Can use the following syntax:\n' +
                      '- `collectionCode=USNM`\n' +
                      '- `collectionCode=starts_with(US)`\n' +
                      '    **Note:** queries involving inexact matches will be considerably slow'
                  },
                  joins: {
                    query: [
                      'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId',
                      'JOIN materialsCitationsXcollectionCodes ON materialsCitations.materialsCitationId = materialsCitationsXcollectionCodes.materialsCitationId',
                      'JOIN collectionCodes ON materialsCitationsXcollectionCodes.collectionCode = collectionCodes.collectionCode',
                      'LEFT JOIN z3collections.institutions ON collectionCodes.collectionCode = institution_code'
                    ],
                    select: [
                      'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId',
                      'JOIN materialsCitationsXcollectionCodes ON materialsCitations.materialsCitationId = materialsCitationsXcollectionCodes.materialsCitationId',
                      'JOIN collectionCodes ON materialsCitationsXcollectionCodes.collectionCode = collectionCodes.collectionCode',
                      'LEFT JOIN z3collections.institutions ON collectionCodes.collectionCode = institution_code'
                    ]
                  },
                  facet: 'count > 50'
                },
                {
                  name: 'fulltext',
                  schema: {
                    type: 'string',
                    description: 'The full text of the treatment. Can use the following syntax: \n' +
                      '- `q=spiders`'
                  },
                  selname: "highlight(vtreatments, 1, '<b>', '</b>') fulltext",
                  sqltype: 'TEXT',
                  cheerio: '$("treatment").text()',
                  defaultCols: false,
                  defaultOp: 'match',
                  where: 'vtreatments',
                  joins: {
                    query: [
                      'JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId'
                    ],
                    select: null
                  }
                },
                {
                  name: 'q',
                  schema: {
                    type: 'string',
                    description: 'A snippet extracted from the full text of the treatment. Can use the following syntax: \n' +
                      '- `q=spiders`'
                  },
                  selname: "snippet(vtreatments, 1, '<b>', '</b>', '…', 25) snippet",
                  sqltype: 'TEXT',
                  defaultCols: false,
                  defaultOp: 'match',
                  where: 'vtreatments',
                  joins: {
                    query: [
                      'JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId'
                    ],
                    select: null
                  }
                },
                {
                  name: 'httpUri',
                  schema: { type: 'string', description: 'URI for the image' },
                  sqltype: 'TEXT',
                  defaultCols: false,
                  joins: {
                    query: null,
                    select: [
                      'LEFT JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId'
                    ]
                  }
                },
                {
                  name: 'captionText',
                  schema: {
                    type: 'string',
                    description: 'The full text of the figure cited by this treatment'
                  },
                  sqltype: 'TEXT',
                  defaultCols: false,
                  defaultOp: 'match',
                  where: 'vfigurecitations',
                  joins: {
                    query: [
                      'vfigurecitations ON figureCitations.figureCitationId = vfigurecitations.figureCitationId'
                    ],
                    select: [
                      'LEFT JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId'
                    ]
                  }
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
                },
                {
                  name: '$refreshCache',
                  schema: {
                    type: 'boolean',
                    description: 'Force refresh cache (true | false)',
                    default: false
                  }
                },
                {
                  name: '$facets',
                  schema: {
                    type: 'boolean',
                    description: 'Calculate facets (true | false)',
                    default: false
                  }
                },
                {
                  name: '$page',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Starting page. Has to be an integer greater than 0. Defaults to 1',
                    default: 1
                  }
                },
                {
                  name: '$size',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Number of records to fetch per page. Has to be an integer between 1 and 100. Defaults to 30',
                    default: 30
                  }
                },
                {
                  name: '$sortby',
                  schema: {
                    type: 'string',
                    minimum: 1,
                    description: 'comma-separated list of &lt;column name&gt;.&lt;sort direction&gt;. Defaults to &lt;resourceId:ASC&gt;. Sorting is done in the order the columns appear in the list. For example:\n' +
                      '- `$sortby=treatmentTitle:ASC,rank:DESC`\n' +
                      '  **Note:** sort direction can be ASC or DESC',
                    default: 'resourceId:ASC'
                  }
                },
                {
                  name: '$cols',
                  schema: {
                    type: 'array',
                    items: { type: 'string' },
                    description: "Columns to retreive in the result set. Order of columns doesn't matter. Provide columns like so:\n" +
                      '- `$cols=column1&$cols=column2&$cols=column3`'
                  }
                }
            ]
        },
        {
            input: 'bibRefCitations',
            output: [
                {
                  name: 'bibRefCitationId',
                  schema: {
                    type: 'string',
                    maxLength: 32,
                    minLength: 32,
                    description: "The unique ID of the bibRefCitation. Has to be a 32 character string like: 'EC384B11E320FF95FB78F995FEA0F964'",
                    isResourceId: true
                  },
                  sqltype: 'TEXT NOT NULL UNIQUE',
                  cheerio: '$("bibRefCitation").attr("id")',
                  defaultCols: true
                },
                {
                  name: 'treatmentId',
                  schema: {
                    type: 'string',
                    maxLength: 32,
                    minLength: 32,
                    description: "The unique ID of the parent treatment (FK). Has to be a 32 character string like: '000087F6E320FF99FDC9FA73FA90FABE'"
                  },
                  sqltype: 'TEXT NOT NULL',
                  defaultCols: true
                },
                {
                  name: 'refString',
                  schema: {
                    type: 'string',
                    description: 'The full text of the reference cited by the treatment. Can use the following syntax: `q=spiders`'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("bibRefCitation").attr("refString")',
                  defaultCols: true,
                  defaultOp: 'match',
                  where: 'vbibrefcitations',
                  join: [
                    'JOIN vbibrefcitations ON bibRefCitations.bibRefCitationId = vbibrefcitations.bibRefCitationId'
                  ]
                },
                {
                  name: 'type',
                  schema: {
                    type: 'string',
                    description: 'The type of reference cited by the treatment'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("bibRefCitation").attr("type")',
                  defaultCols: true,
                  facets: true
                },
                {
                  name: 'year',
                  schema: {
                    type: 'string',
                    pattern: '^[0-9]{4}$',
                    description: 'The year of the reference cited by this treatment'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("bibRefCitation").attr("year")',
                  defaultCols: true,
                  facets: true
                },
                {
                  name: '$refreshCache',
                  schema: {
                    type: 'boolean',
                    description: 'Force refresh cache (true | false)',
                    default: false
                  }
                },
                {
                  name: '$facets',
                  schema: {
                    type: 'boolean',
                    description: 'Calculate facets (true | false)',
                    default: false
                  }
                },
                {
                  name: '$page',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Starting page. Has to be an integer greater than 0. Defaults to 1',
                    default: 1
                  }
                },
                {
                  name: '$size',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Number of records to fetch per page. Has to be an integer between 1 and 100. Defaults to 30',
                    default: 30
                  }
                },
                {
                  name: '$sortby',
                  schema: {
                    type: 'string',
                    minimum: 1,
                    description: 'comma-separated list of &lt;column name&gt;.&lt;sort direction&gt;. Defaults to &lt;resourceId:ASC&gt;. Sorting is done in the order the columns appear in the list. For example:\n' +
                      '- `$sortby=treatmentTitle:ASC,rank:DESC`\n' +
                      '  **Note:** sort direction can be ASC or DESC',
                    default: 'resourceId:ASC'
                  }
                },
                {
                  name: '$cols',
                  schema: {
                    type: 'array',
                    items: { type: 'string' },
                    description: "Columns to retreive in the result set. Order of columns doesn't matter. Provide columns like so:\n" +
                      '- `$cols=column1&$cols=column2&$cols=column3`'
                  }
                }
            ]
        },
        {
            input: 'collectionCodes',
            output: [
                {
                  name: 'collectionCode',
                  schema: {
                    type: 'string',
                    description: 'The collection code for a natural history collection',
                    isResourceId: true
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("collectionCode")',
                  defaultCols: true
                },
                {
                  name: 'institution_name',
                  schema: {
                    type: 'string',
                    description: 'The name of the institution that houses the collection'
                  },
                  sqltype: 'TEXT',
                  join: [
                    'LEFT JOIN z3collections.institutions ON collectionCode = institution_code'
                  ]
                },
                {
                  name: '$refreshCache',
                  schema: {
                    type: 'boolean',
                    description: 'Force refresh cache (true | false)',
                    default: false
                  }
                },
                {
                  name: '$facets',
                  schema: {
                    type: 'boolean',
                    description: 'Calculate facets (true | false)',
                    default: false
                  }
                },
                {
                  name: '$page',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Starting page. Has to be an integer greater than 0. Defaults to 1',
                    default: 1
                  }
                },
                {
                  name: '$size',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Number of records to fetch per page. Has to be an integer between 1 and 100. Defaults to 30',
                    default: 30
                  }
                },
                {
                  name: '$sortby',
                  schema: {
                    type: 'string',
                    minimum: 1,
                    description: 'comma-separated list of &lt;column name&gt;.&lt;sort direction&gt;. Defaults to &lt;resourceId:ASC&gt;. Sorting is done in the order the columns appear in the list. For example:\n' +
                      '- `$sortby=treatmentTitle:ASC,rank:DESC`\n' +
                      '  **Note:** sort direction can be ASC or DESC',
                    default: 'resourceId:ASC'
                  }
                },
                {
                  name: '$cols',
                  schema: {
                    type: 'array',
                    items: { type: 'string' },
                    description: "Columns to retreive in the result set. Order of columns doesn't matter. Provide columns like so:\n" +
                      '- `$cols=column1&$cols=column2&$cols=column3`'
                  }
                }
            ]
        },
        {
            input: 'figureCitations',
            output: [
                {
                  name: 'figureCitationId',
                  schema: {
                    type: 'string',
                    maxLength: 32,
                    minLength: 32,
                    description: "The unique ID of the figureCitation. Has to be a 32 character string like: '10922A65E320FF95FC0FFC83FB80FCAA'",
                    isResourceId: true
                  },
                  selname: 'figureCitations.figureCitationId',
                  sqltype: 'TEXT NOT NULL UNIQUE',
                  cheerio: '$("figureCitation").attr("id")',
                  defaultCols: true
                },
                {
                  name: 'treatmentId',
                  schema: {
                    type: 'string',
                    maxLength: 32,
                    minLength: 32,
                    description: "The unique ID of the parent treatment (FK). Has to be a 32 character string like:  '000087F6E320FF95FF7EFDC1FAE4FA7B'"
                  },
                  sqltype: 'TEXT NOT NULL',
                  defaultCols: true
                },
                {
                  name: 'captionText',
                  schema: {
                    type: 'string',
                    description: 'The full text of the figure cited by this treatment. Can use the following syntax: `captionText=spiders`'
                  },
                  selname: 'figureCitations.captionText',
                  sqltype: 'TEXT',
                  cheerio: '$("figureCitation").attr("captionText")',
                  defaultCols: true,
                  defaultOp: 'match',
                  where: 'vfigurecitations',
                  joins: {
                    query: [
                      'vfigurecitations ON figureCitations.figureCitationId = vfigurecitations.figureCitationId'
                    ],
                    select: null
                  }
                },
                {
                  name: 'httpUri',
                  schema: {
                    type: 'string',
                    format: 'uri',
                    description: 'The URI of the figure cited by this treatment'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("figureCitation").attr("httpUri")',
                  defaultCols: true,
                  queryable: false
                },
                {
                  name: '$refreshCache',
                  schema: {
                    type: 'boolean',
                    description: 'Force refresh cache (true | false)',
                    default: false
                  }
                },
                {
                  name: '$facets',
                  schema: {
                    type: 'boolean',
                    description: 'Calculate facets (true | false)',
                    default: false
                  }
                },
                {
                  name: '$page',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Starting page. Has to be an integer greater than 0. Defaults to 1',
                    default: 1
                  }
                },
                {
                  name: '$size',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Number of records to fetch per page. Has to be an integer between 1 and 100. Defaults to 30',
                    default: 30
                  }
                },
                {
                  name: '$sortby',
                  schema: {
                    type: 'string',
                    minimum: 1,
                    description: 'comma-separated list of &lt;column name&gt;.&lt;sort direction&gt;. Defaults to &lt;resourceId:ASC&gt;. Sorting is done in the order the columns appear in the list. For example:\n' +
                      '- `$sortby=treatmentTitle:ASC,rank:DESC`\n' +
                      '  **Note:** sort direction can be ASC or DESC',
                    default: 'resourceId:ASC'
                  }
                },
                {
                  name: '$cols',
                  schema: {
                    type: 'array',
                    items: { type: 'string' },
                    description: "Columns to retreive in the result set. Order of columns doesn't matter. Provide columns like so:\n" +
                      '- `$cols=column1&$cols=column2&$cols=column3`'
                  }
                }
            ]
        },
        {
            input: 'materialsCitations',
            output: [
                {
                  name: 'materialsCitationId',
                  schema: {
                    type: 'string',
                    maxLength: 32,
                    minLength: 32,
                    description: "The unique ID of the materialsCitation. Has to be a 32 character string like: '38C63CC3D744DE1FE88B8A56FB7EDD14'",
                    isResourceId: true
                  },
                  selname: 'materialsCitations.materialsCitationId',
                  sqltype: 'TEXT NOT NULL UNIQUE',
                  cheerio: '$("materialsCitation").attr("id")',
                  defaultCols: true
                },
                {
                  name: 'treatmentId',
                  schema: {
                    type: 'string',
                    maxLength: 32,
                    minLength: 32,
                    description: "The unique ID of the parent treatment (FK). Has to be a 32 character string like: '00078788D744DE18E88B8B8BFE7FDBF9'"
                  },
                  sqltype: 'TEXT NOT NULL',
                  defaultCols: true
                },
                {
                  name: 'collectingDate',
                  schema: {
                    type: 'string',
                    format: 'date',
                    description: 'The date when the specimen was collected'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("collectingDate")',
                  defaultCols: true
                },
                {
                  name: 'collectionCode',
                  schema: {
                    type: 'string',
                    description: 'The collection code for a natural history collection'
                  },
                  selname: 'collectionCodes.collectionCode',
                  sqltype: 'TEXT',
                  defaultCols: true,
                  join: [
                    'JOIN materialsCitationsXcollectionCodes mc ON materialsCitations.materialsCitationId = mc.materialsCitationId',
                    'JOIN collectionCodes ON mc.collectionCode = collectionCodes.collectionCode',
                    'LEFT JOIN z3collections.institutions ON collectionCodes.collectionCode = institution_code'
                  ]
                },
                {
                  name: 'institution_name',
                  schema: {
                    type: 'string',
                    description: 'The name of the institution that houses the collection'
                  },
                  sqltype: 'TEXT',
                  defaultCols: true
                },
                {
                  name: 'collectorName',
                  schema: {
                    type: 'string',
                    description: 'The person who collected the specimen. Can use the following syntax:\n' +
                      '- collectorName=Udzungwa Scarp FR & N. Scharff\n' +
                      '- collectorName=starts_with(Udzungwa)\n' +
                      '- collectorName=ends_with(Scharff)\n' +
                      '- collectorName=contains(Scarp FR)\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("collectorName")',
                  defaultCols: true,
                  defaultOp: 'starts_with'
                },
                {
                  name: 'country',
                  schema: {
                    type: 'string',
                    description: 'The country where the specimen was collected. Can use the following syntax:\n' +
                      '- country=Tanzania\n' +
                      '- country=starts_with(Tan)\n' +
                      '- country=ends_with(nia)\n' +
                      '- country=contains(zan)\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("country")',
                  defaultCols: true,
                  defaultOp: 'starts_with'
                },
                {
                  name: 'collectingRegion',
                  schema: {
                    type: 'string',
                    description: 'The geographic region where the specimen was collected. Can use the following syntax:\n' +
                      "- collectingRegion='Galapagos'\n" +
                      '- collectingRegion=starts_with(Gal)\n' +
                      '- collectingRegion=ends_with(gos)\n' +
                      '- collectingRegion=contains(lap)\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("collectingRegion")',
                  defaultCols: true,
                  defaultOp: 'starts_with'
                },
                {
                  name: 'municipality',
                  schema: {
                    type: 'string',
                    description: 'A lower administrative region. Can use the following syntax:\n' +
                      "- municipality='Zona Velasco Ibarra (near Scalesia quadrat)'\n" +
                      '- municipality=starts_with(Zona Velasco)\n' +
                      '- municipality=ends_with(calesia quadrat))\n' +
                      '- municipality=contains(Ibarra)\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("municipality")',
                  defaultCols: true,
                  defaultOp: 'starts_with'
                },
                {
                  name: 'county',
                  schema: {
                    type: 'string',
                    description: 'The county where the specimen was collected. Can use the following syntax:\n' +
                      "- county='Mahenge District'\n" +
                      '- county=starts_with(Mahenge)\n' +
                      '- county=ends_with(District)\n' +
                      '- county=contains(henge)\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
                  },
                  description: 'The county where the specimen was collected',
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("county")',
                  defaultCols: true,
                  defaultOp: 'eq'
                },
                {
                  name: 'stateProvince',
                  schema: {
                    type: 'string',
                    description: 'The state or province where the specimen was collected. Can use the following syntax:\n' +
                      "- stateProvince='Iringa Region'\n" +
                      '- stateProvince=starts_with(Iringa)\n' +
                      '- stateProvince=ends_with(Region)\n' +
                      '- stateProvince=contains(ringa)\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("stateProvince")',
                  defaultCols: true,
                  defaultOp: 'starts_with'
                },
                {
                  name: 'location',
                  schema: {
                    type: 'string',
                    description: 'The location where the specimen was collected. Can use the following syntax:\n' +
                      "- location='Udekwa Village'\n" +
                      '- location=starts_with(Udekwa)\n' +
                      '- location=ends_with(Village)\n' +
                      '- location=contains(ekwa)\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("location")',
                  defaultCols: true,
                  defaultOp: 'starts_with'
                },
                {
                  name: 'locationDeviation',
                  schema: {
                    type: 'string',
                    description: 'The distance to the nearest location, e.g. 23km NW from…. Can use the following syntax:\n' +
                      "- location='mountain top'\n" +
                      '- location=starts_with(mountain)\n' +
                      '- location=ends_with(top)\n' +
                      '- location=contains(tain)\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
                  },
                  description: '',
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("locationDeviation")',
                  defaultCols: true,
                  defaultOp: 'starts_with'
                },
                {
                  name: 'specimenCountFemale',
                  schema: {
                    type: 'integer',
                    description: 'The number of listed female specimens'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("specimenCount-female")',
                  defaultCols: true
                },
                {
                  name: 'specimenCountMale',
                  schema: {
                    type: 'integer',
                    description: 'The number of listed male specimens'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("specimenCount-male")',
                  defaultCols: true
                },
                {
                  name: 'specimenCount',
                  schema: { type: 'integer', description: 'The number of listed specimens' },
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("specimenCount")',
                  defaultCols: true
                },
                {
                  name: 'specimenCode',
                  schema: {
                    type: 'string',
                    description: 'The code of the specimen. Can use the following syntax:\n' +
                      "- specimenCode='01 - SRNP- 4156'\n" +
                      '- specimenCode=starts_with(01)\n' +
                      '- specimenCode=ends_with(4156)\n' +
                      '- specimenCode=contains(SRNP)\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("specimenCode")',
                  defaultCols: true,
                  defaultOp: 'starts_with'
                },
                {
                  name: 'typeStatus',
                  schema: {
                    type: 'string',
                    description: 'TThe nomenclatural status of the specimen, e.g. holotype, paratype. Can use the following syntax:\n' +
                      "- specimenCode='1 lectotype and 13 paralectotypes'\n" +
                      '- specimenCode=starts_with(1 lectotype)\n' +
                      '- specimenCode=ends_with(paralectotypes)\n' +
                      '- specimenCode=contains(lectotype)\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
                  },
                  description: '',
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("typeStatus")',
                  defaultCols: true,
                  defaultOp: 'starts_with'
                },
                {
                  name: 'determinerName',
                  schema: {
                    type: 'string',
                    description: 'The person or agent who identified the specimen. Can use the following syntax:\n' +
                      "- determinerName='A. d'Orchymont & J. L. Hellman'\n" +
                      "- determinerName=starts_with(A. d'Orchymont)\n" +
                      '- determinerName=ends_with(Hellman)\n' +
                      '- determinerName=contains(Orchymont)\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("determinerName")',
                  defaultCols: true,
                  defaultOp: 'starts_with'
                },
                {
                  name: 'collectedFrom',
                  schema: {
                    type: 'string',
                    description: 'The substrate where the specimen has been collected, e.g. leaf, flower. Can use the following syntax:\n' +
                      "- collectedFrom='5 year-old longleaf pine stand'\n" +
                      '- collectedFrom=starts_with(5 year-old)\n' +
                      '- collectedFrom=ends_with(pine stand)\n' +
                      '- collectedFrom=contains(longleaf)\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("collectedFrom")',
                  defaultCols: true,
                  defaultOp: 'starts_with'
                },
                {
                  name: 'collectingMethod',
                  schema: {
                    type: 'string',
                    description: 'The method used for collecting the specimen. Can use the following syntax:\n' +
                      "- collectingMethod='03 MaxiWinks, mixed samples'\n" +
                      '- collectingMethod=starts_with(03 MaxiWinks)\n' +
                      '- collectingMethod=ends_with(mixed samples)\n' +
                      '- collectingMethod=contains(mixed)\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("collectingMethod")',
                  defaultCols: true,
                  defaultOp: 'starts_with'
                },
                {
                  name: 'geolocation',
                  schema: {
                    type: 'string',
                    description: 'The geo-location of the materialsCitation. Can use the following syntax:\n' +
                      '- geolocation=within({"radius":10,units:"kilometers","lat":40.00,"lng":-120})\n' +
                      '- geolocation=near({"lat":40.00,"lng":-120})\n' +
                      '  **note:** radius defaults to 1 km when using *near*'
                  }
                },
                {
                  name: 'latitude',
                  schema: {
                    type: 'string',
                    description: 'Geographic coordinates of the location where the specimen was collected.'
                  },
                  selname: 'materialsCitations.latitude',
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("latitude")',
                  defaultCols: true,
                  qyeryable: false
                },
                {
                  name: 'longitude',
                  schema: {
                    type: 'string',
                    description: 'Geographic coordinates of the location where the specimen was collected.'
                  },
                  selname: 'materialsCitations.longitude',
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("longitude")',
                  defaultCols: true,
                  qyeryable: false
                },
                {
                  name: 'elevation',
                  schema: {
                    type: 'integer',
                    description: 'Elevation of the location where the specimen was collected. Can use the following syntax:\n' +
                      '- elevation=58\n' +
                      '- elevation=gt(58)\n' +
                      '- elevation=gte(58)\n' +
                      '- elevation=lt(58)\n' +
                      '- elevation=lte(58)\n' +
                      '- elevation=between(-1000 and 102)'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("elevation")',
                  defaultCols: true
                },
                {
                  name: 'httpUri',
                  schema: {
                    type: 'string',
                    format: 'uri',
                    description: 'The persistent identifier of the specimen'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("materialsCitation").attr("httpUri")',
                  defaultCols: true,
                  queryable: false
                },
                {
                  name: '$refreshCache',
                  schema: {
                    type: 'boolean',
                    description: 'Force refresh cache (true | false)',
                    default: false
                  }
                },
                {
                  name: '$facets',
                  schema: {
                    type: 'boolean',
                    description: 'Calculate facets (true | false)',
                    default: false
                  }
                },
                {
                  name: '$page',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Starting page. Has to be an integer greater than 0. Defaults to 1',
                    default: 1
                  }
                },
                {
                  name: '$size',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Number of records to fetch per page. Has to be an integer between 1 and 100. Defaults to 30',
                    default: 30
                  }
                },
                {
                  name: '$sortby',
                  schema: {
                    type: 'string',
                    minimum: 1,
                    description: 'comma-separated list of &lt;column name&gt;.&lt;sort direction&gt;. Defaults to &lt;resourceId:ASC&gt;. Sorting is done in the order the columns appear in the list. For example:\n' +
                      '- `$sortby=treatmentTitle:ASC,rank:DESC`\n' +
                      '  **Note:** sort direction can be ASC or DESC',
                    default: 'resourceId:ASC'
                  }
                },
                {
                  name: '$cols',
                  schema: {
                    type: 'array',
                    items: { type: 'string' },
                    description: "Columns to retreive in the result set. Order of columns doesn't matter. Provide columns like so:\n" +
                      '- `$cols=column1&$cols=column2&$cols=column3`'
                  }
                }
            ]
        },
        {
            input: 'treatmentCitations',
            output: [
                {
                  name: 'treatmentCitationId',
                  schema: {
                    type: 'string',
                    maxLength: 32,
                    minLength: 32,
                    description: "The unique ID of the treatmentCitation. Has to be a 32 character string like: 'EC3D4B08FFADFFCE66FAFA5E334CFA00'",
                    isResourceId: true
                  },
                  sqltype: 'TEXT NOT NULL UNIQUE',
                  cheerio: '$("treatmentCitation").attr("id")',
                  defaultCols: true
                },
                {
                  name: 'treatmentId',
                  schema: {
                    type: 'string',
                    maxLength: 32,
                    minLength: 32,
                    description: "The unique ID of the parent treatment (FK). Has to be a 32 character string like: '000587EFFFADFFC267F7FAC4351CFBC7'"
                  },
                  sqltype: 'TEXT NOT NULL',
                  defaultCols: true
                },
                {
                  name: 'treatmentCitation',
                  schema: {
                    type: 'string',
                    description: 'The taxonomic name and the author of the species, plus the author of the treatment being cited. Can use the following syntax:\n' +
                      '- treatmentCitation=Lepadichthys erythraeus :  Dor 1984 : 54 Dor, 1984\n' +
                      '- treatmentCitation=starts_with(Lepadichthys)\n' +
                      '- treatmentCitation=ends_with(1984)\n' +
                      '- treatmentCitation=contains(erythraeus)\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("subSubSection[type=reference_group] treatmentCitationGroup taxonomicName").text() + " " + $("subSubSection[type=reference_Group] treatmentCitationGroup taxonomicName").attr("authority") + " sec. " + $("subSubSection[type=reference_Group] treatmentCitationGroup bibRefCitation").text()',
                  defaultCols: true,
                  defaultOp: 'starts_with'
                },
                {
                  name: 'refString',
                  schema: {
                    type: 'string',
                    description: 'The bibliographic reference string of the treatments cited by this treatment. Can use the following syntax:\n' +
                      '- refString=Dor, M. (1984) CLOFRES. Checklist of fishes of the Red Sea. The Israeli Academy of Sciences and Humanities, Jerusalem, xxii + 437 pp.\n' +
                      '- refString=starts_with(Dor, M)\n' +
                      '- refString=ends_with(Jerusalem, xxii + 437 pp.)\n' +
                      '- refString=contains(Checklist of fishes)\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
                  },
                  sqltype: 'TEXT',
                  cheerio: '$("subSubSection[type=referenceGroup] treatmentCitationGroup treatmentCitation bibRefCitation").attr("refString")',
                  defaultCols: true,
                  defaultOp: 'starts_with'
                },
                {
                  name: '$refreshCache',
                  schema: {
                    type: 'boolean',
                    description: 'Force refresh cache (true | false)',
                    default: false
                  }
                },
                {
                  name: '$facets',
                  schema: {
                    type: 'boolean',
                    description: 'Calculate facets (true | false)',
                    default: false
                  }
                },
                {
                  name: '$page',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Starting page. Has to be an integer greater than 0. Defaults to 1',
                    default: 1
                  }
                },
                {
                  name: '$size',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Number of records to fetch per page. Has to be an integer between 1 and 100. Defaults to 30',
                    default: 30
                  }
                },
                {
                  name: '$sortby',
                  schema: {
                    type: 'string',
                    minimum: 1,
                    description: 'comma-separated list of &lt;column name&gt;.&lt;sort direction&gt;. Defaults to &lt;resourceId:ASC&gt;. Sorting is done in the order the columns appear in the list. For example:\n' +
                      '- `$sortby=treatmentTitle:ASC,rank:DESC`\n' +
                      '  **Note:** sort direction can be ASC or DESC',
                    default: 'resourceId:ASC'
                  }
                },
                {
                  name: '$cols',
                  schema: {
                    type: 'array',
                    items: { type: 'string' },
                    description: "Columns to retreive in the result set. Order of columns doesn't matter. Provide columns like so:\n" +
                      '- `$cols=column1&$cols=column2&$cols=column3`'
                  }
                }
            ]
        },
        {
            input: 'families',
            output: [
                {
                  name: 'id',
                  schema: {
                    type: 'integer',
                    description: 'The unique ID of the family',
                    isResourceId: true
                  },
                  sqltype: 'INTEGER',
                  defaultCols: false
                },
                {
                  name: 'q',
                  schema: { type: 'string', description: 'The name of the family' },
                  sqltype: 'TEXT',
                  selname: 'family',
                  defaultOp: 'starts_with',
                  defaultCols: true
                },
                {
                  name: '$refreshCache',
                  schema: {
                    type: 'boolean',
                    description: 'Force refresh cache (true | false)',
                    default: false
                  }
                },
                {
                  name: '$facets',
                  schema: {
                    type: 'boolean',
                    description: 'Calculate facets (true | false)',
                    default: false
                  }
                },
                {
                  name: '$page',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Starting page. Has to be an integer greater than 0. Defaults to 1',
                    default: 1
                  }
                },
                {
                  name: '$size',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Number of records to fetch per page. Has to be an integer between 1 and 100. Defaults to 30',
                    default: 30
                  }
                },
                {
                  name: '$sortby',
                  schema: {
                    type: 'string',
                    minimum: 1,
                    description: 'comma-separated list of &lt;column name&gt;.&lt;sort direction&gt;. Defaults to &lt;resourceId:ASC&gt;. Sorting is done in the order the columns appear in the list. For example:\n' +
                      '- `$sortby=treatmentTitle:ASC,rank:DESC`\n' +
                      '  **Note:** sort direction can be ASC or DESC',
                    default: 'resourceId:ASC'
                  }
                },
                {
                  name: '$cols',
                  schema: {
                    type: 'array',
                    items: { type: 'string' },
                    description: "Columns to retreive in the result set. Order of columns doesn't matter. Provide columns like so:\n" +
                      '- `$cols=column1&$cols=column2&$cols=column3`'
                  }
                }
            ]
        },
        {
            input: 'images',
            output: [
                {
                  name: 'id',
                  schema: {
                    type: 'integer',
                    description: 'unique identifier of the record',
                    isResourceId: true
                  },
                  defaultCols: true
                },
                {
                  name: 'subtype',
                  schema: {
                    type: 'array',
                    items: {
                      type: 'string',
                      enum: [ 'figure', 'photo', 'drawing', 'diagram', 'plot', 'other' ]
                    },
                    minItems: 1,
                    maxItems: 6,
                    additionalItems: false,
                    description: 'The image subtype; defaults to all subtypes'
                  }
                },
                {
                  name: 'communities',
                  schema: {
                    type: 'array',
                    items: { type: 'string', enum: [ 'biosyslit', 'belgiumherbarium' ] },
                    minItems: 1,
                    maxItems: 2,
                    additionalItems: false,
                    default: [ 'biosyslit' ],
                    description: 'The community on Zenodo; defaults to <b>"biosyslit"</b>'
                  },
                  defaultCols: true
                },
                {
                  name: 'q',
                  schema: {
                    type: 'string',
                    description: 'The term for full-text search. Can use the following syntax: `q=spiders`'
                  }
                },
                {
                  name: 'creator',
                  schema: {
                    type: 'string',
                    description: 'Usually the author. Can use the following syntax:\n' +
                      '- creator="Agosti, Donat"\n' +
                      '  will find all records containing exactly "Agosti, Donat"\n' +
                      '\n' +
                      '- creator=Ago\n' +
                      '  will find all records containing words startings with "Ago"\n' +
                      '\n' +
                      '- creator=Agosti Donat\n' +
                      '  will find all records containing Agosti, Donat, Donat Agosti, Agosti Donat (a boolean OR search)\n' +
                      '\n' +
                      '- creator=Agosti AND Donat\n' +
                      '  will find all records containing both Agosti and Donat in any order'
                  },
                  defaultCols: true
                },
                {
                  name: 'title',
                  schema: {
                    type: 'string',
                    description: 'Title of the record. Can use the following syntax:\n' +
                      '- title="spider, peacock"\n' +
                      '  will find all records containing exactly "spider, peacock"\n' +
                      '\n' +
                      '- title=pea\n' +
                      '  will find all records containing words startings with "pea"\n' +
                      '\n' +
                      '- title=spider peacock\n' +
                      '  will find all records containing either spider or peacock, or both in any order (a boolean OR search)\n' +
                      '\n' +
                      '- title=spider AND peacock\n' +
                      '  will find all records containing both spider and peacock in any order'
                  },
                  defaultCols: true
                },
                {
                  name: 'keywords',
                  schema: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'The keywords associated with the image; more than one keywords may be used'
                  },
                  defaultCols: true
                },
                {
                  name: '$refreshCache',
                  schema: {
                    type: 'boolean',
                    description: 'Force refresh cache (true | false)',
                    default: false
                  }
                },
                {
                  name: '$facets',
                  schema: {
                    type: 'boolean',
                    description: 'Calculate facets (true | false)',
                    default: false
                  }
                },
                {
                  name: '$page',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Starting page. Has to be an integer greater than 0. Defaults to 1',
                    default: 1
                  }
                },
                {
                  name: '$size',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Number of records to fetch per page. Has to be an integer between 1 and 100. Defaults to 30',
                    default: 30
                  }
                },
                {
                  name: '$sortby',
                  schema: {
                    type: 'string',
                    minimum: 1,
                    description: 'comma-separated list of &lt;column name&gt;.&lt;sort direction&gt;. Defaults to &lt;resourceId:ASC&gt;. Sorting is done in the order the columns appear in the list. For example:\n' +
                      '- `$sortby=treatmentTitle:ASC,rank:DESC`\n' +
                      '  **Note:** sort direction can be ASC or DESC',
                    default: 'resourceId:ASC'
                  }
                },
                {
                  name: '$cols',
                  schema: {
                    type: 'array',
                    items: { type: 'string' },
                    description: "Columns to retreive in the result set. Order of columns doesn't matter. Provide columns like so:\n" +
                      '- `$cols=column1&$cols=column2&$cols=column3`'
                  }
                }
            ]
        },
        {
            input: 'publications',
            output: [
                {
                  name: 'id',
                  schema: {
                    type: 'integer',
                    description: 'unique identifier of the record',
                    isResourceId: true
                  },
                  defaultCols: true
                },
                {
                  name: 'subtype',
                  schema: {
                    type: 'array',
                    items: {
                      type: 'string',
                      enum: [
                        'article',
                        'report',
                        'book',
                        'thesis',
                        'section',
                        'workingpaper',
                        'preprint'
                      ]
                    },
                    minItems: 1,
                    maxItems: 7,
                    additionalItems: false,
                    default: [
                      'article',
                      'report',
                      'book',
                      'thesis',
                      'section',
                      'workingpaper',
                      'preprint'
                    ],
                    description: 'The publication subtype; defaults to all subtypes'
                  },
                  defaultCols: true
                },
                {
                  name: 'communities',
                  schema: {
                    type: 'array',
                    items: { type: 'string', enum: [ 'biosyslit', 'belgiumherbarium' ] },
                    minItems: 1,
                    maxItems: 2,
                    additionalItems: false,
                    default: [ 'biosyslit' ],
                    description: 'The community on Zenodo; defaults to <b>"biosyslit"</b>'
                  },
                  defaultCols: true
                },
                {
                  name: 'q',
                  schema: {
                    type: 'string',
                    description: 'The term for full-text search. Can use the following syntax: `q=spiders`'
                  }
                },
                {
                  name: 'creator',
                  schema: {
                    type: 'string',
                    description: 'Usually the author. Can use the following syntax:\n' +
                      '- creator="Agosti, Donat"\n' +
                      '  will find all records containing exactly "Agosti, Donat"\n' +
                      '\n' +
                      '- creator=Ago\n' +
                      '  will find all records containing words startings with "Ago"\n' +
                      '\n' +
                      '- creator=Agosti Donat\n' +
                      '  will find all records containing Agosti, Donat, Donat Agosti, Agosti Donat (a boolean OR search)\n' +
                      '\n' +
                      '- creator=Agosti AND Donat\n' +
                      '  will find all records containing both Agosti and Donat in any order'
                  },
                  defaultCols: true
                },
                {
                  name: 'title',
                  schema: {
                    type: 'string',
                    description: 'Title of the record. Can use the following syntax:\n' +
                      '- title="spider, peacock"\n' +
                      '  will find all records containing exactly "spider, peacock"\n' +
                      '\n' +
                      '- title=pea\n' +
                      '  will find all records containing words startings with "pea"\n' +
                      '\n' +
                      '- title=spider peacock\n' +
                      '  will find all records containing either spider or peacock, or both in any order (a boolean OR search)\n' +
                      '\n' +
                      '- title=spider AND peacock\n' +
                      '  will find all records containing both spider and peacock in any order'
                  },
                  defaultCols: true
                },
                {
                  name: 'keywords',
                  schema: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'The keywords associated with the publication; more than one keywords may be used'
                  },
                  defaultCols: true
                },
                {
                  name: '$refreshCache',
                  schema: {
                    type: 'boolean',
                    description: 'Force refresh cache (true | false)',
                    default: false
                  }
                },
                {
                  name: '$facets',
                  schema: {
                    type: 'boolean',
                    description: 'Calculate facets (true | false)',
                    default: false
                  }
                },
                {
                  name: '$page',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Starting page. Has to be an integer greater than 0. Defaults to 1',
                    default: 1
                  }
                },
                {
                  name: '$size',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Number of records to fetch per page. Has to be an integer between 1 and 100. Defaults to 30',
                    default: 30
                  }
                },
                {
                  name: '$sortby',
                  schema: {
                    type: 'string',
                    minimum: 1,
                    description: 'comma-separated list of &lt;column name&gt;.&lt;sort direction&gt;. Defaults to &lt;resourceId:ASC&gt;. Sorting is done in the order the columns appear in the list. For example:\n' +
                      '- `$sortby=treatmentTitle:ASC,rank:DESC`\n' +
                      '  **Note:** sort direction can be ASC or DESC',
                    default: 'resourceId:ASC'
                  }
                },
                {
                  name: '$cols',
                  schema: {
                    type: 'array',
                    items: { type: 'string' },
                    description: "Columns to retreive in the result set. Order of columns doesn't matter. Provide columns like so:\n" +
                      '- `$cols=column1&$cols=column2&$cols=column3`'
                  }
                }
            ]
        }
    ]

    tests.forEach(t => {
        xtest(`resource ${i(t.input)}`, () => {
            expect(ddUtils.getParams(t.input)).toEqual(t.output)
        })
    })
})