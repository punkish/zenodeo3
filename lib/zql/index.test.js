'use strict'

const {preZql} = require('../../lib/zql/index.js')

const ocellusQueries = [

    // map view queries
    {
        desc: 'count of all treatments with locations',
        input: {
            resource: 'treatments',
            searchparams: 'validGeo=1&cols='
        },
        output: {
            "queries": {
                "main": {
                    "count": "SELECT Count(Distinct treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE validGeo = @validGeo AND treatments.deleted = 0",
                    "full": ""
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "validGeo": 1
            }
        }
    },

    {
        desc: 'treatments with valid latlng within a bounding box',
        input: {
            resource: 'treatments',
            searchparams: 'validGeo=1&geolocation=containedIn({lowerLeft:{lat:40.78885994449482,lng:11.601562500000002},upperRight:{lat:47.931066347509784,lng:26.960449218750004}})&size=1000&cols=latitude&cols=longitude&cols=isOnLand&cols=treatmentTitle'
        },
        output: {
            "queries": {
                "main": {
                    "count": "SELECT Count(Distinct treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE validGeo = @validGeo AND latitude BETWEEN @min_lat AND @max_lat AND longitude BETWEEN @min_lng AND @max_lng AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, latitude, longitude, isOnLand, treatmentTitle FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE validGeo = @validGeo AND latitude BETWEEN @min_lat AND @max_lat AND longitude BETWEEN @min_lng AND @max_lng AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 1000 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "validGeo": 1,
                "min_lat": "40.78885994449482",
                "max_lat": "47.931066347509784",
                "min_lng": "11.601562500000002",
                "max_lng": "26.960449218750004"
            }
        }
    },

    {
        desc: 'figures of a specific treatment',
        input: {
            resource: 'treatments',
            searchparams: 'treatmentId=03849624FF8CFFE3FF30FAAAD0E6FA0D&cols=httpUri&cols=captionText'
        },
        output: {
            "queries": {
                "main": {
                    "count": "SELECT Count(Distinct treatments.treatmentId) AS num_of_records FROM treatments LEFT JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId WHERE treatments.treatmentId = '03849624FF8CFFE3FF30FAAAD0E6FA0D'",
                    "full": "SELECT treatments.treatmentId, httpUri, captionText FROM treatments LEFT JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId WHERE treatments.treatmentId = '03849624FF8CFFE3FF30FAAAD0E6FA0D'"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatmentId": "03849624FF8CFFE3FF30FAAAD0E6FA0D"
            }
        }
    },

    {
        desc: 'treatments with locations for any query',
        input: {
            resource: 'treatments',
            searchparams: 'q=Agosti&validGeo=1&cols=latitude&cols=longitude&cols=isOnLand&cols=treatmentTitle'
        },
        output: {
            "queries": {
                "main": {
                    "count": "SELECT Count(Distinct treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND validGeo = @validGeo AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, latitude, longitude, isOnLand, treatmentTitle FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND validGeo = @validGeo AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "q": "Agosti",
                "validGeo": 1
            }
        }
    },

    {
        desc: 'treatments with locations for any query within a bounding box',
        input: {
            resource: 'treatments',
            searchparams: 'q=Agosti&validGeo=1&geolocation=containedIn({lowerLeft:{lat:40.78885994449482,lng:11.601562500000002},upperRight:{lat:47.931066347509784,lng:26.960449218750004}})&size=1000&cols=latitude&cols=longitude&cols=isOnLand&cols=treatmentTitle'
        },
        output: {
            "queries": {
                "main": {
                    "count": "SELECT Count(Distinct treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND validGeo = @validGeo AND latitude BETWEEN @min_lat AND @max_lat AND longitude BETWEEN @min_lng AND @max_lng AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, latitude, longitude, isOnLand, treatmentTitle FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND validGeo = @validGeo AND latitude BETWEEN @min_lat AND @max_lat AND longitude BETWEEN @min_lng AND @max_lng AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 1000 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "q": "Agosti",
                "validGeo": 1,
                "min_lat": "40.78885994449482",
                "max_lat": "47.931066347509784",
                "min_lng": "11.601562500000002",
                "max_lng": "26.960449218750004"
            }
        }
    }
];

describe('zql: given a query, returns the sql and runparams', () => {
    const tests = [ ...ocellusQueries ]

    tests.forEach((t, i) => {
        test(t.desc, () => {
            expect(preZql(t.input)).toEqual(t.output)
        })
    })
})