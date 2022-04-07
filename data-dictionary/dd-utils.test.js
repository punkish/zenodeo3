'use strict'

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
                'treatmentImages',
                'collectionCodes',
                'images',
                'publications',
                'families'
            ]
        }
    ]

    tests.forEach(t => {
        test(`available resources -> "${JSON.stringify(t.output, null, 2)}"`, () => {
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
        }
    ]

    tests.forEach(t => {
        test(`source of ${t.input} -> "${t.output}"`, () => {
            expect(ddUtils.getSourceOfResource(t.input)).toBe(t.output)
        })
    })
})

describe('getResourcesFromSource: given a source, returns its resources', () => {
    const tests = [
        {
            input: 'zenodo',
            output: [ 'images', 'publications' ]
        },
        {
            input: 'zenodeo',
            output: [
                'treatments',
                'treatmentCitations',
                'bibRefCitations',
                'figureCitations',
                'materialsCitations',
                'treatmentImages',
                'collectionCodes',
                'families'
            ]
        },
    ]

    tests.forEach(t => {
        test(`source ${t.input} -> resources "${JSON.stringify(t.output, null, 2)}"`, () => {
            expect(ddUtils.getResourcesFromSource(t.input)).toEqual(t.output)
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
                selname: 'bibRefCitations.bibRefCitationId'
            }
        },
        {
            input: 'collectionCodes',
            output: { 
                name: 'collectionCode', 
                selname: 'collectionCodes.collectionCode' 
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
                selname: 'treatmentCitations.treatmentCitationId'
            }
        },
        {
            input: 'families',
            output: { name: 'id', selname: 'families.id' }
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
        }
    ]

    tests.forEach(t => {
        test(`resource ${t.input} -> resourceId "${JSON.stringify(t.output, null, 2)}"`, () => {
            expect(ddUtils.getResourceid(t.input)).toEqual(t.output)
        })
    })
})

/*
describe('getParamsNameAndSelname: given a resource, returns its params', () => {
    const tests = [
        {
            input: 'treatments',
            output: [
                { name: 'treatmentId', selname: 'treatments.treatmentId' },
                { name: 'treatmentTitle', selname: undefined },
                { name: 'treatmentVersion', selname: undefined },
                { name: 'treatmentDOI', selname: undefined },
                { name: 'treatmentLSID', selname: undefined },
                { name: 'zenodoDep', selname: undefined },
                { name: 'zoobankId', selname: undefined },
                { name: 'articleId', selname: undefined },
                { name: 'articleTitle', selname: undefined },
                { name: 'articleAuthor', selname: undefined },
                { name: 'articleDOI', selname: undefined },
                { name: 'publicationDate', selname: undefined },
                { name: 'journalTitle', selname: undefined },
                { name: 'journalYear', selname: undefined },
                { name: 'journalVolume', selname: undefined },
                { name: 'journalIssue', selname: undefined },
                { name: 'pages', selname: undefined },
                { name: 'authorityName', selname: undefined },
                { name: 'authorityYear', selname: undefined },
                { name: 'kingdom', selname: undefined },
                { name: 'phylum', selname: undefined },
                { name: 'order', selname: '"order"' },
                { name: 'family', selname: undefined },
                { name: 'genus', selname: undefined },
                { name: 'species', selname: undefined },
                { name: 'status', selname: undefined },
                { name: 'taxonomicNameLabel', selname: undefined },
                { name: 'rank', selname: 'treatments.rank' },
                { name: 'latitude', selname: undefined },
                { name: 'longitude', selname: undefined },
                { name: 'geolocation', selname: undefined },
                { name: 'isOnLand', selname: undefined },
                { name: 'validGeo', selname: undefined },
                { name: 'collectionCode', selname: undefined },
                {
                name: 'fulltext',
                selname: "highlight(vtreatments, 1, '<b>', '</b>') fulltext"
                },
                {
                name: 'q',
                selname: "snippet(vtreatments, 1, '<b>', '</b>', '…', 25) snippet"
                },
                { name: 'updateTime', selname: undefined },
                { name: 'checkinTime', selname: undefined },
                { name: 'httpUri', selname: undefined },
                { name: 'captionText', selname: undefined },
                { name: 'deleted', selname: 'treatments.deleted' },
                { name: 'refreshCache', selname: undefined },
                { name: 'facets', selname: undefined },
                { name: 'relatedRecords', selname: undefined },
                { name: 'page', selname: undefined },
                { name: 'size', selname: undefined },
                { name: 'sortby', selname: undefined },
                { name: 'cols', selname: undefined }
            ]
        },
        {
            input: 'bibRefCitations',
            output: [
                { name: 'bibRefCitationId', selname: undefined },
                { name: 'treatmentId', selname: undefined },
                { name: 'refString', selname: undefined },
                {
                  name: 'q',
                  selname: "snippet(vtreatments, 1, '<b>', '</b>', '…', 25) snippet"
                },
                { name: 'type', selname: undefined },
                { name: 'year', selname: undefined },
                { name: 'refreshCache', selname: undefined },
                { name: 'facets', selname: undefined },
                { name: 'relatedRecords', selname: undefined },
                { name: 'page', selname: undefined },
                { name: 'size', selname: undefined },
                { name: 'sortby', selname: undefined },
                { name: 'cols', selname: undefined }
            ]
        },
        {
            input: 'collectionCodes',
            output: [
                { name: 'collectionCode', selname: undefined },
                { name: 'institution_name', selname: undefined },
                { name: 'refreshCache', selname: undefined },
                { name: 'facets', selname: undefined },
                { name: 'relatedRecords', selname: undefined },
                { name: 'page', selname: undefined },
                { name: 'size', selname: undefined },
                { name: 'sortby', selname: undefined },
                { name: 'cols', selname: undefined }
            ]
        },
        {
            input: 'figureCitations',
            output: [
                {
                  name: 'figureCitationId',
                  selname: 'figureCitations.figureCitationId'
                },
                { name: 'treatmentId', selname: undefined },
                { name: 'figureNum', selname: 'figureCitations.figureNum' },
                { name: 'captionText', selname: 'figureCitations.captionText' },
                { name: 'httpUri', selname: undefined },
                { name: 'hasImage', selname: "Iif(httpUri = '', 0, 1) AS hasImage" },
                { name: 'refreshCache', selname: undefined },
                { name: 'facets', selname: undefined },
                { name: 'relatedRecords', selname: undefined },
                { name: 'page', selname: undefined },
                { name: 'size', selname: undefined },
                { name: 'sortby', selname: undefined },
                { name: 'cols', selname: undefined }
            ]
        },
        {
            input: 'materialsCitations',
            output: [
                {
                  name: 'materialsCitationId',
                  selname: 'materialsCitations.materialsCitationId'
                },
                { name: 'treatmentId', selname: undefined },
                { name: 'collectingDate', selname: undefined },
                { name: 'collectionCode', selname: 'collectionCodes.collectionCode' },
                { name: 'institution_name', selname: undefined },
                { name: 'collectorName', selname: undefined },
                { name: 'country', selname: undefined },
                { name: 'collectingRegion', selname: undefined },
                { name: 'municipality', selname: undefined },
                { name: 'county', selname: undefined },
                { name: 'stateProvince', selname: undefined },
                { name: 'location', selname: undefined },
                { name: 'locationDeviation', selname: undefined },
                { name: 'specimenCountFemale', selname: undefined },
                { name: 'specimenCountMale', selname: undefined },
                { name: 'specimenCount', selname: undefined },
                { name: 'specimenCode', selname: undefined },
                { name: 'typeStatus', selname: undefined },
                { name: 'determinerName', selname: undefined },
                { name: 'collectedFrom', selname: undefined },
                { name: 'collectingMethod', selname: undefined },
                { name: 'latitude', selname: undefined },
                { name: 'longitude', selname: undefined },
                { name: 'geolocation', selname: undefined },
                { name: 'isOnLand', selname: undefined },
                { name: 'validGeo', selname: undefined },
                { name: 'elevation', selname: undefined },
                { name: 'httpUri', selname: undefined },
                { name: 'materialsCitation', selname: undefined },
                { name: 'deleted', selname: 'materialsCitations.deleted' },
                { name: 'refreshCache', selname: undefined },
                { name: 'facets', selname: undefined },
                { name: 'relatedRecords', selname: undefined },
                { name: 'page', selname: undefined },
                { name: 'size', selname: undefined },
                { name: 'sortby', selname: undefined },
                { name: 'cols', selname: undefined }
            ]
        },
        {
            input: 'treatmentCitations',
            output: [
                { name: 'treatmentCitationId', selname: undefined },
                { name: 'treatmentId', selname: undefined },
                { name: 'treatmentCitation', selname: undefined },
                { name: 'refString', selname: undefined },
                { name: 'refreshCache', selname: undefined },
                { name: 'facets', selname: undefined },
                { name: 'relatedRecords', selname: undefined },
                { name: 'page', selname: undefined },
                { name: 'size', selname: undefined },
                { name: 'sortby', selname: undefined },
                { name: 'cols', selname: undefined }
            ]
        },
        {
            input: 'families',
            output: [
                { name: 'id', selname: undefined },
                { name: 'q', selname: 'family' },
                { name: 'refreshCache', selname: undefined },
                { name: 'facets', selname: undefined },
                { name: 'relatedRecords', selname: undefined },
                { name: 'page', selname: undefined },
                { name: 'size', selname: undefined },
                { name: 'sortby', selname: undefined },
                { name: 'cols', selname: undefined }
            ]
        },
        {
            input: 'images',
            output: [
                { name: 'id', selname: undefined },
                { name: 'subtype', selname: undefined },
                { name: 'communities', selname: undefined },
                { name: 'q', selname: undefined },
                { name: 'creator', selname: undefined },
                { name: 'title', selname: undefined },
                { name: 'keywords', selname: undefined },
                { name: 'refreshCache', selname: undefined },
                { name: 'facets', selname: undefined },
                { name: 'relatedRecords', selname: undefined },
                { name: 'page', selname: undefined },
                { name: 'size', selname: undefined },
                { name: 'sortby', selname: undefined },
                { name: 'cols', selname: undefined }
            ]
        },
        {
            input: 'publications',
            output: [
                { name: 'id', selname: undefined },
                { name: 'subtype', selname: undefined },
                { name: 'communities', selname: undefined },
                { name: 'q', selname: undefined },
                { name: 'creator', selname: undefined },
                { name: 'title', selname: undefined },
                { name: 'keywords', selname: undefined },
                { name: 'refreshCache', selname: undefined },
                { name: 'facets', selname: undefined },
                { name: 'relatedRecords', selname: undefined },
                { name: 'page', selname: undefined },
                { name: 'size', selname: undefined },
                { name: 'sortby', selname: undefined },
                { name: 'cols', selname: undefined }
            ]
        }
    ]

    tests.forEach(t => {
        test(`resource ${t.input}`, () => {
            expect(ddUtils.getParamsNameAndSelname(t.input)).toEqual(t.output)
        })
    })
})
*/