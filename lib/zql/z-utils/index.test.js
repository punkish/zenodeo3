import tap from 'tap';
import * as funcsToTest from './index.js';

const testGroups = {
    validate: [
        {
            input: {
                resource: 'treatments',
                params: { 
                    authorityName: 'starts_with(Agosti)'
                }
            },
            wanted: {
                authorityName: 'starts_with(Agosti)',
                refreshCache: false,
                facets: false,
                relatedRecords: false,
                page: 1,
                size: 30,
                cacheDuration: 7,    
                stats: false,        
                termFreq: false,     
                yearlyCounts: false, 
                groupby: "", 
                sortby: 'treatments.treatmentId:ASC',
                cols: [        
                    "treatmentId",       
                    "treatmentTitle",    
                    "treatmentDOI",      
                    "treatmentLSID",     
                    "zenodoDep",         
                    "zoobankId",         
                    "articleId",         
                    "articleTitle",      
                    "articleAuthor",     
                    "articleDOI",        
                    "publicationDate",   
                    "journalYear",       
                    "journalVolume",     
                    "journalIssue",      
                    "pages",             
                    "authorityName",     
                    "authorityYear",               
                    "status",            
                    "taxonomicNameLabel",
                    "rank",              
                    "updateTime",        
                    "checkinTime",       
                  ]
            }
        }
    ],

    formatDate: [
        {
            input: '2021-1-2',
            wanted: '2021-01-02'
        },
        {
            input: '2021-12-21',
            wanted: '2021-12-21'
        },
        {
            input: '2021-3-21',
            wanted: '2021-03-21'
        },
        {
            input: '2021-11-1',
            wanted: '2021-11-01'
        },
        {
            input: 'yesterday',
            wanted: funcsToTest.formatDate('yesterday')
        }
    ],

    getQueryType: [
        {
            input: {
                params: {
                    q: 'agosti'
                }
            },
            wanted: 'count'
        },
        {
            input: {
                params: {
                    treatmentId: 'E83A2C2AFF8DFFA5FF76FC9F5ADD6BFE',
                    cols: [ 'treatmentTitle' ]
                },
                resourceId: {
                    name: 'treatmentId',
                    selname: 'treatments.treatmentId'
                }
            },
            wanted: 'resourceId'
        },
        {
            input: {
                params: {
                    cols: [ 'treatmentTitle' ]
                }
            },
            wanted: 'bare'
        },
        {
            input: {
                params: {
                    q: 'agosti',
                    cols: [ 'treatmentTitle' ]
                }
            },
            wanted: 'normal'
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
