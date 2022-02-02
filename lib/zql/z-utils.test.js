'use strict'

const chalk = require('chalk')
const i = (i) => chalk.bold.blue(i)
const o = (o) => chalk.bold.green(o)

const {
    validate,
    formatDate,
    getConstraints
} = require('./z-utils.js')

describe('validate: validate params', () => {
    const tests = [
        {
            input: {
                resource: 'treatments',
                params: { 
                    authorityName: 'starts_with(Agosti)'
                }
            },
            output: {
                authorityName: 'starts_with(Agosti)',
                deleted: false,
                refreshCache: false,
                facets: false,
                relatedRecords: false,
                page: 1,
                size: 30,
                sortby: 'treatments.treatmentId:ASC',
                cols: [
                  'treatmentId',     'treatmentTitle',
                  'treatmentDOI',    'treatmentLSID',
                  'articleId',       'articleTitle',
                  'articleAuthor',   'articleDOI',
                  'publicationDate', 'journalTitle',
                  'journalYear',     'journalVolume',
                  'journalIssue',    'pages',
                  'authorityName',   'authorityYear',
                  'kingdom',         'phylum',
                  'order',           'family',
                  'genus',           'species',
                  'status',          'taxonomicNameLabel',
                  'rank',            'updateTime',
                  'checkinTime'
                ]
            }
        },

        // this should fail because 'materialsCitationId is spelled wrong
        {
            input: {
                resource: 'materialsCitations',
                params: {
                    materialsCitationsId: '38C63CC3D74CDE17E88B8E25FCD2D91C'
                }
            },
            output: false
        }
    ]

    tests.forEach(t => {
        test(`${i(JSON.stringify(t.input))} validated`, () => {
            expect(validate(t.input)).toEqual(t.output)
        })
    })
})

describe('formatDate: formats a date', () => {
    const tests = [
        {
            input: '2021-1-2',
            output: '2021-01-02'
        },
        {
            input: '2021-12-21',
            output: '2021-12-21'
        },
        {
            input: '2021-3-21',
            output: '2021-03-21'
        },
        {
            input: '2021-11-1',
            output: '2021-11-01'
        }
    ]

    tests.forEach(t => {
        test(`${i(t.input)} converted to ${o(t.output)}`, () => {
            expect(formatDate(t.input)).toBe(t.output)
        })
    })
})

describe('getConstraints: given a k,v pair, returns the constraint', () => {
    const tests = [
        {
            input: {
                resource: 'treatments', 
                params: {
                    treatmentId: 'DFG3456SDFS342GHFD543245FDRGSTRE'
                }
            },
            output: {
                constraints: [ "treatments.treatmentId = 'DFG3456SDFS342GHFD543245FDRGSTRE'" ],
                runparams: { treatmentId: 'DFG3456SDFS342GHFD543245FDRGSTRE' }
            }
        },
        {
            input: {
                resource: 'figureCitations', 
                params: {
                    figureCitationId: 'DFG3456SDFS342GHFD543245FDRGSTRE'
                }
            },
            output: {
                constraints: [
                  "figureCitations.figureCitationId = 'DFG3456SDFS342GHFD543245FDRGSTRE'"
                ],
                runparams: { figureCitationId: 'DFG3456SDFS342GHFD543245FDRGSTRE' }
            }
        },
        {
            input: {
                resource: 'figureCitations',
                params: {
                    captionText: 'foo'
                }
            },
            output: {
                constraints: [ 'vfigurecitations MATCH @captionText' ],
                runparams: { captionText: 'foo' }
            }
        },
        {
            input: {
                resource: 'treatments', 
                params: {
                    authorityName: 'Agosti'
                }
            },
            output: {
                constraints: [ 'LOWER(authorityName) LIKE @authorityName' ],
                runparams: { authorityName: 'agosti%' }
            }
        }
    ]

    tests.forEach(t => {
        test(`${i(t.input)} -> ${o(t.output)}`, () => {
            expect(getConstraints(t.input)).toEqual(t.output)
        })
    })
})