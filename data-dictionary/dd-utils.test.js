'use strict'

import { ddu } from './utils/index.js';

describe('getResources: returns all available resource', () => {
    const tests = [
        {
            input: '',
            output: [
                'root',
                'etlStats',
                'treatments',
                'materialCitations',
                'treatmentCitations',
                'bibRefCitations',
                'figureCitations',
                'treatmentImages',
                'collectionCodes',
                'families',
                'images',
                'publications'
            ]
        }
    ]

    tests.forEach(t => {
        test(`available resources -> "${JSON.stringify(t.output, null, 2)}"`, () => {
            expect(ddu.getResources()).toEqual(t.output)
        })
    })
})

describe('getSourceOfResource: given a resource, returns its source', () => {
    const tests = [
        { input: 'images',  output: 'zenodo' },
        { input: 'publications', output: 'zenodo' },
        { input: 'treatments', output: 'zenodeo' },
        { input: 'treatmentCitations', output: 'zenodeo' },
        { input: 'bibRefCitations', output: 'zenodeo' },
        { input: 'figureCitations', output: 'zenodeo' },
        { input: 'materialCitations', output: 'zenodeo' },
        { input: 'collectionCodes', output: 'zenodeo' },
        { input: 'families', output: 'zenodeo' }
    ]

    tests.forEach(t => {
        test(`source of ${t.input} -> "${t.output}"`, () => {
            expect(ddu.getSourceOfResource(t.input)).toBe(t.output)
        })
    })
})

describe('getResourceid: given a resource, returns its resourceId', () => {
    const tests = [
        { input: 'treatments', output: 'treatments.treatmentId' },
        { input: 'bibRefCitations', output: 'bibRefCitations.bibRefCitationId' },
        { input: 'collectionCodes', output: 'collectionCodes.collectionCode' },
        { input: 'figureCitations', output: 'figureCitations.figureCitationId' },
        { input: 'materialCitations', output: 'materialsCitations.materialsCitationId' },
        { input: 'treatmentCitations', output: 'treatmentCitations.treatmentCitationId' },
        { input: 'families', output: 'families.id' },
        { input: 'images', output: 'images.id' },
        { input: 'publications', output: 'publications.id' }
    ]

    tests.forEach(t => {
        test(`resource ${t.input} -> resourceId "${t.output}"`, () => {
            expect(ddu.getResourceid(t.input)).toEqual(t.output)
        })
    })
})

describe('getFacetCols: given a resource, returns its facet columns', () => {
    const tests = [
        { 
            input: 'treatments', 
            output: [
                { name: 'journalTitle', facet: 'count > 100' },
                { name: 'journalYear', facet: 'count > 1' },
                { name: 'status', facet: 'count > 1' },
                { name: 'rank', facet: 'count > 1' }
            ] 
        }
    ]

    tests.forEach(t => {
        test(`resource ${t.input} -> facets "${t.output}"`, () => {
            expect(ddu.getFacetCols(t.input)).toEqual(t.output)
        })
    })
})

// const dispatch = {
//     getQueryableParams,
//     // getCols,
//     // getDefaultCols,
//     getSqlCols,
//     getSelect,
//     getWhere,
//     getZqltype,
//     getQueryStringSchema,
//     getResourceid,
//     getJoin,
//     getNotCols,
//     // getSqlDefs
//     tableFromResource
// }