import tap from 'tap';
import {  mainQueries } from './index.js';
import { validate } from '../../z-utils/index.js';
import { ddutils } from "../../../../data-dictionary/utils/index.js";

const testGroups = {
    normalQueries: [

        // 0. without yearlyCounts, single table
        {
            desc: "without yearlyCounts, single table",
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
                dropTmp: false,
                createTmp: false,
                createIndex: false,
                count: "SELECT Count(*) AS num_of_records FROM treatments WHERE treatments.treatmentTitle LIKE @treatmentTitle",
                full: "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments WHERE treatments.treatmentTitle LIKE @treatmentTitle ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0",
                yearlyCounts: false,
                
                runparams: {                                                  
                    treatmentTitle: "Biodiversity%"
                }
            }
        },

        // 1. without yearlyCounts, multiple tables
        {
            input: {
                desc: "without yearlyCounts, multiple tables",
                resource: 'treatments',
                params: validate({ 
                    resource: 'treatments',
                    params: {
                        q: 'agosti',
                        treatmentTitle: 'Biodiversity'
                    }
                }),
                //queryType: 'normal'
            },
            wanted: {
                dropTmp: false,
                createTmp: false,
                createIndex: false,
                count: "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatments.treatmentTitle LIKE @treatmentTitle AND treatmentsFts.fulltext MATCH @q",
                full: "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatments.treatmentTitle LIKE @treatmentTitle AND treatmentsFts.fulltext MATCH @q ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0",

                yearlyCounts: false,
                runparams: {                                                  
                    q: "agosti",
                    cssClass: "hilite",
                    sides: 50,
                    treatmentTitle: "Biodiversity%"
                }
            }
        },

        // 2. without yearlyCounts, multiple tables, with groupby
        {
            input: {
                desc: "without yearlyCounts, multiple tables, with groupby",
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
                dropTmp: false,
                createTmp: false,
                createIndex: false,
                count: "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatmentsFts.fulltext MATCH @q",
                full: "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatmentsFts.fulltext MATCH @q GROUP BY publicationDate ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0",
                yearlyCounts: false,
                
                runparams: {                                                  
                    q: "agosti",
                    cssClass: "hilite",
                    sides: 50
                }
            }
        },

        // 3. with yearlyCounts, multiple tables, with groupby
        {
            input: {
                desc: "with yearlyCounts, multiple tables, with groupby",
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

                yearlyCounts: false,
                
                runparams: {                                                  
                    q: "agosti",
                    cssClass: "hilite",
                    sides: 50
                }
            }
        },

        // 4. without yearlyCounts, multiple tables
        {
            input: {
                desc: "without yearlyCounts, multiple tables",
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
                dropTmp: false,
                createTmp: false,
                createIndex: false,
                count: "SELECT Count(DISTINCT images.id) AS num_of_records FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatmentsFts.fulltext MATCH @q AND treatments.treatmentTitle LIKE @treatmentTitle",
        
                full: "SELECT images.id AS images_id, images.httpUri, images.figureDoi, images.captionText, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatmentsFts.fulltext MATCH @q AND treatments.treatmentTitle LIKE @treatmentTitle ORDER BY images_id ASC LIMIT 30 OFFSET 0",

                yearlyCounts: false,
                runparams: {                                                  
                    q: "agosti",
                    cssClass: "hilite",
                    sides: 50,
                    treatmentTitle: "Biodiversity%"
                }
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
                dropTmp: false,
                createTmp: false,
                createIndex: false,
                count: false,
                full: "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments WHERE treatments.treatmentId = @treatmentId",

                yearlyCounts: false,
                
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
                dropTmp: false,
                createTmp: false,
                createIndex: false,
                count: "SELECT Count(*) AS num_of_records FROM treatments",
                full: false,
                yearlyCounts: false,
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
                dropTmp: false,
                createTmp: false,
                createIndex: false,
                count: "SELECT Count(*) AS num_of_records FROM treatments WHERE treatments.treatmentTitle LIKE @treatmentTitle",
                full: false,
                yearlyCounts: false,
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
                dropTmp: false,
                createTmp: false,
                createIndex: false,
                count: "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatmentsFts.fulltext MATCH @q",
                full: false,
                yearlyCounts: false,
                runparams: {                                                  
                    q: "agosti",
                    cssClass: "hilite",
                    sides: 50
                }
            }
        }
    ],

    bareQueries: [
        {
            input: {
                resource: 'treatments',
                params: validate({ 
                    resource: 'treatments',
                    params: {}
                }),
                resourceParams: ddutils.getParams('treatments'),
                queryType: 'bare'
            },
            wanted: {
                dropTmp: false,
                createTmp: false,
                createIndex: false,
                count: 'SELECT Count(*) AS num_of_records FROM treatments',
                full: "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0",

                yearlyCounts: false,
                
                runparams: false
            }
        }
    ]
};

Object.keys(testGroups).forEach((testGroupName) => {
    const tests = testGroups[testGroupName];
    
    tests.forEach((test, i) => {
        tap.test(`Testing ${testGroupName}`, tap => {
            tap.same(
                mainQueries(test.input), 
                test.wanted,
                `${testGroupName} ${i} ✅`
            );

            tap.end();
        });
    });

});
