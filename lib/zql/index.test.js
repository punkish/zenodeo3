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
                    "count": "SELECT Count(treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE validGeo = @validGeo AND treatments.deleted = 0",
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
            searchparams: 'validGeo=1&geolocation=contained_in({lower_left:{lat:40.78885994449482,lng:11.601562500000002},upper_right:{lat:47.931066347509784,lng:26.960449218750004}})&size=1000&cols=latitude&cols=longitude&cols=isOnLand&cols=treatmentTitle'
        },
        output: {
            "queries": {
                "main": {
                    "count": "SELECT Count(treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE validGeo = @validGeo AND latitude BETWEEN @min_lat AND @max_lat AND longitude BETWEEN @min_lng AND @max_lng AND treatments.deleted = 0",
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
                    "count": "SELECT Count(treatments.treatmentId) AS num_of_records FROM treatments LEFT JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId WHERE treatments.treatmentId = '03849624FF8CFFE3FF30FAAAD0E6FA0D'",
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
                    "count": "SELECT Count(treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND validGeo = @validGeo AND treatments.deleted = 0",
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
            searchparams: 'q=Agosti&validGeo=1&geolocation=contained_in({lower_left:{lat:40.78885994449482,lng:11.601562500000002},upper_right:{lat:47.931066347509784,lng:26.960449218750004}})&size=1000&cols=latitude&cols=longitude&cols=isOnLand&cols=treatmentTitle'
        },
        output: {
            "queries": {
                "main": {
                    "count": "SELECT Count(treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND validGeo = @validGeo AND latitude BETWEEN @min_lat AND @max_lat AND longitude BETWEEN @min_lng AND @max_lng AND treatments.deleted = 0",
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
    },

    // treatment view queries
    // {
    //     desc: 'count of all treatments with images',
    //     input: {
    //         resource: 'treatments',
    //         searchparams: 'httpUri=ne()&cols='
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(Distinct treatments.treatmentId) AS num_of_records FROM treatments LEFT JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId WHERE LOWER(httpUri) != @httpUri AND treatments.deleted = 0",
    //                 "full": ""
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "httpUri": ""
    //         }
    //     }
    // },

    // {
    //     desc: 'figures of a specific treatment',
    //     input: {
    //         resource: 'treatments',
    //         searchparams: 'treatmentId=03849624FF8CFFE3FF30FAAAD0E6FA0D&cols=httpUri&cols=captionText'
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(Distinct treatments.treatmentId) AS num_of_records FROM treatments LEFT JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId WHERE treatments.treatmentId = '03849624FF8CFFE3FF30FAAAD0E6FA0D'",
    //                 "full": "SELECT treatments.treatmentId, httpUri, captionText FROM treatments LEFT JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId WHERE treatments.treatmentId = '03849624FF8CFFE3FF30FAAAD0E6FA0D'"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "treatmentId": "03849624FF8CFFE3FF30FAAAD0E6FA0D"
    //         }
    //     }
    // },

    // {
    //     desc: 'figures of treatments from a search query',
    //     input: {
    //         resource: 'treatments',
    //         searchparams: 'q=Agosti&httpUri=ne()&cols=httpUri&cols=captionText'
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(Distinct treatments.treatmentId) AS num_of_records FROM treatments LEFT JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND LOWER(httpUri) != @httpUri AND treatments.deleted = 0",
    //                 "full": "SELECT treatments.treatmentId, httpUri, captionText FROM treatments LEFT JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND LOWER(httpUri) != @httpUri AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "q": "Agosti",
    //             "httpUri": ""
    //         }
    //     }
    // },
    {
        "desc": "figures for a treatmentId",
        "input": {
            "resource": "figureCitations",
            "searchparams": "treatmentId=BF8A576EC3F6661E96B5590C108213BA&cols=httpUri&cols=captionText"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(figureCitations.figureCitationId) AS num_of_records FROM figureCitations WHERE treatmentId = @treatmentId",
                    "full": "SELECT figureCitations.figureCitationId, httpUri, figureCitations.captionText FROM figureCitations WHERE treatmentId = @treatmentId ORDER BY figureCitations.figureCitationId ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatmentId": "BF8A576EC3F6661E96B5590C108213BA"
            }
        }
    },
    {
        "desc": "figures for a query for string in full text of treatments",
        "input": {
            "resource": "treatments",
            "searchparams": "q=Agosti&httpUri=ne()&cols=httpUri&cols=captionText"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(treatments.treatmentId) AS num_of_records FROM treatments LEFT JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND LOWER(httpUri) != @httpUri AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, httpUri, captionText FROM treatments LEFT JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND LOWER(httpUri) != @httpUri AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "q": "Agosti",
                "httpUri": ""
            }
        }
    },
    {
        "desc": "count of treatments with valid locations",
        "input": {
            "resource": "treatments",
            "searchparams": "validGeo=1&cols="
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE validGeo = @validGeo AND treatments.deleted = 0",
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
        "desc": "treatments with checkinTime since yesterday",
        "input": {
            "resource": "treatments",
            "searchparams": "checkinTime=since(yesterday)"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(treatments.treatmentId) AS num_of_records FROM treatments WHERE checkinTime >= strftime('%s', @date) * 1000 AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, treatmentTitle, treatmentDOI, treatmentLSID, articleId, articleTitle, articleAuthor, articleDOI, publicationDate, journalTitle, journalYear, journalVolume, journalIssue, pages, authorityName, authorityYear, kingdom, phylum, \"order\", family, genus, species, status, taxonomicNameLabel, treatments.rank, updateTime, checkinTime FROM treatments WHERE checkinTime >= strftime('%s', @date) * 1000 AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "date": "2022-02-21"
            }
        }
    },
    {
        "desc": "treatments with query in full text and given authorityName",
        "input": {
            "resource": "treatments",
            "searchparams": "q=tyrannosaurus&authorityName=osborn"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(treatments.treatmentId) AS num_of_records FROM treatments JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND LOWER(authorityName) LIKE @authorityName AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, treatmentTitle, treatmentDOI, treatmentLSID, articleId, articleTitle, articleAuthor, articleDOI, publicationDate, journalTitle, journalYear, journalVolume, journalIssue, pages, authorityName, authorityYear, kingdom, phylum, \"order\", family, genus, species, status, taxonomicNameLabel, treatments.rank, updateTime, checkinTime FROM treatments JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND LOWER(authorityName) LIKE @authorityName AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "q": "tyrannosaurus",
                "authorityName": "osborn%"
            }
        }
    },
    {
        "desc": "treatments with treatmentTitle starting with given text",
        "input": {
            "resource": "treatments",
            "searchparams": "treatmentTitle=starts_with(Ichneumonoidea)"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(treatments.treatmentId) AS num_of_records FROM treatments WHERE LOWER(treatmentTitle) LIKE @treatmentTitle AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, treatmentTitle, treatmentDOI, treatmentLSID, articleId, articleTitle, articleAuthor, articleDOI, publicationDate, journalTitle, journalYear, journalVolume, journalIssue, pages, authorityName, authorityYear, kingdom, phylum, \"order\", family, genus, species, status, taxonomicNameLabel, treatments.rank, updateTime, checkinTime FROM treatments WHERE LOWER(treatmentTitle) LIKE @treatmentTitle AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatmentTitle": "ichneumonoidea%"
            }
        }
    },
    {
        "desc": "treatments with treatmentTitle starting with given text (alternative version)",
        "input": {
            "resource": "treatments",
            "searchparams": "treatmentTitle=eq(Ichneumonoidea)"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(treatments.treatmentId) AS num_of_records FROM treatments WHERE LOWER(treatmentTitle) = @treatmentTitle AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, treatmentTitle, treatmentDOI, treatmentLSID, articleId, articleTitle, articleAuthor, articleDOI, publicationDate, journalTitle, journalYear, journalVolume, journalIssue, pages, authorityName, authorityYear, kingdom, phylum, \"order\", family, genus, species, status, taxonomicNameLabel, treatments.rank, updateTime, checkinTime FROM treatments WHERE LOWER(treatmentTitle) = @treatmentTitle AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatmentTitle": "ichneumonoidea"
            }
        }
    },
    {
        "desc": "treatments with exact given treatmentTitle with facets",
        "input": {
            "resource": "treatments",
            "searchparams": "treatmentTitle=Ichneumonoidea&facets=true"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(treatments.treatmentId) AS num_of_records FROM treatments WHERE LOWER(treatmentTitle) LIKE @treatmentTitle AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, treatmentTitle, treatmentDOI, treatmentLSID, articleId, articleTitle, articleAuthor, articleDOI, publicationDate, journalTitle, journalYear, journalVolume, journalIssue, pages, authorityName, authorityYear, kingdom, phylum, \"order\", family, genus, species, status, taxonomicNameLabel, treatments.rank, updateTime, checkinTime FROM treatments WHERE LOWER(treatmentTitle) LIKE @treatmentTitle AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {
                    "journalTitle": "SELECT journalTitle, count FROM (SELECT journalTitle, Count(journalTitle) AS count FROM treatments WHERE journalTitle != '' GROUP BY journalTitle HAVING count > 100 ORDER BY count DESC LIMIT 50) AS t ORDER BY journalTitle ASC",
                    "journalYear": "SELECT journalYear, count FROM (SELECT journalYear, Count(journalYear) AS count FROM treatments WHERE journalYear != '' GROUP BY journalYear HAVING count > 1 ORDER BY count DESC LIMIT 50) AS t ORDER BY journalYear ASC",
                    "rank": "SELECT rank, count FROM (SELECT rank, Count(rank) AS count FROM treatments WHERE rank != '' GROUP BY rank HAVING count > 1 ORDER BY count DESC LIMIT 50) AS t ORDER BY rank ASC",
                    "status": "SELECT status, count FROM (SELECT status, Count(status) AS count FROM treatments WHERE status != '' GROUP BY status HAVING count > 1 ORDER BY count DESC LIMIT 50) AS t ORDER BY status ASC"
                }
            },
            "runparams": {
                "treatmentTitle": "ichneumonoidea%"
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