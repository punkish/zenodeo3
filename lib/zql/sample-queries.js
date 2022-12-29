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
            searchparams: 'q=Agosti&validGeo=true&cols=latitude&cols=longitude&cols=isOnLand&cols=treatmentTitle&stats=true'
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
            "searchparams": "q=tyrannosaurus&authorityName=osborn&stats=true"
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
            "searchparams": "treatmentTitle=Ichneumonoidea&relatedRecords=true"
        },
        "output": {
            "queries": {
                "main": {
                    "count": "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalTitle, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.kingdom, treatments.phylum, treatments.\"order\", treatments.family, treatments.genus, treatments.species, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments WHERE treatments.treatmentTitle LIKE @treatmentTitle ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
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

    //18
    {
        "desc": "a specific treatment with its related records",
        "input": {
            "resource": "treatments",
            "searchparams": "treatmentId=388D179E0D564775C3925A5B93C1C407&relatedRecords=true"
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

    //19
    {
        "desc": "count of treatments with stats",
        "input": {
            "resource": "treatments",
            "searchparams": "class=Actinopterygii"
        },
        "output": {
            "queries": {
                "main": {
                    "count": ""
                },
                "related": {},
                "facets": {}
            },
            "runparams": {}
        }
    },

    //20
    {
        desc: 'treatments with locations for any query',
        input: {
            resource: 'treatments',
            searchparams: 'cols=&stats=true'
        },
        output: {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT tr.treatments.treatmentId) AS num_of_records FROM tr.treatments"
                },
                "related": {},
                "facets": {},
                "stats": {
                    "tr.treatments": "SELECT tr.treatments.checkInYear, Count(DISTINCT tr.treatments.treatmentId) AS num FROM tr.treatments GROUP BY 1",
                    "mc.materialsCitations": "SELECT tr.treatments.checkInYear, Count(DISTINCT mc.materialsCitations.materialsCitationId) AS num FROM tr.treatments JOIN mc.materialsCitations ON mc.materialsCitations.treatmentId = tr.treatments.treatmentId GROUP BY 1",
                    "fc.figureCitations": "SELECT tr.treatments.checkInYear, Count(DISTINCT fc.figureCitations.figureCitationId) AS num FROM tr.treatments JOIN fc.figureCitations ON fc.figureCitations.treatmentId = tr.treatments.treatmentId GROUP BY 1",
                    "tc.treatmentCitations": "SELECT tr.treatments.checkInYear, Count(DISTINCT tc.treatmentCitations.treatmentCitationId) AS num FROM tr.treatments JOIN tc.treatmentCitations ON tc.treatmentCitations.treatmentId = tr.treatments.treatmentId GROUP BY 1",
                    "bc.bibRefCitations": "SELECT tr.treatments.checkInYear, Count(DISTINCT bc.bibRefCitations.bibRefCitationId) AS num FROM tr.treatments JOIN bc.bibRefCitations ON bc.bibRefCitations.treatmentId = tr.treatments.treatmentId GROUP BY 1",
                    "locations": "SELECT materialsCitations.country, Count(materialsCitations.materialsCitationId) AS num FROM tr.treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId GROUP BY country ORDER BY num DESC LIMIT 10 OFFSET 0"
                }
            },
            "runparams": {}
        }
    },

    //21
    {
        desc: 'treatments with locations for any query within a bounding box',
        input: {
            resource: 'treatments',
            searchparams: "q=Agosti&validGeo=true&geolocation=within(radius:10,units:'kilometers',lat:40.00,lng:-120)&size=1000&cols=latitude&cols=longitude&cols=isOnLand&cols=treatmentTitle"
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

    //22
    {
        desc: 'treatments images since a specific date',
        input: {
            resource: 'treatments',
            searchparams: "q=shrimp&publicationDate=since(2022-09-27)"
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
    
    //23
    {
        desc: 'treatments images with fts and journalTitle not like zootaxa',
        input: {
            resource: 'treatmentImages',
            searchparams: "q=decapoda&journalTitle=not_like(zootaxa)"
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
    
    //24
    {
        desc: 'bibrefcitations with stats',
        input: {
            resource: 'bibRefCitations',
            searchparams: "stats=true"
        },
        output: {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT bibRefCitations.bibRefCitationId) AS num_of_records FROM bibRefCitations",
                    "full": ""
                },
                "related": {},
                "facets": {}
            },
            "runparams": {}
        }
    },

    // =============================================
    //25
    {
        desc: 'treatmentimages of fishes',
        input: {
            resource: 'treatmentImages',
            searchparams: "class=Actinopterygii&page=1&size=30&cols=httpUri&cols=treatmentTitle&cols=zenodoDep&cols=treatmentId&cols=captionText"
        },
        output: {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT ti.treatmentImages.id) AS num_of_records FROM ti.treatmentImages JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId WHERE tr.treatments.class = @class",
                    "full": "SELECT ti.treatmentImages.id, ti.treatmentImages.httpUri, tr.treatments.treatmentTitle, tr.treatments.zenodoDep, ti.treatmentImages.treatmentId, ti.treatmentImages.captionText FROM ti.treatmentImages JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId WHERE tr.treatments.class = @class ORDER BY ti.treatmentImages.id ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "class": "Actinopterygii"
            }
        }
    },

    //26
    {
        desc: 'treatments whose images have query term in captionText',
        input: {
            resource: 'treatments',
            searchparams: "captionText=shrimp&cols=treatmentTitle"
        },
        output: {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT tr.treatments.treatmentId) AS num_of_records FROM tr.treatments JOIN fc.figureCitations ON tr.treatments.treatmentId = fc.figureCitations.treatmentId JOIN fc.ftsFigureCitations ON fc.figureCitations.id = fc.ftsFigureCitations.rowid WHERE fc.figureCitations.captionText MATCH @captionText",
                    "full": "SELECT tr.treatments.treatmentId, tr.treatments.treatmentTitle FROM tr.treatments JOIN fc.figureCitations ON tr.treatments.treatmentId = fc.figureCitations.treatmentId JOIN fc.ftsFigureCitations ON fc.figureCitations.id = fc.ftsFigureCitations.rowid WHERE fc.figureCitations.captionText MATCH @captionText ORDER BY tr.treatments.treatmentId ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "captionText": "shrimp"
            }
        }
    },

    //27
    {
        desc: 'treatments where fulltext contains q returning snippet',
        input: {
            resource: 'treatments',
            searchparams: "q=agosti&cols=q"
        },
        output: {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT tr.treatments.treatmentId) AS num_of_records FROM tr.treatments JOIN fc.figureCitations ON tr.treatments.treatmentId = fc.figureCitations.treatmentId JOIN fc.ftsFigureCitations ON fc.figureCitations.id = fc.ftsFigureCitations.rowid WHERE fc.figureCitations.captionText MATCH @captionText",
                    "full": "SELECT tr.treatments.treatmentId, tr.treatments.treatmentTitle FROM tr.treatments JOIN fc.figureCitations ON tr.treatments.treatmentId = fc.figureCitations.treatmentId JOIN fc.ftsFigureCitations ON fc.figureCitations.id = fc.ftsFigureCitations.rowid WHERE fc.figureCitations.captionText MATCH @captionText ORDER BY tr.treatments.treatmentId ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "captionText": "shrimp"
            }
        }
    },

    //28
    {
        desc: 'treatment images with phylogeny in text and kingdom plantae',
        input: {
            resource: 'treatmentImages',
            searchparams: "q=phylogeny&kingdom=plantae"
        },
        output: {
            "queries": {
                "main": {
                    "count": "SELECT Count(DISTINCT ti.treatmentImages.id) AS num_of_records FROM ti.treatmentImages JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId JOIN tr.ftsTreatments ON tr.treatments.id = tr.ftsTreatments.rowid WHERE tr.ftsTreatments.ftsTreatments MATCH @q AND Lower(tr.treatments.kingdom) = @kingdom",
                    "full": "SELECT ti.treatmentImages.id, ti.treatmentImages.httpUri, ti.treatmentImages.captionText, ti.treatmentImages.treatmentId FROM ti.treatmentImages JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId JOIN tr.ftsTreatments ON tr.treatments.id = tr.ftsTreatments.rowid WHERE tr.ftsTreatments.ftsTreatments MATCH @q AND Lower(tr.treatments.kingdom) = @kingdom ORDER BY ti.treatmentImages.id ASC LIMIT 30 OFFSET 0"
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "q": "phylogeny",
                "cssClass": "hilite",
                "sides": 50,
                "kingdom": "plantae"
            }
        }
    },
    
]