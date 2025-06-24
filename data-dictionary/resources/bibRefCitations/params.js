import * as utils from '../../../lib/utils.js';
import { treatments } from '../treatments/index.js';
import { bibRefCitationsFts } from '../bibRefCitationsFts/index.js';

const params = [
    {
        name: 'id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        }
    },
    {
        name: 'bibRefCitationId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `Has to be a 32 character string like: 'EC384B11E320FF95FB78F995FEA0F964'`,
        },
        isResourceId: true,
        sql: {
            desc: 'The unique ID of the bibRefCitation',
            type: 'TEXT UNIQUE NOT NULL CHECK(Length(bibRefCitationId) = 32)'
        },
        cheerio: '$("bibRefCitation").attr("id")'
    },
    {
        name: 'DOI',
        schema: {
            type: 'string',
            description: ``
        },
        sql: {
            desc: 'The DOI of the citation',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("bibRefCitation").attr("DOI")'
    },
    {
        name: 'author',
        schema: {
            type: 'string',
            description: ``
        },
        sql: {
            desc: 'The author',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("bibRefCitation").attr("author")'
    },
    {
        name: 'journalOrPublisher',
        schema: {
            type: 'string',
            description: ``
        },
        sql: {
            desc: 'The journal or publisher',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("bibRefCitation").attr("journalOrPublisher")'
    },
    {
        name: 'title',
        schema: {
            type: 'string',
            description: ``
        },
        sql: {
            desc: 'The title of the citation',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("bibRefCitation").attr("title")'
    },
    {
        name: 'refString',
        schema: {
            type: 'string',
            description: ``
        },
        sql: {
            desc: 'The full text of the reference cited by the treatment',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("bibRefCitation").attr("refString")',
        indexed: false
    },
    {
        name: 'type',
        schema: {
            type: 'string',
            description: ''
        },
        sql: {
            desc: 'The type of reference cited by the treatment',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("bibRefCitation").attr("type")',
        indexed: false,
        facets: true
    },
    {
        name: 'year',
        schema: {
            type: 'string',
            //pattern: utils.re.year,
            pattern: utils.getPattern('bareyear'),
            description: ''
        },
        sql: {
            desc: 'The year of the reference cited by this treatment',
            type: 'INTEGER'
        },
        cheerio: '$("bibRefCitation").attr("year")',
        facets: true
    },
    {
        name: 'innertext',
        schema: {
            type: 'string',
            description: ''
        },
        sql: {
            desc: 'The innertext text of the bibRefCitation',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("bibRefCitation").text()',
        defaultCol: false,
        queryable: false,
        indexed: false
    },
    {
        name: 'treatments_id',
        sql: {
            desc: 'The ID of the parent treatment (FK)',
            type: 'INTEGER NOT NULL REFERENCES treatments(id)'
        },
        indexed: false
    }
];

const externalParams = [

    // treatments
    {
        dict: treatments,
        cols: [
            {
                name: 'treatmentId',
                joins: [
                    'JOIN treatments ON bibRefCitations.treatments_id = treatments.id'
                ]
            }
        ]
    },

    // bibRefCitationsFts
    {
        dict: bibRefCitationsFts,
        cols: [
            {
                name: 'q',
                joins: [
                    'JOIN bibRefCitationsFts ON bibRefCitations.id = bibRefCitationsFts.rowid'
                ]
            }
        ]
    }
];

const allNewParams = utils.addExternalParams(externalParams);
params.push(...allNewParams);

export { params }