export const sampleQueries = [

    {
        desc: `count`,
        input: {
            resource: 'treatments',
            searchparams: 'cols='
        },
        output: {
            "queries": {
                "count": `SELECT Count(*) AS num_of_records FROM treatments`,

                "full": null
            },
            "runparams": {},
            "num_of_records": 758087
        }
    },

    //0: geolocation
    {
        desc: `within a bounding box`,
        input: {
            resource: 'treatments',
            searchparams: 'geolocation=within(min_lat:40.78885994449482,min_lng:11.601562500000002,max_lat:47.931066347509784,max_lng:26.960449218750004)&cols=latitude&cols=longitude&cols=treatmentTitle'
        },
        output: {
            "queries": {
                "count": `SELECT Count(DISTINCT treatments."treatmentId") AS num_of_records FROM treatments JOIN materialCitations ON treatments.id = materialCitations.treatments_id JOIN materialCitationsRtree ON materialCitations.id = materialCitationsRtree.materialCitations_id WHERE materialCitationsRtree.minX BETWEEN @min_lng AND @max_lng AND materialCitationsRtree.minY BETWEEN @min_lat AND @max_lat`,

                "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", materialCitations."latitude", materialCitations."longitude" FROM treatments JOIN materialCitations ON treatments.id = materialCitations.treatments_id JOIN materialCitationsRtree ON materialCitations.id = materialCitationsRtree.materialCitations_id WHERE materialCitationsRtree.minX BETWEEN @min_lng AND @max_lng AND materialCitationsRtree.minY BETWEEN @min_lat AND @max_lat ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
            },
            "runparams": {
                "min_lng": 11.601562500000002,
                "min_lat": 40.78885994449482,
                "max_lng": 26.960449218750004,
                "max_lat": 47.931066347509784
            },
            "num_of_records": 1955
        }
    },

    //1: number
    {
        desc: 'specific treatmentVersion',
        input: {
            resource: 'treatments',
            searchparams: 'treatmentVersion=2'
        },
        output: {
            "queries": {
                "count": `SELECT Count(*) AS num_of_records FROM treatments WHERE treatments."treatmentVersion" = @treatmentVersion`,

                "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDateMs", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."deleted" FROM treatments WHERE treatments."treatmentVersion" = @treatmentVersion ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
            },
            "runparams": {
                "treatmentVersion": 2
            },
            "num_of_records": 167963
        }
    },

    //2: boolean
    // TODO: make faster
    {
        desc: 'valid geolocation',
        input: {
            resource: 'treatments',
            searchparams: 'validGeo=true&cols=treatmentTitle'
        },
        output: {
            "queries": {
                "count": `SELECT Count(*) AS num_of_records FROM treatments WHERE treatments."validGeo" = @validGeo`,

                "full": `SELECT treatments."treatmentId", treatments."treatmentTitle" FROM treatments WHERE treatments."validGeo" = @validGeo ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
            },
            "runparams": {
                "validGeo": 1
            },
            "num_of_records": 96049
        }
    },

    //3: date
    {
        "desc": "checkinTime since 2022-02-21",
        "input": {
            "resource": "treatments",
            "searchparams": "checkinTime=since(2022-02-21)"
        },
        "output": {
            "queries": {
                "count": `SELECT Count(*) AS num_of_records FROM treatments WHERE treatments."checkinTime" >= ((julianday(@checkinTime) - 2440587.5) * 86400000)`,

                "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDateMs", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."deleted" FROM treatments WHERE treatments."checkinTime" >= ((julianday(@checkinTime) - 2440587.5) * 86400000) ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
            },
            "runparams": {
                "checkinTime": "2022-02-21"
            },
            "num_of_records": 102107
        }
    },

    //4: date
    {
        "desc": "checkinTime until 2022-02-21",
        "input": {
            "resource": "treatments",
            "searchparams": "checkinTime=until(2022-02-21)"
        },
        "output": {
            "queries": {
                "count": `SELECT Count(*) AS num_of_records FROM treatments WHERE treatments."checkinTime" <= ((julianday(@checkinTime) - 2440587.5) * 86400000)`,

                "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDateMs", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."deleted" FROM treatments WHERE treatments."checkinTime" <= ((julianday(@checkinTime) - 2440587.5) * 86400000) ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
            },
            "runparams": {
                "checkinTime": "2022-02-21"
            },
            "num_of_records": 655980
        }
    },

    //5: date
    {
        "desc": "checkinTime between 2022-02-21 and 2023-02-21",
        "input": {
            "resource": "treatments",
            "searchparams": "checkinTime=between(2022-02-21 and 2023-02-21)"
        },
        "output": {
            "queries": {
                "count": `SELECT Count(*) AS num_of_records FROM treatments WHERE treatments."checkinTime" BETWEEN ((julianday(@from) - 2440587.5) * 86400000) AND ((julianday(@to) - 2440587.5) * 86400000)`,

                "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDateMs", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."deleted" FROM treatments WHERE treatments."checkinTime" BETWEEN ((julianday(@from) - 2440587.5) * 86400000) AND ((julianday(@to) - 2440587.5) * 86400000) ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
            },
            "runparams": {
                "checkinTime": "2022-02-21"
            },
            "num_of_records": 86557
        }
    },

    //6: year
    {
        desc: 'given journal year',
        input: {
            resource: 'treatments',
            searchparams: "journalYear=2020&cols=collectionCode"
        },
        output: {
            "queries": {
                "count": `SELECT Count(DISTINCT treatments."treatmentId") AS num_of_records FROM treatments LEFT JOIN materialCitations ON treatments.id = materialCitations.treatments_id JOIN materialCitations_collectionCodes ON materialCitations.id = materialCitations_collectionCodes.materialCitations_id JOIN collectionCodes ON materialCitations_collectionCodes.collectionCodes_id = collectionCodes.id WHERE treatments."journalYear" = @journalYear`,

                "full": `SELECT treatments."treatmentId", collectionCodes."collectionCode" FROM treatments LEFT JOIN materialCitations ON treatments.id = materialCitations.treatments_id JOIN materialCitations_collectionCodes ON materialCitations.id = materialCitations_collectionCodes.materialCitations_id JOIN collectionCodes ON materialCitations_collectionCodes.collectionCodes_id = collectionCodes.id WHERE treatments."journalYear" = @journalYear ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
            },
            "runparams": {
                "journalYear": "2020"
            },
            "num_of_records": 2926
        }
    },

    //20
    {
        desc: 'specified collection code',
        input: {
            resource: 'treatments',
            searchparams: "collectionCode=NMBE"
        },
        output: {
            "queries": {
                "main": {
                    "count": `SELECT Count(DISTINCT treatments."treatmentId") AS num_of_records FROM treatments LEFT JOIN materialCitations ON treatments.id = materialCitations.treatments_id JOIN materialCitations_collectionCodes ON materialCitations.id = materialCitations_collectionCodes.materialCitations_id JOIN collectionCodes ON materialCitations_collectionCodes.collectionCodes_id = collectionCodes.id WHERE collectionCodes."collectionCode" = @collectionCode`,

                    "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDateMs", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."deleted" FROM treatments LEFT JOIN materialCitations ON treatments.id = materialCitations.treatments_id JOIN materialCitations_collectionCodes ON materialCitations.id = materialCitations_collectionCodes.materialCitations_id JOIN collectionCodes ON materialCitations_collectionCodes.collectionCodes_id = collectionCodes.id WHERE collectionCodes."collectionCode" = @collectionCode ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "collectionCode": "nmbe"
            },
            "num_of_records": 24
        }
    },

    //21
    {
        desc: 'FTS and valid location',
        input: {
            resource: 'treatments',
            searchparams: 'q=Agosti&validGeo=true&cols=latitude&cols=longitude&cols=isOnLand&cols=treatmentTitle'
        },
        output: {
            "queries": {
                "main": {
                    "count": `SELECT Count(DISTINCT treatments."treatmentId") AS num_of_records FROM treatments JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid JOIN materialCitations ON treatments.id = materialCitations.treatments_id WHERE treatments."validGeo" = @validGeo AND treatmentsFts.fulltext MATCH @q`,

                    "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", materialCitations."latitude", materialCitations."longitude", materialCitations."isOnLand" FROM treatments JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid JOIN materialCitations ON treatments.id = materialCitations.treatments_id WHERE treatments."validGeo" = @validGeo AND treatmentsFts.fulltext MATCH @q ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "validGeo": 1,
                "q": "agosti",
                "cssClass": "hilite",
                "sides": 50
            },
            "num_of_records": 172
        }
    },

    //22
    {
        desc: 'FTS and a bounding box',
        input: {
            resource: 'treatments',
            searchparams: 'q=Agosti&geolocation=within(min_lat:40.78885994449482,min_lng:11.601562500000002,max_lat:47.931066347509784,max_lng:26.960449218750004)&cols=latitude&cols=longitude&cols=treatmentTitle'
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
            },
            "num_of_records": 3
        }
    },

    //23
    {
        "desc": "checkinTime since 2022-02-21",
        "input": {
            "resource": "treatments",
            "searchparams": "checkinTime=since(2022-02-21)"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments WHERE treatments."checkinTime" >= ((julianday(@checkinTime) - 2440587.5) * 86400000)`,

                    "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDateMs", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."deleted" FROM treatments WHERE treatments."checkinTime" >= ((julianday(@checkinTime) - 2440587.5) * 86400000) ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "date": "2022-02-21"
            },
            "num_of_records": 102107
        }
    },

    //24
    {
        "desc": "FTS and given authorityName",
        "input": {
            "resource": "treatments",
            "searchparams": "q=tyrannosaurus&authorityName=osborn"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(DISTINCT treatments."treatmentId") AS num_of_records FROM treatments JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE Lower(treatments."authorityName") LIKE @authorityName AND treatmentsFts.fulltext MATCH @q`,

                    "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDateMs", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."deleted" FROM treatments JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE Lower(treatments."authorityName") LIKE @authorityName AND treatmentsFts.fulltext MATCH @q ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "authorityName": "osborn%",
                "q": "tyrannosaurus",
                "cssClass": "hilite",
                "sides": 50
            },
            "num_of_records": 93
        }
    },

    //25
    {
        "desc": "treatmentTitle starts with text",
        "input": {
            "resource": "treatments",
            "searchparams": "treatmentTitle=starts_with(Ichneumonoidea)"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments WHERE treatments."treatmentTitle" LIKE @treatmentTitle`,

                    "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDateMs", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."deleted" FROM treatments WHERE treatments."treatmentTitle" LIKE @treatmentTitle ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatmentTitle": "ichneumonoidea%"
            },
            "num_of_records": 197
        }
    },

    {
        "desc": "treatmentTitle starts with text (alternate)",
        "input": {
            "resource": "treatments",
            "searchparams": "treatmentTitle=Ichneumonoidea*"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments WHERE treatments."treatmentTitle" LIKE @treatmentTitle`,

                    "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDateMs", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."deleted" FROM treatments WHERE treatments."treatmentTitle" LIKE @treatmentTitle ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatmentTitle": "ichneumonoidea%"
            },
            "num_of_records": 197
        }
    },

    //26
    {
        "desc": "treatmentTitle ends with text",
        "input": {
            "resource": "treatments",
            "searchparams": "treatmentTitle=ends_with(1931)"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments WHERE treatments."treatmentTitle" LIKE @treatmentTitle`,

                    "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDateMs", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."deleted" FROM treatments WHERE treatments."treatmentTitle" LIKE @treatmentTitle ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatmentTitle": "ichneumonoidea%"
            },
            "num_of_records": 1793
        }
    },

    {
        "desc": "treatmentTitle ends with text (alternate)",
        "input": {
            "resource": "treatments",
            "searchparams": "treatmentTitle=*1931"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments WHERE treatments."treatmentTitle" LIKE @treatmentTitle`,

                    "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDateMs", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."deleted" FROM treatments WHERE treatments."treatmentTitle" LIKE @treatmentTitle ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatmentTitle": "ichneumonoidea%"
            },
            "num_of_records": 1793
        }
    },

    //27
    {
        "desc": "treatmentTitle contains text",
        "input": {
            "resource": "treatments",
            "searchparams": "treatmentTitle=contains(waterstoni)"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments WHERE treatments."treatmentTitle" = @treatmentTitle`,

                    "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDateMs", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."deleted" FROM treatments WHERE treatments."treatmentTitle" = @treatmentTitle ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatmentTitle": "ichneumonoidea%"
            },
            "num_of_records": 4
        }
    },

    {
        "desc": "treatmentTitle contains text (alternate)",
        "input": {
            "resource": "treatments",
            "searchparams": "treatmentTitle=*waterstoni*"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments WHERE treatments."treatmentTitle" = @treatmentTitle`,

                    "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDateMs", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."deleted" FROM treatments WHERE treatments."treatmentTitle" = @treatmentTitle ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatmentTitle": "ichneumonoidea%"
            },
            "num_of_records": 4
        }
    },

    //28
    {
        "desc": "treatmentTitle is given text (strict eq)",
        "input": {
            "resource": "treatments",
            "searchparams": "treatmentTitle=eq( Cephalonomia tarsalis Ashmead 1893)"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments WHERE treatments."treatmentTitle" = @treatmentTitle`,

                    "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDateMs", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."deleted" FROM treatments WHERE treatments."treatmentTitle" = @treatmentTitle ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatmentTitle": "ichneumonoidea%"
            },
            "num_of_records": 2
        },
    },

    //29
    {
        "desc": "treatmentTitle is not given text (strict ne)",
        "input": {
            "resource": "treatments",
            "searchparams": "treatmentTitle=ne( Cephalonomia tarsalis Ashmead 1893)"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments WHERE treatments."treatmentTitle" != @treatmentTitle`,

                    "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", treatments."treatmentDOI", treatments."treatmentLSID", treatments."zenodoDep", treatments."zoobankId", treatments."articleId", treatments."articleTitle", treatments."articleAuthor", treatments."articleDOI", treatments."publicationDateMs", treatments."journalYear", treatments."journalVolume", treatments."journalIssue", treatments."pages", treatments."authorityName", treatments."authorityYear", treatments."status", treatments."taxonomicNameLabel", treatments."rank", treatments."updateTime", treatments."checkinTime", treatments."deleted" FROM treatments WHERE treatments."treatmentTitle" != @treatmentTitle ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatmentTitle": "ichneumonoidea%"
            },
            "num_of_records": 758085
        }
    }
]