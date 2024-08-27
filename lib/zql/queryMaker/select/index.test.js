import tap from 'tap';
import { getSelect } from './index.js';
import { validate } from '../../z-utils/index.js';

const tests = [
    {
        input: {
            resource: 'treatments',
            params: validate({ 
                resource: 'treatments',
                params: {
                    q: 'agosti',
                    treatmentTitle: 'Biodiversity'
                }
            })
        },
        wanted: [
            "treatments.treatmentId",       
            "treatments.treatmentTitle",    
            "treatments.treatmentDOI",      
            "treatments.treatmentLSID",     
            "treatments.zenodoDep",         
            "treatments.zoobankId",         
            "treatments.articleId",         
            "treatments.articleTitle",      
            "treatments.articleAuthor",     
            "treatments.articleDOI",        
            "treatments.publicationDate",   
            "treatments.journalYear",       
            "treatments.journalVolume",     
            "treatments.journalIssue",      
            "treatments.pages",             
            "treatments.authorityName",     
            "treatments.authorityYear",     
            "treatments.status",            
            "treatments.taxonomicNameLabel",
            "treatments.rank",              
            "treatments.updateTime",        
            "treatments.checkinTime"
        ]
    },
    {
        input: {
            resource: 'images',
            params: validate({ 
                resource: 'images',
                params: {
                    q: 'agosti'
                }
            })
        },
        wanted: [
            "images.id AS images_id",                    
            "images.httpUri",               
            "images.figureDoi",             
            "images.captionText",           
            "images.treatments_id"
        ]
    },
    {
        input: {
            resource: 'materialCitations',
            params: validate({ 
                resource: 'materialCitations',
                params: {
                    q: 'agosti',
                    cols: 'collectingDate'
                }
            })
        },
        wanted: [
            "materialCitations.materialCitationId", 
            "materialCitations.collectingDate",
            "materialCitations.treatments_id"
        ]
    },
    {
        input: {
            resource: 'treatmentCitations',
            params: validate({ 
                resource: 'treatmentCitations',
                params: {
                    treatmentCitation: 'Dor',
                    cols: 'treatmentCitation'
                }
            })
        },
        wanted: [
            "treatmentCitations.treatmentCitationId",
            "treatmentCitations.treatmentCitation",
            "treatmentCitations.treatments_id"
        ]
    },
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
            })
        },
        wanted: [
            "images.id AS images_id",                    
            "images.httpUri",               
            "images.captionText",
            "treatments.treatmentId",   
            "treatments.treatmentTitle",
            "treatments.treatmentDOI",  
            "treatments.zenodoDep",     
            "treatments.articleTitle",  
            "treatments.articleAuthor",      
            "images.treatments_id"
        ]
    },

    {
        input: {
            resource: 'images',
            params: validate({ 
                resource: 'images',
                params: {
                    collectionCode: 'MfN',
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
            })
        },
        wanted: [
            "images.id AS images_id",                    
            "images.httpUri",               
            "images.captionText",
            "treatments.treatmentId",   
            "treatments.treatmentTitle",
            "treatments.treatmentDOI",  
            "treatments.zenodoDep",     
            "treatments.articleTitle",  
            "treatments.articleAuthor",      
            "images.treatments_id"
        ]
    },
];


tests.forEach((test, i) => {

    tap.test(`select ${i}`, tap => {
        const found = getSelect(test.input);
        tap.same(found, test.wanted);
        tap.end();
    });

});

    