'use strict'

const zql = require('../lib/zql/index.js')

describe('zql: given a query, returns the sql and runparams', () => {
    const tests = [
        {
            input: {
                resource: 'treatments',
                params: {
                    q: 'Meshram',
                    location: 'within(radius:50, units: kilometers, lat:25.6532, lng:3.48)',
                    rank: 'species',
                    deleted: 'true',
                    $page: '7',
                    $size: '70',
                    $cols: [
                        'treatmentId',
                        'treatmentTitle'
                    ],
                    $sortby: 'journalYear:asc, zenodoDep:desc'
                }
            },
            output: {
                countSql: "SELECT Count(treatments.treatmentId) AS num_of_records FROM treatments JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH 'Meshram' AND latitude BETWEEN @min_lat AND @max_lat AND longitude BETWEEN @min_lng AND @max_lng AND treatments.rank = 'species' AND deleted = true", 
                fullSql: "SELECT treatments.treatmentId, treatmentTitle FROM treatments JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH 'Meshram' AND latitude BETWEEN @min_lat AND @max_lat AND longitude BETWEEN @min_lng AND @max_lng AND treatments.rank = 'species' AND deleted = true ORDER BY journalYear ASC, zenodoDep DESC LIMIT 70 OFFSET 6", 
                runparams: {
                    vtreatments:"Meshram",
                    min_lat:25.203539818137727,
                    max_lat:26.102860181862265,
                    min_lng:2.981173042933781,
                    max_lng:3.9788269570662194,
                    "treatments.rank":"species",
                    deleted: true
                }
            }
        },
        {
            input: {
                resource: 'treatments',
                params: {
                    treatmentId: 'DFG3456SDFS342GHFD543245FDRGSTRE',
                    $page: 3,
                    $size: 25,
                    $cols: [
                        'treatmentTitle',
                        'treatmentDOI'
                    ]
                }
            },
            output: {
                countSql: "SELECT Count(treatments.treatmentId) AS num_of_records FROM treatments WHERE treatments.treatmentId = 'DFG3456SDFS342GHFD543245FDRGSTRE' AND deleted = false",
                fullSql: "SELECT treatments.treatmentId, treatmentTitle, treatmentDOI FROM treatments WHERE treatments.treatmentId = 'DFG3456SDFS342GHFD543245FDRGSTRE' AND deleted = false",
                runparams: { 
                    "deleted": false,
                    'treatments.treatmentId': 'DFG3456SDFS342GHFD543245FDRGSTRE' 
                }
            }
        },

        // this input should fail validation because 
        // 'qs' is not a valid param
        {
            input: {
                resource: 'treatments',
                params: {
                    qs: 'Meshram'
                }
            },
            output: false
        }
    ]

    tests.forEach((t, i) => {
        test(`zql input ${i}`, () => {
            expect(zql(t.input)).toEqual(t.output)
        })
    })
})