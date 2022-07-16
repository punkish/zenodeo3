export const sampleQueries = [

    // map view queries
    //0
    {
        desc: 'count of all treatments with locations',
        input: {
            resource: 'treatments',
            searchparams: 'validGeo=true&cols='
        },
        output: {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE materialsCitations.validGeo = 1 AND treatments.deleted = 0",
                    "full": ""
                },
                "related": {},
                "facets": {}
            },
            "runparams": {}
        }
    },

    //1
    {
        desc: 'treatments with valid latlng within a bounding box',
        input: {
            resource: 'treatments',
            searchparams: 'validGeo=true&geolocation=contained_in(lower_left:{lat:40.78885994449482,lng:11.601562500000002},upper_right:{lat:47.931066347509784,lng:26.960449218750004})&size=1000&cols=latitude&cols=longitude&cols=isOnLand&cols=treatmentTitle'
        },
        output: {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE materialsCitations.validGeo = 1 AND materialsCitations.latitude BETWEEN @min_lat AND @max_lat AND materialsCitations.longitude BETWEEN @min_lng AND @max_lng AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, materialsCitations.latitude, materialsCitations.longitude, materialsCitations.isOnLand, treatments.treatmentTitle FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE materialsCitations.validGeo = 1 AND materialsCitations.latitude BETWEEN @min_lat AND @max_lat AND materialsCitations.longitude BETWEEN @min_lng AND @max_lng AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 1000 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "min_lat": "40.78885994449482",
                "max_lat": "47.931066347509784",
                "min_lng": "11.601562500000002",
                "max_lng": "26.960449218750004"
            }
        }
    },

    //2
    {
        desc: 'figures of a specific treatment',
        input: {
            resource: 'treatments',
            searchparams: 'treatmentId=03849624FF8CFFE3FF30FAAAD0E6FA0D&cols=httpUri&cols=captionText'
        },
        output: {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId WHERE treatments.treatmentId = '03849624FF8CFFE3FF30FAAAD0E6FA0D'",
                    "full": "SELECT treatments.treatmentId, figureCitations.httpUri, figureCitations.captionText FROM treatments JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId WHERE treatments.treatmentId = '03849624FF8CFFE3FF30FAAAD0E6FA0D'"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatments.treatmentId": "03849624FF8CFFE3FF30FAAAD0E6FA0D"
            }
        }
    },

    //3
    {
        desc: 'treatments with locations for any query',
        input: {
            resource: 'treatments',
            searchparams: 'q=Agosti&validGeo=true&cols=latitude&cols=longitude&cols=isOnLand&cols=treatmentTitle'
        },
        output: {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND materialsCitations.validGeo = 1 AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, materialsCitations.latitude, materialsCitations.longitude, materialsCitations.isOnLand, treatments.treatmentTitle FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND materialsCitations.validGeo = 1 AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "q": "Agosti"
            }
        }
    },

    //4
    {
        desc: 'treatments with locations for any query within a bounding box',
        input: {
            resource: 'treatments',
            searchparams: 'q=Agosti&validGeo=true&geolocation=contained_in(lower_left:{lat:40.78885994449482,lng:11.601562500000002},upper_right:{lat:47.931066347509784,lng:26.960449218750004})&size=1000&cols=latitude&cols=longitude&cols=isOnLand&cols=treatmentTitle'
        },
        output: {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND materialsCitations.validGeo = 1 AND materialsCitations.latitude BETWEEN @min_lat AND @max_lat AND materialsCitations.longitude BETWEEN @min_lng AND @max_lng AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, materialsCitations.latitude, materialsCitations.longitude, materialsCitations.isOnLand, treatments.treatmentTitle FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND materialsCitations.validGeo = 1 AND materialsCitations.latitude BETWEEN @min_lat AND @max_lat AND materialsCitations.longitude BETWEEN @min_lng AND @max_lng AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 1000 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "min_lat": "40.78885994449482",
                "max_lat": "47.931066347509784",
                "min_lng": "11.601562500000002",
                "max_lng": "26.960449218750004",
                "q": "Agosti"
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
    //                 "count": "SELECT Count(Distinct treatments.treatmentId) AS num_of_records FROM treatments LEFT JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId WHERE Lower(httpUri) != @httpUri AND treatments.deleted = 0",
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
    //                 "count": "SELECT Count(Distinct treatments.treatmentId) AS num_of_records FROM treatments LEFT JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND Lower(httpUri) != @httpUri AND treatments.deleted = 0",
    //                 "full": "SELECT treatments.treatmentId, httpUri, captionText FROM treatments LEFT JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND Lower(httpUri) != @httpUri AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
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

    //5
    {
        "desc": "figures for a treatmentId",
        "input": {
            "resource": "figureCitations",
            "searchparams": "treatmentId=BF8A576EC3F6661E96B5590C108213BA&cols=httpUri&cols=captionText"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT figureCitations.figureCitationId) AS num_of_records FROM figureCitations WHERE figureCitations.treatmentId = @treatmentId",
                    "full": "SELECT figureCitations.figureCitationId, figureCitations.httpUri, figureCitations.captionText FROM figureCitations WHERE figureCitations.treatmentId = @treatmentId ORDER BY figureCitations.figureCitationId ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatmentId": "BF8A576EC3F6661E96B5590C108213BA"
            }
        }
    },

    //6
    {
        "desc": "figures for a query for string in full text of treatments",
        "input": {
            "resource": "treatments",
            "searchparams": "q=Agosti&httpUri=ne()&cols=httpUri&cols=captionText"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND Lower(figureCitations.httpUri) != @httpUri AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, figureCitations.httpUri, figureCitations.captionText FROM treatments JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND Lower(figureCitations.httpUri) != @httpUri AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
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

    //7
    {
        "desc": "count of treatments with valid locations",
        "input": {
            "resource": "treatments",
            "searchparams": "validGeo=true&cols="
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE materialsCitations.validGeo = 1 AND treatments.deleted = 0",
                    "full": ""
                },
                "related": {},
                "facets": {}
            },
            "runparams": {}
        }
    },

    //8
    {
        "desc": "treatments with checkinTime since 2022-02-21",
        "input": {
            "resource": "treatments",
            "searchparams": "checkinTime=since(2022-02-21)"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments WHERE treatments.checkinTime >= strftime('%s', @date) * 1000 AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalTitle, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.kingdom, treatments.phylum, treatments.\"order\", treatments.family, treatments.genus, treatments.species, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments WHERE treatments.checkinTime >= strftime('%s', @date) * 1000 AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "date": "2022-02-21"
            }
        }
    },

    //9
    {
        "desc": "treatments with query in full text and given authorityName",
        "input": {
            "resource": "treatments",
            "searchparams": "q=tyrannosaurus&authorityName=osborn"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND Lower(treatments.authorityName) LIKE @authorityName AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalTitle, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.kingdom, treatments.phylum, treatments.\"order\", treatments.family, treatments.genus, treatments.species, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND Lower(treatments.authorityName) LIKE @authorityName AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
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

    //10
    {
        "desc": "treatments with treatmentTitle starting with given text",
        "input": {
            "resource": "treatments",
            "searchparams": "treatmentTitle=starts_with(Ichneumonoidea)"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments WHERE Lower(treatments.treatmentTitle) LIKE @treatmentTitle AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalTitle, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.kingdom, treatments.phylum, treatments.\"order\", treatments.family, treatments.genus, treatments.species, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments WHERE Lower(treatments.treatmentTitle) LIKE @treatmentTitle AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatmentTitle": "ichneumonoidea%"
            }
        }
    },

    //11
    {
        "desc": "treatments with treatmentTitle starting with given text (alternative version)",
        "input": {
            "resource": "treatments",
            "searchparams": "treatmentTitle=eq(Ichneumonoidea)"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments WHERE Lower(treatments.treatmentTitle) = @treatmentTitle AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalTitle, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.kingdom, treatments.phylum, treatments.\"order\", treatments.family, treatments.genus, treatments.species, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments WHERE Lower(treatments.treatmentTitle) = @treatmentTitle AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatmentTitle": "ichneumonoidea"
            }
        }
    },

    //12
    {
        "desc": "treatments with exact given treatmentTitle with facets",
        "input": {
            "resource": "treatments",
            "searchparams": "treatmentTitle=Ichneumonoidea&facets=true"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments WHERE Lower(treatments.treatmentTitle) LIKE @treatmentTitle AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalTitle, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.kingdom, treatments.phylum, treatments.\"order\", treatments.family, treatments.genus, treatments.species, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments WHERE Lower(treatments.treatmentTitle) LIKE @treatmentTitle AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
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
    },

    //13
    {
        "desc": "treatments with fts search and images",
        "input": {
            "resource": "treatments",
            "searchparams": "q=phylogeny&page=1&size=30&httpUri=ne()&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=captionText"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND Lower(figureCitations.httpUri) != @httpUri AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.zenodoDep, figureCitations.httpUri, figureCitations.captionText FROM treatments JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND Lower(figureCitations.httpUri) != @httpUri AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "httpUri": "",
                "q": "phylogeny"
            }
        }
    },

    //14
    {
        "desc": "treatments with images since yesterday",
        "input": {
            "resource": "treatments",
            "searchparams": "checkinTime=since(yesterday)&page=2&size=50&httpUri=ne()&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=captionText"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId WHERE treatments.checkinTime >= strftime('%s', @date) * 1000 AND Lower(figureCitations.httpUri) != @httpUri AND treatments.deleted = 0",
                    "full": "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.zenodoDep, figureCitations.httpUri, figureCitations.captionText FROM treatments JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId WHERE treatments.checkinTime >= strftime('%s', @date) * 1000 AND Lower(figureCitations.httpUri) != @httpUri AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 50 OFFSET 50"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "date": "2022-07-14",
                "httpUri": ""
            }
        }
    },

    //15
    {
        "desc": "treatment images with a DOI",
        "input": {
            "resource": "treatmentImages",
            "searchparams": "treatmentDOI=http://doi.org/10.5281/zenodo.3854772&cols=treatmentTitle&cols=zenodoDep&cols=treatmentId"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT treatmentImages.id) AS num_of_records FROM treatmentImages JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId WHERE treatments.treatmentDOI = @treatmentDOI",
                    "full": "SELECT treatmentImages.id, treatments.treatmentTitle, treatments.zenodoDep, treatmentImages.treatmentId FROM treatmentImages JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId WHERE treatments.treatmentDOI = @treatmentDOI ORDER BY treatmentImages.id ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatmentDOI": "http://doi.org/10.5281/zenodo.3854772"
            }
        }
    },

    //16
    {
        "desc": "treatment images with fts",
        "input": {
            "resource": "treatmentImages",
            "searchparams": "q=acamar&refreshCache=true&page=1&size=30"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT treatmentImages.id) AS num_of_records FROM treatmentImages JOIN vtreatments ON treatmentImages.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q",
                    "full": "SELECT treatmentImages.id, treatmentImages.httpUri, treatmentImages.captionText, treatmentImages.treatmentId FROM treatmentImages JOIN vtreatments ON treatmentImages.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q ORDER BY treatmentImages.id ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "q": "acamar"
            }
        }
    },

    //17
    {
        "desc": "families with fts",
        "input": {
            "resource": "families",
            "searchparams": "q=crab"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT families.id) AS num_of_records FROM families WHERE Lower(families.family) LIKE @q",
                    "full": "SELECT families.id, families.family FROM families WHERE Lower(families.family) LIKE @q ORDER BY families.id ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "q": "crab%"
            }
        }
    },
]