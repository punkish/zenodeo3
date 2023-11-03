export const sampleQueries = [
    
    //0
    {
        "desc": "count",
        "input": {
            "resource": "images",
            "searchparams": "cols="
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM images`,

                    "full": ''
                },
                "related": {},
                "facets": {}
            },
            "runparams": {},
            "num_of_records": 351778
        }
    },

    //1
    {
        "desc": "FTS in captionText",
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
            "num_of_records": 705
        }
    },

    //2
    {
        "desc": "FTS in treatments",
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

    //3
    {
        "desc": "checkinTime between 2010-12-27 and 2021-12-27",
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

    //4
    {
        "desc": "specific journal",
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

    //5
    {
        "desc": "order",
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

    //6
    {
        "desc": "given class",
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

    //7
    {
        desc: 'family Formicidae',
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

    //8
    {
        desc: 'specific treatment',
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

    //9
    {
        "desc": "for an articleDOI",
        "input": {
            "resource": "images",
            "searchparams": "articleDOI=10.11646/zootaxa.5284.3.7&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments."articleDOI" = @articleDOI`,

                    "full": `SELECT images."id", images."httpUri", images."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep" FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments."articleDOI" = @articleDOI ORDER BY images."id" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "articleDOI": "10.11646/zootaxa.5284.3.7"
            },
            "num_of_records": 10
        }
    },

    //10
    {
        "desc": "article title starts with",
        "input": {
            "resource": "images",
            "searchparams": "articleTitle=starts_with(Morphology and taxonomic assessment)&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments."articleTitle" LIKE @articleTitle`,

                    "full": `SELECT images."id", images."httpUri", images."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep" FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments."articleTitle" LIKE @articleTitle ORDER BY images."id" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "articleTitle": "Morphology and taxonomic assessment%"
            },
            "num_of_records": 30
        }
    },

    //11
    {
        "desc": "article title starts with (alternate)",
        "input": {
            "resource": "images",
            "searchparams": "articleTitle=Morphology and taxonomic assessment*&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments."articleTitle" LIKE @articleTitle`,

                    "full": `SELECT images."id", images."httpUri", images."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep" FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments."articleTitle" LIKE @articleTitle ORDER BY images."id" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "articleTitle": "Morphology and taxonomic assessment%"
            },
            "num_of_records": 30
        }
    },

    //12
    {
        "desc": "fishes from publications since date",
        "input": {
            "resource": "images",
            "searchparams": "class=Actinopterygii&publicationDate=since(2021-12-21)&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN classes ON treatments.classes_id = classes.id WHERE treatments."publicationDateMs" >= ((julianday(@publicationDate) - 2440587.5) * 86400000) AND classes."class" = @class`,

                    "full": `SELECT images."id", images."httpUri", images."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep" FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN classes ON treatments.classes_id = classes.id WHERE treatments."publicationDateMs" >= ((julianday(@publicationDate) - 2440587.5) * 86400000) AND classes."class" = @class ORDER BY images."id" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "publicationDate": "2021-12-21",
                "class": "Actinopterygii"
            },
            "num_of_records": 1196
        }
    },

    //13
    {
        "desc": "FTS treatments decapoda and journal not Zootaxa",
        "input": {
            "resource": "images",
            "searchparams": "q=decapoda&journalTitle=not_like(zootaxa)&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid JOIN journals ON treatments.journals_id = journals.id WHERE treatmentsFts.fulltext MATCH @q AND journals."journalTitle" NOT LIKE @journalTitle`,

                    "full": `SELECT images."id", images."httpUri", images."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep" FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid JOIN journals ON treatments.journals_id = journals.id WHERE treatmentsFts.fulltext MATCH @q AND journals."journalTitle" NOT LIKE @journalTitle ORDER BY images."id" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "q": "decapoda",
                "cssClass": "hilite",
                "sides": 50,
                "journalTitle": "zootaxa"
            },
            "num_of_records": 278
        }
    },

    //14
    {
        "desc": "article author",
        "input": {
            "resource": "images",
            "searchparams": "articleAuthor=agosti&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE Lower(treatments."articleAuthor") LIKE @articleAuthor`,

                    "full": `SELECT images."id", images."httpUri", images."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep" FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE Lower(treatments."articleAuthor") LIKE @articleAuthor ORDER BY images."id" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "articleAuthor": "agosti%"
            },
            "num_of_records": 4
        }
    },

    //15
    {
        "desc": "authority",
        "input": {
            "resource": "images",
            "searchparams": "authorityName=miller&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE Lower(treatments."authorityName") LIKE @authorityName`,

                    "full": `SELECT images."id", images."httpUri", images."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep" FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE Lower(treatments."authorityName") LIKE @authorityName ORDER BY images."id" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "authorityName": "miller%"
            },
            "num_of_records": 420
        }
    },

    //16
    {
        "desc": "phylum",
        "input": {
            "resource": "images",
            "searchparams": "phylum=starts_with(mol)&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN phyla ON treatments.phyla_id = phyla.id WHERE phyla."phylum" LIKE @phylum`,

                    "full": `SELECT images."id", images."httpUri", images."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep" FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN phyla ON treatments.phyla_id = phyla.id WHERE phyla."phylum" LIKE @phylum ORDER BY images."id" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "q": "decapoda",
                "cssClass": "hilite",
                "sides": 50,
                "journalTitle": "zootaxa"
            },
            "num_of_records": 9821
        }
    },

    //17
    {
        "desc": "for an treatmentDOI",
        "input": {
            "resource": "images",
            "searchparams": "treatmentDOI=10.5281/zenodo.3854768&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments."articleDOI" = @articleDOI`,

                    "full": `SELECT images."id", images."httpUri", images."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep" FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments."articleDOI" = @articleDOI ORDER BY images."id" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "articleDOI": "10.5281/zenodo.3854768"
            },
            "num_of_records": 1
        }
    },

    //18
    {
        "desc": "for a specific journal year",
        "input": {
            "resource": "images",
            "searchparams": "journalYear=1998&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments."articleDOI" = @articleDOI`,

                    "full": `SELECT images."id", images."httpUri", images."captionText", treatments."treatmentId", treatments."treatmentTitle", treatments."zenodoDep" FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments."articleDOI" = @articleDOI ORDER BY images."id" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "articleDOI": "10.11646/zootaxa.5284.3.7"
            },
            "num_of_records": 112
        }
    },

    //3
    {
        "desc": "from last ten days",
        "input": {
            "resource": "images",
            "searchparams": "checkinTime=since(2023-05-24)"
        },
        "output": {
            "queries": {
                "count": `SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments."checkinTime" >= ((julianday(@checkinTime) - 2440587.5) * 86400000)`,

                "full": `SELECT images."id", images."httpUri", images."figureDoi", images."captionText", images."treatments_id" FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments."checkinTime" >= ((julianday(@checkinTime) - 2440587.5) * 86400000) ORDER BY images."id" ASC LIMIT 30 OFFSET 0`
            },
            "runparams": {
                "checkinTime": "2023-05-24"
            },
            "num_of_records": 286
        }
    },

    ///v3/images?geolocation=within(radius:10,%20units:%27kilometers%27,%20lat:40.21,%20lng:-120.33)&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption&refreshCache=true

    //44
    {
        "desc": "images from a geolocation",
        "input": {
            "resource": "images",
            "searchparams": "geolocation=within(radius:10, units:'kilometers',lat:40.21,lng:-120.33)&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE figureCitationsFts.captionText MATCH @captionText AND figureCitations.isImage = 1`,
                    "full": `SELECT treatments."treatmentId", figureCitations.httpUri, figureCitations.captionText FROM treatments JOIN figureCitations ON treatments.id = figureCitations.treatments_id JOIN figureCitationsFts ON figureCitations.id = figureCitationsFts.rowid WHERE figureCitationsFts.captionText MATCH @captionText AND figureCitations.isImage = 1 ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {
                "q": "acamar"
            }
        }
    },
]

