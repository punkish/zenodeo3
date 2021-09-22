'use strict'

const chalk = require('chalk')
const i = (i) => chalk.bold.blue(i)
const o = (o) => chalk.bold.green(o)

const {
    validate,
    formatDate,
    nonzqlConstraint,
    zqlConstraint,
    stringConstraint,
    nonstringConstraint,
    err,
    packMatch
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
            output: {"$cols": ["treatmentId", "treatmentTitle", "treatmentDOI", "treatmentLSID", "articleId", "articleTitle", "articleAuthor", "articleDOI", "publicationDate", "journalTitle", "journalYear", "journalVolume", "journalIssue", "pages", "authorityName", "authorityYear", "kingdom", "phylum", "order", "family", "genus", "species", "status", "taxonomicNameLabel", "rank"], "$facets": false, "$page": 1, "$refreshCache": false, "$size": 30, "$sortby": "treatments.treatmentId:ASC", "authorityName": "starts_with(Agosti)", "deleted": false}
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
        xtest(`${i(t.input)} converted to ${o(t.output)}`, () => {
            expect(formatDate(t.input)).toBe(t.output)
        })
    })
})

describe('nonzqlConstraint: given a k,v pair, returns the constraint', () => {
    const tests = [
        {
            input: ['treatments', 'treatmentId', 'DFG3456SDFS342GHFD543245FDRGSTRE'],
            output: {
                constraint: [ "treatments.treatmentId = 'DFG3456SDFS342GHFD543245FDRGSTRE'" ],
                runparam: { "treatments.treatmentId": "DFG3456SDFS342GHFD543245FDRGSTRE" }
            }
        },
        {
            input: ['figureCitations', 'figureCitationId', 'DFG3456SDFS342GHFD543245FDRGSTRE'],
            output: {
                constraint: [ "figureCitations.figureCitationId = 'DFG3456SDFS342GHFD543245FDRGSTRE'" ],
                runparam: { "figureCitations.figureCitationId": "DFG3456SDFS342GHFD543245FDRGSTRE" }
            }
        },
        {
            input: ['figureCitations', 'captionText', 'foo'],
            output: {
                constraint: [ "vfigurecitations MATCH 'foo'" ],
                runparam: { "vfigurecitations": "foo" }
            }
        },
        {
            input: ['treatments', 'authorityName', 'Agosti'],
            output: {
                constraint: [ "LOWER(authorityName) LIKE 'agosti%'" ],
                runparam: { 
                    "authorityName": "agosti"
                }
            }
        },
        {
            input: ['fake', 'fakeText', 'Agosti'],
            output: {
                constraint: [ "fakeText = 'Agosti'" ],
                runparam: { 
                    "fakeText": "Agosti"
                }
            }
        },
        {
            input: ['fake', 'fakeTextEq', 'Agosti'],
            output: {
                constraint: [ "fakeTextEq = 'Agosti'" ],
                runparam: { 
                    "fakeTextEq": "Agosti"
                }
            }
        },
        {
            input: ['fake', 'fakeTextLike', 'Agosti'],
            output: {
                constraint: [ "LOWER(fakeTextLike) LIKE 'agosti'" ],
                runparam: { 
                    "fakeTextLike": "agosti"
                }
            }
        },
        {
            input: ['fake', 'fakeTextContains', 'Agosti'],
            output: {
                constraint: [ "LOWER(fakeTextContains) LIKE '%agosti%'" ],
                runparam: { 
                    "fakeTextContains": "agosti"
                }
            }
        },
        {
            input: ['fake', 'fakeTextEndsWith', 'Agosti'],
            output: {
                constraint: [ "LOWER(fakeTextEndsWith) LIKE '%agosti'" ],
                runparam: { 
                    "fakeTextEndsWith": "agosti"
                }
            }
        },
    ]

    tests.forEach(t => {
        xtest(`${i(t.input.join(', '))} -> ${o(t.output.constraint.join(', '))}`, () => {
            expect(nonzqlConstraint(...t.input)).toEqual({
                constraint: t.output.constraint,
                runparam: t.output.runparam
            })
        })
    })
})

describe('zqlConstraint: given a k,v pair, returns the constraint', () => {
    const tests = [
        {
            input: ['treatments', 'treatmentId', 'DFG3456SDFS342GHFD543245FDRGSTRE'],
            output: {
                constraint: [ "treatments.treatmentId = 'DFG3456SDFS342GHFD543245FDRGSTRE'" ],
                runparam: { "treatments.treatmentId": "DFG3456SDFS342GHFD543245FDRGSTRE" }
            }
        },
        {
            input: ['treatments', 'authorityName', 'ends_with(gosti)'],
            output: {
                constraint: [ "LOWER(authorityName) LIKE 'agosti%'" ],
                runparam: { 
                    "authorityName": "gosti"
                }
            }
        },
        {
            input: ['treatments', 'publicationDate', 'between(2000-2-02 and 2001-12-12)'],
            output: {
                constraint: [ "publicationDate BETWEEN date('2000-02-02') AND date('2001-12-12')" ],
                runparam: { 
                    "from": "date('2000-02-02')",
                    "to": "date('2001-12-12')"
                }
            }
        },
        {
            input: ['fake', 'fakeTextEndsWith', 'Agosti'],
            output: {
                constraint: [ "LOWER(fakeTextEndsWith) LIKE '%agosti'" ],
                runparam: { 
                    "fakeTextEndsWith": "agosti"
                }
            }
        },
    ]

    tests.forEach(t => {
        xtest(`${i(t.input.join(', '))} -> ${o(t.output.constraint.join(', '))}`, () => {
            expect(zqlConstraint(...t.input)).toEqual({
                constraint: t.output.constraint,
                runparam: t.output.runparam
            })
        })
    })
})
// test('packMatch', () => {
//     expect(packMatch(true, [ 'foo = "bar"' ], ))
// })