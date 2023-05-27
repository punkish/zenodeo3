export const sampleQueries = [

    //0: geolocation
    {
        desc: `geoloc: treatments with latlng in a bounding box`,
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
        desc: 'number: treatments for a specific treatmentVersion',
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
        desc: 'bool  : treatments with a valid geolocation',
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
        "desc": "date  : treatments with checkinTime since 2022-02-21",
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
        "desc": "date  : treatments with checkinTime until 2022-02-21",
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
        "desc": "date  : treatments with checkinTime between 2022-02-21 and 2023-02-21",
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
        desc: 'year  : treatments for a given journal year',
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
    
    //7
    {
        "desc": "images: count",
        "input": {
            "resource": "images",
            "searchparams": "cols="
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM images`,

                    "full": null
                },
                "related": {},
                "facets": {}
            },
            "runparams": {},
            "num_of_records": 350541
        }
    },

    //8
    {
        "desc": "images: FTS in captionText",
        "input": {
            "resource": "images",
            "searchparams": "captionText=phylogeny&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM images JOIN imagesFts ON images.id = imagesFts.rowid JOIN treatments ON images.treatments_id = treatments.id WHERE imagesFts."captionText" MATCH @captionText`,

                    "full": `SELECT images."id", images."httpUri", images."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep" FROM images JOIN imagesFts ON images.id = imagesFts.rowid JOIN treatments ON images.treatments_id = treatments.id WHERE imagesFts."captionText" MATCH @captionText ORDER BY +images."id" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "captionText": "phylogeny",
                "cssClass": "hilite",
                "sides": 50
            },
            "num_of_records": 694
        }
    },

    //9
    {
        "desc": "images: FTS in treatments",
        "input": {
            "resource": "images",
            "searchparams": "q=phylogeny AND plantae&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption"
        },
        "output": {
            "queries": {
                "count": `SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatmentsFts.fulltext MATCH @q`,

                "full": `SELECT images."id", images."httpUri", images."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep" FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatmentsFts.fulltext MATCH @q ORDER BY +images."id" ASC LIMIT 30 OFFSET 0`
            },
            "runparams": {
                "q": "phylogeny AND plantae",
                "cssClass": "hilite",
                "sides": 50
            },
            "num_of_records": 3
        }
    },

    //10
    {
        "desc": "images: checkinTime between 2010-12-27 and 2021-12-27",
        "input": {
            "resource": "images",
            "searchparams": "checkinTime=between(2010-12-27 and 2021-12-27)"
        },
        "output": {
            "queries": {
                "count": `SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments."checkinTime" BETWEEN ((julianday(@from) - 2440587.5) * 86400000) AND ((julianday(@to) - 2440587.5) * 86400000)`,

                "full": `SELECT images."id", images."httpUri", images."figureDoi", images."captionText", images."treatments_id" FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments."checkinTime" BETWEEN ((julianday(@from) - 2440587.5) * 86400000) AND ((julianday(@to) - 2440587.5) * 86400000) ORDER BY +images."id" ASC LIMIT 30 OFFSET 0`
            },
            "runparams": {
                "from": "2010-12-27",
                "to": "2021-12-27"
            },
            "num_of_records": 299111
        }
    },

    //11
    {
        "desc": "images: specific journal",
        "input": {
            "resource": "images",
            "searchparams": "journalTitle=eq(European Journal of Taxonomy)&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption"
        },
        "output": {
            "queries": {
                "count": `SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN journals ON treatments.journals_id = journals.id WHERE journals."journalTitle" = @journalTitle COLLATE BINARY`,

                "full": `SELECT images."id", images."httpUri", images."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep" FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN journals ON treatments.journals_id = journals.id WHERE journals."journalTitle" = @journalTitle COLLATE BINARY ORDER BY +images."id" ASC LIMIT 30 OFFSET 0`,
            },
            "runparams": {
                "journalTitle": "european journal of taxonomy%"
            },
            "num_of_records": 15500
        }
    },

    //12
    {
        "desc": "images: order",
        "input": {
            "resource": "images",
            "searchparams": "order=coleoptera&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption"
        },
        "output": {
            "queries": {
                "count": `SELECT Count(*) AS num_of_records FROM images JOIN imagesFts ON images.id = imagesFts.rowid JOIN treatments ON images.treatments_id = treatments.id JOIN orders ON treatments.orders_id = orders.id WHERE orders."order" = @order`,

                "full": `SELECT images."id", images."httpUri", imagesFts."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep" FROM images JOIN imagesFts ON images.id = imagesFts.rowid JOIN treatments ON images.treatments_id = treatments.id JOIN orders ON treatments.orders_id = orders.id WHERE orders."order" = @order ORDER BY +images."id" ASC LIMIT 30 OFFSET 0`,
            },
            "runparams": {
                "order": "coleoptera"
            },
            "num_of_records": 41014
        }
    },

    //13
    {
        "desc": "images: given class",
        "input": {
            "resource": "images",
            "searchparams": "class=Actinopterygii&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN classes ON treatments.classes_id = classes.id WHERE classes."class" = @class`,

                    "full": `SELECT images."id", images."httpUri", images."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep" FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN classes ON treatments.classes_id = classes.id WHERE classes."class" = @class ORDER BY +images."id" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "class": "actinopterygii"
            },
            "num_of_records": 13721
        }
    },

    //14
    {
        desc: 'images: family Formicidae',
        input: {
            resource: 'images',
            searchparams: "family=Formicidae&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption"
        },
        output: {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN families ON treatments.families_id = families.id WHERE families."family" = @family`,

                    "full": `SELECT images."id", images."httpUri", images."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep" FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN families ON treatments.families_id = families.id WHERE families."family" = @family ORDER BY +images."id" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "family": "formicidae"
            },
            "num_of_records": 3624
        }
    },

    //15
    {
        desc: 'images: specific treatment',
        input: {
            resource: 'images',
            searchparams: 'treatmentId=000040332F2853C295734E7BD4190F05&cols=httpUri&cols=caption'
        },
        output: {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments."treatmentId" = @treatmentId`,

                    "full": `SELECT images."id", images."httpUri", images."captionText" FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments."treatmentId" = @treatmentId ORDER BY +images."id" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "treatments.treatmentId": "000040332F2853C295734E7BD4190F05"
            },
            "num_of_records": 5
        }
    },

    //16
    {
        desc: 'treatm: specified collection code',
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

    //17
    {
        desc: 'treatm: FTS and valid location',
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

    //18
    {
        desc: 'treatm: FTS and a bounding box',
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

    //19
    {
        "desc": "treatm: checkinTime since 2022-02-21",
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

    //20
    {
        "desc": "treatm: FTS and given authorityName",
        "input": {
            "resource": "treatments",
            "searchparams": "q=tyrannosaurus&authorityName=osborn&stats=true"
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

    //21
    {
        "desc": "treatm: treatmentTitle starts with given text",
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

    //22
    {
        "desc": "treatm: treatmentTitle ends with given text",
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

    //23
    {
        "desc": "treatm: treatmentTitle contains given text",
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

    //24
    {
        "desc": "treatm: treatmentTitle is given text (strict eq)",
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

    //25
    {
        "desc": "treatm: treatmentTitle is not given text (strict ne)",
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
    },

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
]