export const sampleQueries = [

    //0: geolocation
    {
        desc: 'treatments with valid latlng within a bounding box',
        input: {
            resource: 'treatments',
            searchparams: 'geolocation=within(min_lat:40.78885994449482,min_lng:11.601562500000002,max_lat:47.931066347509784,max_lng:26.960449218750004)&cols=latitude&cols=longitude&cols=treatmentTitle'
        },
        output: {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments JOIN materialCitations ON treatments.id = materialCitations.treatments_id JOIN materialCitationsRtree ON materialCitations.id = materialCitationsRtree.materialCitations_id WHERE materialCitationsRtree.minX BETWEEN @min_lng AND @max_lng AND materialCitationsRtree.minY BETWEEN @min_lat AND @max_lat`,

                    "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", materialCitations."latitude", materialCitations."longitude" FROM treatments JOIN materialCitations ON treatments.id = materialCitations.treatments_id JOIN materialCitationsRtree ON materialCitations.id = materialCitationsRtree.materialCitations_id WHERE materialCitationsRtree.minX BETWEEN @min_lng AND @max_lng AND materialCitationsRtree.minY BETWEEN @min_lat AND @max_lat ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "min_lng": 11.601562500000002,
                "min_lat": 40.78885994449482,
                "max_lng": 26.960449218750004,
                "max_lat": 47.931066347509784
            }
        }
    },

    //1: number
    {
        desc: 'treatments with valid latlng within a bounding box',
        input: {
            resource: 'treatments',
            searchparams: 'treatmentVersion=2'
        },
        output: {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments WHERE treatments."treatmentVersion" = @treatmentVersion`,

                    "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentVersion", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDate", treatments."journals_id", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."kingdoms_id", treatments."phyla_id", treatments."classes_id", treatments."orders_id", treatments."families_id", treatments."genera_id", treatments."species_id", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."fulltext", treatments."checkInYear", treatments."created", treatments."updated", treatments."timeToParseXML" FROM treatments WHERE treatments."treatmentVersion" = @treatmentVersion ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatmentVersion": 2
            }
        }
    },

    //2: boolean
    {
        desc: 'treatments that have a valid geolocation',
        input: {
            resource: 'treatments',
            searchparams: 'validGeo=true&cols=latitude&cols=longitude&cols=treatmentTitle'
        },
        output: {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments JOIN materialCitations ON treatments.id = materialCitations.treatments_id WHERE materialCitations."validGeo" = @validGeo`,

                    "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", materialCitations."latitude", materialCitations."longitude" FROM treatments JOIN materialCitations ON treatments.id = materialCitations.treatments_id WHERE materialCitations."validGeo" = @validGeo ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "validGeo": 1
            }
        }
    },

    //3: date
    {
        "desc": "treatments with checkinTime since 2022-02-21",
        "input": {
            "resource": "treatments",
            "searchparams": "checkinTime=since(2022-02-21)"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments WHERE checkinTime >= ((julianday('@checkinTime') - 2440587.5) * 86400000)`,

                    "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentVersion", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDate", treatments."journals_id", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."kingdoms_id", treatments."phyla_id", treatments."classes_id", treatments."orders_id", treatments."families_id", treatments."genera_id", treatments."species_id", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."fulltext", treatments."checkInYear", treatments."created", treatments."updated", treatments."timeToParseXML" FROM treatments WHERE checkinTime >= ((julianday('@checkinTime') - 2440587.5) * 86400000) ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "date": "2022-02-21"
            }
        }
    },

    //4: year
    {
        desc: 'treatments for a specified journal year',
        input: {
            resource: 'treatments',
            searchparams: "journalYear=2020&cols=collectionCode"
        },
        output: {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments LEFT JOIN materialCitations ON treatments.id = materialCitations.treatments_id JOIN materialCitations_collectionCodes ON materialCitations.id = materialCitations_collectionCodes.materialCitations_id JOIN collectionCodes ON materialCitations_collectionCodes.collectionCodes_id = collectionCodes.id WHERE treatments."journalYear" = @journalYear`,

                    "full": `SELECT treatments."treatmentId", collectionCodes."collectionCode" FROM treatments LEFT JOIN materialCitations ON treatments.id = materialCitations.treatments_id JOIN materialCitations_collectionCodes ON materialCitations.id = materialCitations_collectionCodes.materialCitations_id JOIN collectionCodes ON materialCitations_collectionCodes.collectionCodes_id = collectionCodes.id WHERE treatments."journalYear" = @journalYear ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "journalYear": "2020"
            }
        }
    },

    // map view queries
    // TODO: is slow, and should really be changed to 
    // Count(DISTINCT treatmentId)
    //0
    // {
    //     desc: 'count of all treatments with locations',
    //     input: {
    //         resource: 'treatments',
    //         searchparams: 'validGeo=true&cols='
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": `SELECT Count(*) AS num_of_records FROM treatments JOIN materialCitations ON treatments.id = materialCitations.treatments_id WHERE materialCitations."validGeo" = 1`,
    //                 "full": ""
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {}
    //     }
    // },

    // //1
    // {
    //     desc: 'treatments with valid latlng within a bounding box',
    //     input: {
    //         resource: 'treatments',
    //         searchparams: 'validGeo=true&geolocation=within(min_lat:40.78885994449482,min_lng:11.601562500000002,max_lat:47.931066347509784,max_lng:26.960449218750004)&size=1000&cols=latitude&cols=longitude&cols=isOnLand&cols=treatmentTitle'
    //         //searchparams: 'treatmentVersion=2'
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": `SELECT Count(*) AS num_of_records FROM treatments JOIN materialCitations ON treatments.id = materialCitations.treatments_id WHERE materialCitationsRtree.minX BETWEEN @min_lng AND @max_lng AND materialCitationsRtree.minY BETWEEN @min_lat AND @max_lat AND materialCitations."validGeo" = @materialCitations."validGeo"`,

    //                 "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", materialCitations."latitude", materialCitations."longitude", materialCitations."isOnLand" FROM treatments JOIN materialCitations ON treatments.id = materialCitations.treatments_id WHERE materialCitationsRtree.minX BETWEEN @min_lng AND @max_lng AND materialCitationsRtree.minY BETWEEN @min_lat AND @max_lat AND materialCitations."validGeo" = @materialCitations."validGeo" ORDER BY +treatments."treatmentId" ASC LIMIT 1000 OFFSET 0`
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "min_lng": 11.601562500000002,
    //             "min_lat": 40.78885994449482,
    //             "max_lng": 26.960449218750004,
    //             "max_lat": 47.931066347509784,
    //             "materialCitations.\"validGeo\"": 1
    //         }
    //     }
    // },

    // //2
    // {
    //     desc: 'figures of a specific treatment',
    //     input: {
    //         resource: 'treatments',
    //         searchparams: 'treatmentId=03849624FF8CFFE3FF30FAAAD0E6FA0D&cols=httpUri&cols=captionText'
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId WHERE treatments.treatmentId = '03849624FF8CFFE3FF30FAAAD0E6FA0D'",
    //                 "full": "SELECT treatments.treatmentId, figureCitations.httpUri, figureCitations.captionText FROM treatments JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId WHERE treatments.treatmentId = '03849624FF8CFFE3FF30FAAAD0E6FA0D'"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "treatments.treatmentId": "03849624FF8CFFE3FF30FAAAD0E6FA0D"
    //         }
    //     }
    // },

    // //3
    // {
    //     desc: 'treatments with locations for any query',
    //     input: {
    //         resource: 'treatments',
    //         searchparams: 'q=Agosti&validGeo=true&cols=latitude&cols=longitude&cols=isOnLand&cols=treatmentTitle&stats=true'
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND materialsCitations.validGeo = 1 AND treatments.deleted = 0",
    //                 "full": "SELECT treatments.treatmentId, materialsCitations.latitude, materialsCitations.longitude, materialsCitations.isOnLand, treatments.treatmentTitle FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND materialsCitations.validGeo = 1 AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "q": "Agosti"
    //         }
    //     }
    // },

    // //4
    // {
    //     desc: 'treatments with locations for any query within a bounding box',
    //     input: {
    //         resource: 'treatments',
    //         searchparams: 'q=Agosti&validGeo=true&geolocation=contained_in(lower_left:{lat:40.78885994449482,lng:11.601562500000002},upper_right:{lat:47.931066347509784,lng:26.960449218750004})&size=1000&cols=latitude&cols=longitude&cols=isOnLand&cols=treatmentTitle'
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND materialsCitations.validGeo = 1 AND materialsCitations.latitude BETWEEN @min_lat AND @max_lat AND materialsCitations.longitude BETWEEN @min_lng AND @max_lng AND treatments.deleted = 0",
    //                 "full": "SELECT treatments.treatmentId, materialsCitations.latitude, materialsCitations.longitude, materialsCitations.isOnLand, treatments.treatmentTitle FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND materialsCitations.validGeo = 1 AND materialsCitations.latitude BETWEEN @min_lat AND @max_lat AND materialsCitations.longitude BETWEEN @min_lng AND @max_lng AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 1000 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "min_lat": "40.78885994449482",
    //             "max_lat": "47.931066347509784",
    //             "min_lng": "11.601562500000002",
    //             "max_lng": "26.960449218750004",
    //             "q": "Agosti"
    //         }
    //     }
    // },

    // //5
    // {
    //     "desc": "figures for a treatmentId",
    //     "input": {
    //         "resource": "figureCitations",
    //         "searchparams": "treatmentId=BF8A576EC3F6661E96B5590C108213BA&cols=httpUri&cols=captionText"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT figureCitations.figureCitationId) AS num_of_records FROM figureCitations WHERE figureCitations.treatmentId = @treatmentId",
    //                 "full": "SELECT figureCitations.figureCitationId, figureCitations.httpUri, figureCitations.captionText FROM figureCitations WHERE figureCitations.treatmentId = @treatmentId ORDER BY figureCitations.figureCitationId ASC LIMIT 30 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "treatmentId": "BF8A576EC3F6661E96B5590C108213BA"
    //         }
    //     }
    // },

    // //6
    // {
    //     "desc": "figures for a query for string in full text of treatments",
    //     "input": {
    //         "resource": "treatments",
    //         "searchparams": "q=Agosti&httpUri=ne()&cols=httpUri&cols=captionText&cols=q"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND Lower(figureCitations.httpUri) != @httpUri AND treatments.deleted = 0",
    //                 "full": "SELECT treatments.treatmentId, figureCitations.httpUri, figureCitations.captionText FROM treatments JOIN figureCitations ON treatments.treatmentId = figureCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND Lower(figureCitations.httpUri) != @httpUri AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
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

    // //7
    // {
    //     "desc": "count of treatments with valid locations",
    //     "input": {
    //         "resource": "treatments",
    //         "searchparams": "validGeo=true&cols="
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE materialsCitations.validGeo = 1 AND treatments.deleted = 0",
    //                 "full": ""
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {}
    //     }
    // },

    // //8
    // {
    //     "desc": "treatments with checkinTime since 2022-02-21",
    //     "input": {
    //         "resource": "treatments",
    //         "searchparams": "checkinTime=since(2022-02-21)"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments WHERE treatments.checkinTime >= strftime('%s', @date) * 1000 AND treatments.deleted = 0",
    //                 "full": "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalTitle, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.kingdom, treatments.phylum, treatments.\"order\", treatments.family, treatments.genus, treatments.species, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments WHERE treatments.checkinTime >= strftime('%s', @date) * 1000 AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "date": "2022-02-21"
    //         }
    //     }
    // },

    // //9
    // {
    //     "desc": "treatments with query in full text and given authorityName",
    //     "input": {
    //         "resource": "treatments",
    //         "searchparams": "q=tyrannosaurus&authorityName=osborn&stats=true"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND Lower(treatments.authorityName) LIKE @authorityName AND treatments.deleted = 0",
    //                 "full": "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalTitle, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.kingdom, treatments.phylum, treatments.\"order\", treatments.family, treatments.genus, treatments.species, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND Lower(treatments.authorityName) LIKE @authorityName AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "q": "tyrannosaurus",
    //             "authorityName": "osborn%"
    //         }
    //     }
    // },

    // //10
    // {
    //     "desc": "treatments with treatmentTitle starting with given text",
    //     "input": {
    //         "resource": "treatments",
    //         "searchparams": "treatmentTitle=starts_with(Ichneumonoidea)"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments WHERE Lower(treatments.treatmentTitle) LIKE @treatmentTitle AND treatments.deleted = 0",
    //                 "full": "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalTitle, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.kingdom, treatments.phylum, treatments.\"order\", treatments.family, treatments.genus, treatments.species, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments WHERE Lower(treatments.treatmentTitle) LIKE @treatmentTitle AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "treatmentTitle": "ichneumonoidea%"
    //         }
    //     }
    // },

    // //11
    // {
    //     "desc": "treatments with treatmentTitle starting with given text (alternative version)",
    //     "input": {
    //         "resource": "treatments",
    //         "searchparams": "treatmentTitle=eq(Ichneumonoidea)"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments WHERE Lower(treatments.treatmentTitle) = @treatmentTitle AND treatments.deleted = 0",
    //                 "full": "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalTitle, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.kingdom, treatments.phylum, treatments.\"order\", treatments.family, treatments.genus, treatments.species, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments WHERE Lower(treatments.treatmentTitle) = @treatmentTitle AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "treatmentTitle": "ichneumonoidea"
    //         }
    //     }
    // },

    // //12
    // {
    //     "desc": "treatments with exact given treatmentTitle with facets",
    //     "input": {
    //         "resource": "treatments",
    //         "searchparams": "treatmentTitle=Ichneumonoidea&relatedRecords=true"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalTitle, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.kingdom, treatments.phylum, treatments.\"order\", treatments.family, treatments.genus, treatments.species, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments WHERE treatments.treatmentTitle LIKE @treatmentTitle ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {
    //                 "journalTitle": "SELECT journalTitle, count FROM (SELECT journalTitle, Count(journalTitle) AS count FROM treatments WHERE journalTitle != '' GROUP BY journalTitle HAVING count > 100 ORDER BY count DESC LIMIT 50) AS t ORDER BY journalTitle ASC",
    //                 "journalYear": "SELECT journalYear, count FROM (SELECT journalYear, Count(journalYear) AS count FROM treatments WHERE journalYear != '' GROUP BY journalYear HAVING count > 1 ORDER BY count DESC LIMIT 50) AS t ORDER BY journalYear ASC",
    //                 "rank": "SELECT rank, count FROM (SELECT rank, Count(rank) AS count FROM treatments WHERE rank != '' GROUP BY rank HAVING count > 1 ORDER BY count DESC LIMIT 50) AS t ORDER BY rank ASC",
    //                 "status": "SELECT status, count FROM (SELECT status, Count(status) AS count FROM treatments WHERE status != '' GROUP BY status HAVING count > 1 ORDER BY count DESC LIMIT 50) AS t ORDER BY status ASC"
    //             }
    //         },
    //         "runparams": {
    //             "treatmentTitle": "ichneumonoidea%"
    //         }
    //     }
    // },

    // //13 ✅
    // {
    //     "desc": "treatments images with fts search on treatments",
    //     "input": {
    //         "resource": "treatments",
    //         "searchparams": "q=phylogeny&cols=treatmentTitle&cols=httpUri&cols=zenodoDep&cols=captionText"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": `SELECT Count(*) AS num_of_records FROM treatments JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsXimages ON figureCitations.id = figureCitationsXimages.figureCitations_id JOIN images ON images.id = figureCitationsXimages.images_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE treatmentsFts MATCH @q`,

    //                 "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep", images.httpUri, figureCitations.captionText FROM treatments JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsXimages ON figureCitations.id = figureCitationsXimages.figureCitations_id JOIN images ON images.id = figureCitationsXimages.images_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE treatmentsFts MATCH @q ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "q": "phylogeny",
    //             "cssClass": "hilite",
    //             "sides": 50
    //         }
    //     }
    // },

    // //14 ✅ (slow)
    // {
    //     "desc": "treatments images since yesterday",
    //     "input": {
    //         "resource": "treatments",
    //         "searchparams": "checkinTime=since(yesterday)&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=captionText"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": `SELECT Count(*) AS num_of_records FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsXimages ON figureCitations.id = figureCitationsXimages.figureCitations_id JOIN images ON images.id = figureCitationsXimages.images_id WHERE treatments."checkinTime" >= strftime('%s', @date) * 1000`,

    //                 "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep", images.httpUri, figureCitations.captionText FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsXimages ON figureCitations.id = figureCitationsXimages.figureCitations_id JOIN images ON images.id = figureCitationsXimages.images_id WHERE treatments."checkinTime" >= strftime('%s', @date) * 1000 ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "date": "2023-05-07"
    //         }
    //     }
    // },

    // //15 ✅
    // {
    //     "desc": "treatment images with a DOI",
    //     "input": {
    //         "resource": "treatments",
    //         "searchparams": "articleTitle=starts_with(Morphology and taxonomic assessment of eight genetic clades of Mercuria Boeters)&cols=treatmentTitle&cols=zenodoDep&cols=treatmentId&cols=httpUri"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": `SELECT Count(*) AS num_of_records FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsXimages ON figureCitations.id = figureCitationsXimages.figureCitations_id JOIN images ON images.id = figureCitationsXimages.images_id WHERE treatments."treatmentDOI" = @treatmentDOI`,

    //                 "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep", images.httpUri FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsXimages ON figureCitations.id = figureCitationsXimages.figureCitations_id JOIN images ON images.id = figureCitationsXimages.images_id WHERE treatments."treatmentDOI" = @treatmentDOI ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "treatmentDOI": "https://doi.org/10.5852/ejt.2023.866.2107"
    //         }
    //     }
    // },

    // //16 ✅
    // {
    //     "desc": "treatment images with fts search in captionText",
    //     "input": {
    //         "resource": "treatments",
    //         "searchparams": "captionText=acamar&cols=treatmentTitle&cols=httpUri&cols=zenodoDep&cols=captionText"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": `SELECT Count(*) AS num_of_records FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsXimages ON figureCitations.id = figureCitationsXimages.figureCitations_id JOIN images ON images.id = figureCitationsXimages.images_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE figureCitationsFts.captionText MATCH @captionText`,

    //                 "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep", images.httpUri, figureCitations.captionText FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsXimages ON figureCitations.id = figureCitationsXimages.figureCitations_id JOIN images ON images.id = figureCitationsXimages.images_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE figureCitationsFts.captionText MATCH @captionText ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "q": "acamar"
    //         }
    //     }
    // },

    // //17
    // {
    //     "desc": "families with fts",
    //     "input": {
    //         "resource": "families",
    //         "searchparams": "q=crab"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT families.id) AS num_of_records FROM families WHERE Lower(families.family) LIKE @q",
    //                 "full": "SELECT families.id, families.family FROM families WHERE Lower(families.family) LIKE @q ORDER BY families.id ASC LIMIT 30 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "q": "crab%"
    //         }
    //     }
    // },

    // //18
    // {
    //     "desc": "a specific treatment with its related records",
    //     "input": {
    //         "resource": "treatments",
    //         "searchparams": "treatmentId=388D179E0D564775C3925A5B93C1C407&relatedRecords=true"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT families.id) AS num_of_records FROM families WHERE Lower(families.family) LIKE @q",
    //                 "full": "SELECT families.id, families.family FROM families WHERE Lower(families.family) LIKE @q ORDER BY families.id ASC LIMIT 30 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "q": "crab%"
    //         }
    //     }
    // },

    // //19
    // {
    //     "desc": "count of treatments with stats",
    //     "input": {
    //         "resource": "treatments",
    //         "searchparams": "class=Actinopterygii"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": ""
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {}
    //     }
    // },

    // //20
    // {
    //     desc: 'treatments with locations for any query',
    //     input: {
    //         resource: 'treatments',
    //         searchparams: 'cols=&stats=true'
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT tr.treatments.treatmentId) AS num_of_records FROM tr.treatments"
    //             },
    //             "related": {},
    //             "facets": {},
    //             "stats": {
    //                 "tr.treatments": "SELECT tr.treatments.checkInYear, Count(DISTINCT tr.treatments.treatmentId) AS num FROM tr.treatments GROUP BY 1",
    //                 "mc.materialsCitations": "SELECT tr.treatments.checkInYear, Count(DISTINCT mc.materialsCitations.materialsCitationId) AS num FROM tr.treatments JOIN mc.materialsCitations ON mc.materialsCitations.treatmentId = tr.treatments.treatmentId GROUP BY 1",
    //                 "fc.figureCitations": "SELECT tr.treatments.checkInYear, Count(DISTINCT fc.figureCitations.figureCitationId) AS num FROM tr.treatments JOIN fc.figureCitations ON fc.figureCitations.treatmentId = tr.treatments.treatmentId GROUP BY 1",
    //                 "tc.treatmentCitations": "SELECT tr.treatments.checkInYear, Count(DISTINCT tc.treatmentCitations.treatmentCitationId) AS num FROM tr.treatments JOIN tc.treatmentCitations ON tc.treatmentCitations.treatmentId = tr.treatments.treatmentId GROUP BY 1",
    //                 "bc.bibRefCitations": "SELECT tr.treatments.checkInYear, Count(DISTINCT bc.bibRefCitations.bibRefCitationId) AS num FROM tr.treatments JOIN bc.bibRefCitations ON bc.bibRefCitations.treatmentId = tr.treatments.treatmentId GROUP BY 1",
    //                 "locations": "SELECT materialsCitations.country, Count(materialsCitations.materialsCitationId) AS num FROM tr.treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId GROUP BY country ORDER BY num DESC LIMIT 10 OFFSET 0"
    //             }
    //         },
    //         "runparams": {}
    //     }
    // },

    // //21
    // {
    //     desc: 'treatments with locations for any query within a bounding box',
    //     input: {
    //         resource: 'treatments',
    //         searchparams: "q=Agosti&validGeo=true&geolocation=within(radius:10,units:'kilometers',lat:40.00,lng:-120)&size=1000&cols=latitude&cols=longitude&cols=isOnLand&cols=treatmentTitle"
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND materialsCitations.validGeo = 1 AND materialsCitations.latitude BETWEEN @min_lat AND @max_lat AND materialsCitations.longitude BETWEEN @min_lng AND @max_lng AND treatments.deleted = 0",
    //                 "full": "SELECT treatments.treatmentId, materialsCitations.latitude, materialsCitations.longitude, materialsCitations.isOnLand, treatments.treatmentTitle FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND materialsCitations.validGeo = 1 AND materialsCitations.latitude BETWEEN @min_lat AND @max_lat AND materialsCitations.longitude BETWEEN @min_lng AND @max_lng AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 1000 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "min_lat": "40.78885994449482",
    //             "max_lat": "47.931066347509784",
    //             "min_lng": "11.601562500000002",
    //             "max_lng": "26.960449218750004",
    //             "q": "Agosti"
    //         }
    //     }
    // },

    // //22
    // {
    //     desc: 'treatments images since a specific date',
    //     input: {
    //         resource: 'treatments',
    //         searchparams: "q=shrimp&publicationDate=since(2022-09-27)"
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND materialsCitations.validGeo = 1 AND materialsCitations.latitude BETWEEN @min_lat AND @max_lat AND materialsCitations.longitude BETWEEN @min_lng AND @max_lng AND treatments.deleted = 0",
    //                 "full": "SELECT treatments.treatmentId, materialsCitations.latitude, materialsCitations.longitude, materialsCitations.isOnLand, treatments.treatmentTitle FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND materialsCitations.validGeo = 1 AND materialsCitations.latitude BETWEEN @min_lat AND @max_lat AND materialsCitations.longitude BETWEEN @min_lng AND @max_lng AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 1000 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "min_lat": "40.78885994449482",
    //             "max_lat": "47.931066347509784",
    //             "min_lng": "11.601562500000002",
    //             "max_lng": "26.960449218750004",
    //             "q": "Agosti"
    //         }
    //     }
    // },
    
    // //23
    // {
    //     desc: 'treatments images with fts and journalTitle not like zootaxa',
    //     input: {
    //         resource: 'treatmentImages',
    //         searchparams: "q=decapoda&journalTitle=not_like(zootaxa)"
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND materialsCitations.validGeo = 1 AND materialsCitations.latitude BETWEEN @min_lat AND @max_lat AND materialsCitations.longitude BETWEEN @min_lng AND @max_lng AND treatments.deleted = 0",
    //                 "full": "SELECT treatments.treatmentId, materialsCitations.latitude, materialsCitations.longitude, materialsCitations.isOnLand, treatments.treatmentTitle FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND materialsCitations.validGeo = 1 AND materialsCitations.latitude BETWEEN @min_lat AND @max_lat AND materialsCitations.longitude BETWEEN @min_lng AND @max_lng AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 1000 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "min_lat": "40.78885994449482",
    //             "max_lat": "47.931066347509784",
    //             "min_lng": "11.601562500000002",
    //             "max_lng": "26.960449218750004",
    //             "q": "Agosti"
    //         }
    //     }
    // },
    
    // //24
    // {
    //     desc: 'bibrefcitations with stats',
    //     input: {
    //         resource: 'bibRefCitations',
    //         searchparams: "stats=true"
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT bibRefCitations.bibRefCitationId) AS num_of_records FROM bibRefCitations",
    //                 "full": ""
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {}
    //     }
    // },

    // // =============================================
    // //25
    // {
    //     desc: 'images of fishes',
    //     input: {
    //         resource: 'images',
    //         searchparams: "class=Actinopterygii&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=captionText"
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT ti.treatmentImages.id) AS num_of_records FROM ti.treatmentImages JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId WHERE tr.treatments.class = @class",
    //                 "full": "SELECT ti.treatmentImages.id, ti.treatmentImages.httpUri, tr.treatments.treatmentTitle, tr.treatments.zenodoDep, ti.treatmentImages.treatmentId, ti.treatmentImages.captionText FROM ti.treatmentImages JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId WHERE tr.treatments.class = @class ORDER BY ti.treatmentImages.id ASC LIMIT 30 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "class": "Actinopterygii"
    //         }
    //     }
    // },

    // //26
    // {
    //     desc: 'treatments whose images have query term in captionText',
    //     input: {
    //         resource: 'treatments',
    //         searchparams: "captionText=shrimp&cols=treatmentTitle"
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT tr.treatments.treatmentId) AS num_of_records FROM tr.treatments JOIN fc.figureCitations ON tr.treatments.treatmentId = fc.figureCitations.treatmentId JOIN fc.ftsFigureCitations ON fc.figureCitations.id = fc.ftsFigureCitations.rowid WHERE fc.figureCitations.captionText MATCH @captionText",
    //                 "full": "SELECT tr.treatments.treatmentId, tr.treatments.treatmentTitle FROM tr.treatments JOIN fc.figureCitations ON tr.treatments.treatmentId = fc.figureCitations.treatmentId JOIN fc.ftsFigureCitations ON fc.figureCitations.id = fc.ftsFigureCitations.rowid WHERE fc.figureCitations.captionText MATCH @captionText ORDER BY tr.treatments.treatmentId ASC LIMIT 30 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "captionText": "shrimp"
    //         }
    //     }
    // },

    // //27
    // {
    //     desc: 'treatments where fulltext contains q returning snippet',
    //     input: {
    //         resource: 'treatments',
    //         searchparams: "q=agosti&cols=q"
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT tr.treatments.treatmentId) AS num_of_records FROM tr.treatments JOIN fc.figureCitations ON tr.treatments.treatmentId = fc.figureCitations.treatmentId JOIN fc.ftsFigureCitations ON fc.figureCitations.id = fc.ftsFigureCitations.rowid WHERE fc.figureCitations.captionText MATCH @captionText",
    //                 "full": "SELECT tr.treatments.treatmentId, tr.treatments.treatmentTitle FROM tr.treatments JOIN fc.figureCitations ON tr.treatments.treatmentId = fc.figureCitations.treatmentId JOIN fc.ftsFigureCitations ON fc.figureCitations.id = fc.ftsFigureCitations.rowid WHERE fc.figureCitations.captionText MATCH @captionText ORDER BY tr.treatments.treatmentId ASC LIMIT 30 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "captionText": "shrimp"
    //         }
    //     }
    // },

    // //28
    // {
    //     desc: 'treatment images with phylogeny in text and kingdom plantae',
    //     input: {
    //         resource: 'treatmentImages',
    //         searchparams: "q=phylogeny&kingdom=Plantae"
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT ti.treatmentImages.id) AS num_of_records FROM ti.treatmentImages JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId JOIN tr.ftsTreatments ON tr.treatments.id = tr.ftsTreatments.rowid WHERE tr.ftsTreatments.ftsTreatments MATCH @q AND Lower(tr.treatments.kingdom) = @kingdom",
    //                 "full": "SELECT ti.treatmentImages.id, ti.treatmentImages.httpUri, ti.treatmentImages.captionText, ti.treatmentImages.treatmentId FROM ti.treatmentImages JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId JOIN tr.ftsTreatments ON tr.treatments.id = tr.ftsTreatments.rowid WHERE tr.ftsTreatments.ftsTreatments MATCH @q AND Lower(tr.treatments.kingdom) = @kingdom ORDER BY ti.treatmentImages.id ASC LIMIT 30 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "q": "phylogeny",
    //             "cssClass": "hilite",
    //             "sides": 50,
    //             "kingdom": "plantae"
    //         }
    //     }
    // },
    
    // //* 29
    // {
    //     desc: 'collection codes with a specified collection code',
    //     input: {
    //         resource: 'collectionCodes',
    //         searchparams: "collectionCode=ASPER"
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": 'SELECT Count(DISTINCT collectionCodes."collectionCode") AS num_of_records FROM collectionCodes WHERE Lower(collectionCodes.collectionCode) = @collectionCode',
    //                 "full": 'SELECT collectionCodes."collectionCode", collectionCodes."country", collectionCodes."name", collectionCodes."lsid", collectionCodes."type" FROM collectionCodes WHERE Lower(collectionCodes.collectionCode) = @collectionCode ORDER BY +collectionCodes."collectionCode" ASC LIMIT 30 OFFSET 0'
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "collectionCode": "asper"
    //         }
    //     }
    // },

    // //* 30
    // {
    //     desc: 'treatments for a specified collection code',
    //     input: {
    //         resource: 'treatments',
    //         searchparams: "collectionCode=NMBE"
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": 'SELECT Count(DISTINCT treatments."id") AS num_of_records FROM treatments WHERE Lower(collectionCodes.collectionCode) = @collectionCode',
    //                 "full": 'SELECT treatments."id", treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentVersion", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDate", treatments."journalId", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."kingdom", treatments."phylum", treatments."class", treatments."order", treatments."family", treatments."genus", treatments."species", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."fulltext", treatments."checkInYear", treatments."created", treatments."updated" FROM treatments WHERE Lower(collectionCodes.collectionCode) = @collectionCode ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0'
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "collectionCode": "nmbe"
    //         }
    //     }
    // },

    // //* 31
    // {
    //     desc: 'treatments for a specified journal year returning collectionCode',
    //     input: {
    //         resource: 'treatments',
    //         searchparams: "journalYear=1993&cols=collectionCode"
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": 'SELECT Count(DISTINCT treatments."id") AS num_of_records FROM treatments WHERE Lower(collectionCodes.collectionCode) = @collectionCode',
    //                 "full": 'SELECT treatments."id", treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentVersion", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDate", treatments."journalId", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."kingdom", treatments."phylum", treatments."class", treatments."order", treatments."family", treatments."genus", treatments."species", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."fulltext", treatments."checkInYear", treatments."created", treatments."updated" FROM treatments WHERE Lower(collectionCodes.collectionCode) = @collectionCode ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0'
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "collectionCode": "nmbe"
    //         }
    //     }
    // },

    // //* 32
    // {
    //     desc: 'phyla starting with ba',
    //     input: {
    //         resource: 'phyla',
    //         searchparams: "phylum=starts_with(ba)"
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": 'SELECT Count(DISTINCT phyla."id") AS num_of_records FROM phyla WHERE phyla.phylum LIKE @phylum',
    //                 "full": 'SELECT phyla."id", phyla."phylum" FROM phyla WHERE phyla.phylum LIKE @phylum ORDER BY +phyla."id" ASC LIMIT 30 OFFSET 0'
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "phylum": "ba%"
    //         }
    //     }
    // },

    // //* 33
    // {
    //     desc: 'orders starting with r',
    //     input: {
    //         resource: 'orders',
    //         searchparams: "order=starts_with(r)"
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": 'SELECT Count(DISTINCT treatments."id") AS num_of_records FROM treatments WHERE Lower(collectionCodes.collectionCode) = @collectionCode',
    //                 "full": 'SELECT treatments."id", treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentVersion", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDate", treatments."journalId", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."kingdom", treatments."phylum", treatments."class", treatments."order", treatments."family", treatments."genus", treatments."species", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."fulltext", treatments."checkInYear", treatments."created", treatments."updated" FROM treatments WHERE Lower(collectionCodes.collectionCode) = @collectionCode ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0'
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "collectionCode": "nmbe"
    //         }
    //     }
    // },

    // //* 34
    // {
    //     desc: 'images from treatments with family Formicidae',
    //     input: {
    //         resource: 'images',
    //         searchparams: "family=Formicidae&groupby=images.httpUri&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=captionText"
    //     },
    //     output: {
    //         "queries": {
    //             "main": {
    //                 "count": 'SELECT Count(DISTINCT treatments."id") AS num_of_records FROM treatments WHERE Lower(collectionCodes.collectionCode) = @collectionCode',
    //                 "full": 'SELECT treatments."id", treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentVersion", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDate", treatments."journalId", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."kingdom", treatments."phylum", treatments."class", treatments."order", treatments."family", treatments."genus", treatments."species", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."fulltext", treatments."checkInYear", treatments."created", treatments."updated" FROM treatments WHERE Lower(collectionCodes.collectionCode) = @collectionCode ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0'
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "collectionCode": "nmbe"
    //         }
    //     }
    // },

    // //35
    // {
    //     "desc": "(new) treatment images with fts search in captionText",
    //     "input": {
    //         "resource": "treatments",
    //         "searchparams": "captionText=acamar&isImage=true&cols=httpUri&cols=captionText"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": `SELECT Count(*) AS num_of_records FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE figureCitationsFts.captionText MATCH @captionText AND figureCitations.isImage = 1`,
    //                 "full": `SELECT treatments."treatmentId", figureCitations.httpUri, figureCitations.captionText FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE figureCitationsFts.captionText MATCH @captionText AND figureCitations.isImage = 1 ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "q": "acamar"
    //         }
    //     }
    // },

    // //36
    // {
    //     "desc": "(new) treatment images with fts search in all treatment",
    //     "input": {
    //         "resource": "treatments",
    //         "searchparams": "q=acamar&isImage=true&cols=httpUri&cols=captionText"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": `SELECT Count(*) AS num_of_records FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE figureCitationsFts.captionText MATCH @captionText AND figureCitations.isImage = 1`,
    //                 "full": `SELECT treatments."treatmentId", figureCitations.httpUri, figureCitations.captionText FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE figureCitationsFts.captionText MATCH @captionText AND figureCitations.isImage = 1 ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "q": "acamar"
    //         }
    //     }
    // },

    // //37
    // {
    //     "desc": "(new) count of treatment images",
    //     "input": {
    //         "resource": "treatments",
    //         "searchparams": "isImage=true&cols="
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": `SELECT Count(*) AS num_of_records FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE figureCitationsFts.captionText MATCH @captionText AND figureCitations.isImage = 1`,
    //                 "full": `SELECT treatments."treatmentId", figureCitations.httpUri, figureCitations.captionText FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE figureCitationsFts.captionText MATCH @captionText AND figureCitations.isImage = 1 ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "q": "acamar"
    //         }
    //     }
    // },

    // // 38
    // //treatments?page=1&size=30&class=Actinopterygii&isImage=true&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=captionText
    // {
    //     "desc": "(new) treatment images for class",
    //     "input": {
    //         "resource": "treatments",
    //         "searchparams": "class=Actinopterygii&isImage=true&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=captionText"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": `SELECT Count(*) AS num_of_records FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE figureCitationsFts.captionText MATCH @captionText AND figureCitations.isImage = 1`,
    //                 "full": `SELECT treatments."treatmentId", figureCitations.httpUri, figureCitations.captionText FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE figureCitationsFts.captionText MATCH @captionText AND figureCitations.isImage = 1 ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "q": "acamar"
    //         }
    //     }
    // },

    // // 39
    // {
    //     "desc": "images with FTS in captionText",
    //     "input": {
    //         "resource": "images",
    //         "searchparams": "q=phylogeny&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=captionText"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": `SELECT Count(*) AS num_of_records FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE figureCitationsFts.captionText MATCH @captionText AND figureCitations.isImage = 1`,
    //                 "full": `SELECT treatments."treatmentId", figureCitations.httpUri, figureCitations.captionText FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE figureCitationsFts.captionText MATCH @captionText AND figureCitations.isImage = 1 ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "q": "acamar"
    //         }
    //     }
    // },

    // //journalTitle=starts_with%28European%29&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=captionText
    // //40
    // {
    //     "desc": "images from specific journal",
    //     "input": {
    //         "resource": "images",
    //         "searchparams": "page=1&size=30&journalTitle=starts_with(European)&refreshCache=true&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=captionText"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": `SELECT Count(*) AS num_of_records FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE figureCitationsFts.captionText MATCH @captionText AND figureCitations.isImage = 1`,
    //                 "full": `SELECT treatments."treatmentId", figureCitations.httpUri, figureCitations.captionText FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE figureCitationsFts.captionText MATCH @captionText AND figureCitations.isImage = 1 ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "q": "acamar"
    //         }
    //     }
    // },

    // // 41
    // {
    //     "desc": "images from specific order",
    //     "input": {
    //         "resource": "images",
    //         "searchparams": "order=coleoptera&refreshCache=true&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=captionText"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": `SELECT Count(*) AS num_of_records FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE figureCitationsFts.captionText MATCH @captionText AND figureCitations.isImage = 1`,
    //                 "full": `SELECT treatments."treatmentId", figureCitations.httpUri, figureCitations.captionText FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE figureCitationsFts.captionText MATCH @captionText AND figureCitations.isImage = 1 ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "q": "acamar"
    //         }
    //     }
    // },

    // //42
    // {
    //     "desc": "images with checkinTime between 2010-12-27 and 2011-12-27",
    //     "input": {
    //         "resource": "images",
    //         "searchparams": "checkinTime=between(2010-12-27 and 2011-12-27)"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments WHERE treatments.checkinTime >= strftime('%s', @date) * 1000 AND treatments.deleted = 0",
    //                 "full": "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalTitle, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.kingdom, treatments.phylum, treatments.\"order\", treatments.family, treatments.genus, treatments.species, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments WHERE treatments.checkinTime >= strftime('%s', @date) * 1000 AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "date": "2022-02-21"
    //         }
    //     }
    // },

    // //43
    // {
    //     "desc": "images with FTS in treatments",
    //     "input": {
    //         "resource": "images",
    //         "searchparams": "q=phylogeny AND plantae&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=captionText"
    //     },
    //     "output": {
    //         "queries": {
    //             "main": {
    //                 "count": `SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatmentsFts.fulltext MATCH @q`,

    //                 "full": `SELECT images."id", images."httpUri", images."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep" FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatmentsFts.fulltext MATCH @q ORDER BY +images."id" ASC LIMIT 30 OFFSET 0`
    //             },
    //             "related": {},
    //             "facets": {}
    //         },
    //         "runparams": {
    //             "q": "phylogeny AND plantae",
    //             "cssClass": "hilite",
    //             "sides": 50
    //         }
    //     }
    // },
]