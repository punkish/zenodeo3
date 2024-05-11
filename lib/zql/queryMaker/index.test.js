import tap from 'tap';
import * as funcsToTest from './index.js';
import { validate } from '../z-utils/index.js';
import { ddutils } from "../../../data-dictionary/utils/index.js";

const testGroups = {
    bareQueries: [
        {
            input: {
                resource: 'treatments',
                params: validate({ 
                    resource: 'treatments',
                    params: {
                        q: 'agosti',
                        treatmentTitle: 'Biodiversity'
                    }
                }),
                queryType: 'normal'
            },
            wanted: {
                count: "SELECT Count(*) AS num_of_records FROM treatments JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid",
        
                full: "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0"
            }
        },
        {
            input: {
                resource: 'images',
                params: validate({ 
                    resource: 'images',
                    params: {
                        q: 'agosti',
                        treatmentTitle: 'Biodiversity'
                    }
                }),
                queryType: 'normal'
            },
            wanted: {
                count: "SELECT Count(*) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid",
        
                full: "SELECT images.id AS images_id, images.httpUri, images.figureDoi, images.captionText, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid ORDER BY images_id ASC LIMIT 30 OFFSET 0"
            }
        }
    ],

    resourceIdQueries: [
        {
            input: {
                resource: 'treatments',
                params: validate({ 
                    resource: 'treatments',
                    params: {
                        treatmentId: 'E83A2C2AFF8DFFA5FF76FC9F5ADD6BFE'
                    }
                }),
                resourceParams: ddutils.getParams('treatments'),
                resourceId: {
                    name: 'treatmentId',
                    selname: 'treatments.treatmentId'
                },
                queryType: 'resourceId'
            },
            wanted: {
                full: "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments WHERE treatments.treatmentId = @treatmentId",
                
                runparams: {
                    treatmentId: 'E83A2C2AFF8DFFA5FF76FC9F5ADD6BFE'
                }
            }
        }
    ],

    countQueries: [

        // without constraint
        {
            input: {
                resource: 'treatments',
                params: validate({ 
                    resource: 'treatments',
                    params: {
                        cols: ''
                    }
                }),
                resourceParams: ddutils.getParams('treatments'),
                queryType: 'count'
            },
            wanted: {
                count: "SELECT Count(*) AS num_of_records FROM treatments",
                runparams: {}
            }
        },

        // with constraint, single table
        {
            input: {
                resource: 'treatments',
                params: validate({ 
                    resource: 'treatments',
                    params: {
                        cols: '',
                        treatmentTitle: 'Biodiversity'
                    }
                }),
                resourceParams: ddutils.getParams('treatments'),
                queryType: 'count'
            },
            wanted: {
                count: "SELECT Count(*) AS num_of_records FROM treatments WHERE treatments.treatmentTitle LIKE @treatmentTitle",
                runparams: {
                    treatmentTitle: 'Biodiversity%'
                }
            }
        },

        // with constraint
        {
            input: {
                resource: 'treatments',
                params: validate({ 
                    resource: 'treatments',
                    params: {
                        q: 'agosti',
                        cols: ''
                    }
                }),
                resourceParams: ddutils.getParams('treatments'),
                resourceId: {
                    name: 'treatmentId',
                    selname: 'treatments.treatmentId'
                },
                queryType: 'count'
            },
            wanted: {
                count: "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatmentsFts.fulltext MATCH @q",
                runparams: {                                                  
                    q: "agosti",
                    cssClass: "hilite",
                    sides: 50
                }
            }
        }
    ],

    normalQueries: [

        // without yearlyCounts, single table
        {
            input: {
                resource: 'treatments',
                params: validate({ 
                    resource: 'treatments',
                    params: {
                        treatmentTitle: 'Biodiversity'
                    }
                }),
                resourceParams: ddutils.getParams('treatments'),
                queryType: 'normal'
            },
            wanted: {
                count: "SELECT Count(*) AS num_of_records FROM treatments WHERE treatments.treatmentTitle LIKE @treatmentTitle",

                full: "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments WHERE treatments.treatmentTitle LIKE @treatmentTitle ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0",
                
                runparams: {                                                  
                    treatmentTitle: "Biodiversity%"
                }
            }
        },

        // without yearlyCounts
        {
            input: {
                resource: 'treatments',
                params: validate({ 
                    resource: 'treatments',
                    params: {
                        q: 'agosti',
                        groupby: 'publicationDate'
                    }
                }),
                resourceParams: ddutils.getParams('treatments'),
                resourceId: {
                    name: 'treatmentId',
                    selname: 'treatments.treatmentId'
                },
                queryType: 'normal'
            },
            wanted: {
                count: "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatmentsFts.fulltext MATCH @q",

                full: "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatmentsFts.fulltext MATCH @q GROUP BY publicationDate ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0",
                
                runparams: {                                                  
                    q: "agosti",
                    cssClass: "hilite",
                    sides: 50
                }
            }
        },

        // // with yearlyCounts
        {
            input: {
                resource: 'treatments',
                params: validate({ 
                    resource: 'treatments',
                    params: {
                        q: 'agosti',
                        groupby: 'publicationDate',
                        yearlyCounts: true
                    }
                }),
                resourceParams: ddutils.getParams('treatments'),
                resourceId: {
                    name: 'treatmentId',
                    selname: 'treatments.treatmentId'
                },
                queryType: 'normal'
            },
            wanted: {
                dropTmp: "DROP TABLE IF EXISTS tmp",

                createTmp: "CREATE TEMP TABLE tmp AS SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatmentsFts.fulltext MATCH @q GROUP BY publicationDate ORDER BY treatments.treatmentId ASC",

                createIndex: "CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)",

                count: "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM tmp",

                full: "SELECT * FROM tmp LIMIT 30 OFFSET 0",
                
                runparams: {                                                  
                    q: "agosti",
                    cssClass: "hilite",
                    sides: 50
                }
            }
        },

        // images with yearlyCounts
        {
            input: {
                resource: 'images',
                params: validate({ 
                    resource: 'images',
                    params: {
                        class: 'Malacostraca',
                        yearlyCounts: true,
                        cols: [
                            'treatmentId',
                            'treatmentTitle',
                            'zenodoDep',
                            'treatmentDOI',
                            'articleTitle',
                            'articleAuthor',
                            'httpUri',
                            'caption'
                        ]
                    }
                }),
                resourceParams: ddutils.getParams('images'),
                resourceId: {
                    name: 'id',
                    selname: 'images.id'
                },
                queryType: 'normal'
            },
            wanted: {
                dropTmp: "DROP TABLE IF EXISTS tmp",

                createTmp: "CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN classes ON treatments.classes_id = classes.id WHERE classes.class LIKE @class ORDER BY images_id ASC",

                createIndex: "CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)",
               
               count: "SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp",

                full: "SELECT * FROM tmp LIMIT 30 OFFSET 0",
                
                runparams: {                                                  
                    class: "Malacostraca%"
                }
            }
        },
    ]
};

Object.keys(testGroups).forEach((testGroupName) => {
    const tests = testGroups[testGroupName];

    tests.forEach((test, i) => {
        tap.test(`${testGroupName} ${i}`, tap => {
            const found = funcsToTest[testGroupName](test.input);
            tap.same(found, test.wanted);
            tap.end();
        });
    });

});
