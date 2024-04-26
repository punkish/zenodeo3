export const sampleQueries = [
    
    //52: bare query images with yearlyCounts
    {
        "desc": "bare query images with yearlyCounts",
        "input": {
            "resource": "images",
            "searchparams": "yearlyCounts=true"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM images`,

                    "full": 'SELECT images.id AS images_id, images.httpUri, images.figureDoi, images.captionText, images.treatments_id FROM images ORDER BY images_id ASC LIMIT 30 OFFSET 0',

                    "yearlyCounts": `SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id GROUP BY year ORDER BY year ASC`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {},
            "num_of_records": 392228
        }
    },

    //53: bare query images without yearlyCounts
    {
        "desc": "bare query images without yearlyCounts",
        "input": {
            "resource": "images",
            "searchparams": ""
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM images`,

                    "full": 'SELECT images.id AS images_id, images.httpUri, images.figureDoi, images.captionText, images.treatments_id FROM images ORDER BY images_id ASC LIMIT 30 OFFSET 0',

                    "yearlyCounts": {}
                },
                "related": {},
                "facets": {}
            },
            "runparams": {},
            "num_of_records": 392228
        }
    },

    //54: bare query treatments with yearlyCounts
    {
        "desc": "bare query treatments with yearlyCounts",
        "input": {
            "resource": "treatments",
            "searchparams": "yearlyCounts=true"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments`,

                    "full": 'SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate AS publicationDateOrig, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0',

                    "yearlyCounts": `SSELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id GROUP BY year ORDER BY year ASC`
                },
                "related": {},
                "facets": {}
            },
            "runparams": {},
            "num_of_records": 827428
        }
    },

    //55: bare query treatments without yearlyCounts
    {
        "desc": "bare query treatments without yearlyCounts",
        "input": {
            "resource": "treatments",
            "searchparams": ""
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments`,

                    "full": 'SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate AS publicationDateOrig, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0',

                    "yearlyCounts": {}
                },
                "related": {},
                "facets": {}
            },
            "runparams": {},
            "num_of_records": 827428
        }
    },

    //56: resourceId query treatments
    {
        "desc": "resourceId query treatments",
        "input": {
            "resource": "treatments",
            "searchparams": "treatmentId=000587EFFFA1FFC367F7FB3B34BEFEE6"
        },
        "output": {
            "queries": {
                "main": {
                    "full": 'SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDateMs, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments WHERE treatments.treatmentId = @treatmentId'
                },
                "related": {},
                "facets": {}
            },
            "runparams": {},
            "num_of_records": 1
        }
    },
 
    //57: images for specified treatmentId
    {
        "desc": "images for specified treatmentId",
        "input": {
            "resource": "images",
            "searchparams": "treatmentId=000040332F2853C295734E7BD4190F05&"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments`,
                    "full": ''
                },
                "related": {},
                "facets": {}
            },
            "runparams": {},
            "num_of_records": 351778
        }
    },

    //58: count query images with constraint
    {
        "desc": "count query images with constraint",
        "input": {
            "resource": "images",
            "searchparams": "q=agosti&cols="
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments`,
                    "full": ''
                },
                "related": {},
                "facets": {}
            },
            "runparams": {},
            "num_of_records": 351778
        }
    },

    //59: count query images without constraint
    {
        "desc": "count query images without constraint",
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
                "yearlyCounts": '',
                "related": {},
                "facets": {}
            },
            "runparams": {},
            "num_of_records": 351778
        }
    },

    //60: normal query images without yearlyCounts
    {
        "desc": "normal query images without yearlyCounts",
        "input": {
            "resource": "images",
            "searchparams": "q=agosti"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments`,
                    "full": ''
                },
                "related": {},
                "facets": {}
            },
            "runparams": {},
            "num_of_records": 351778
        }
    },


    // FIX this… SQLITE_ERROR Count(DISTINCT images.id AS images_id)
    //61: normal query images with yearlyCounts
    {
        "desc": "normal query images with yearlyCounts",
        "input": {
            "resource": "images",
            "searchparams": "q=agosti&yearlyCounts=true"
        },
        "output": {
            "queries": {
                "main": {
                    "count": `SELECT Count(*) AS num_of_records FROM treatments`,
                    "full": ''
                },
                "related": {},
                "facets": {}
            },
            "runparams": {},
            "num_of_records": 351778
        }
    },
]