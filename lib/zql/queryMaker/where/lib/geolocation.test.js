import tap from 'tap';
import { geolocation, geoloc } from './geolocation.js';

// "within(radius:10,units:'kilometers',lat:40.00,lng:-120"

const tests = [
    {
        input: {
            lat: 39.91006796362754,
            lng: -120.11739786794394
        },
        wanted: {
            constraint: [                   
                "materialCitationsRtree.minX <= @minX",
                "materialCitationsRtree.minY <= @minY",
                "materialCitationsRtree.maxX >= @maxX",
                "materialCitationsRtree.maxY >= @maxY",
            ],                                       
            runparams: {                    
                minX: -120.12912223422235,           
                minY: 39.9010747599903,             
                maxX: -120.1056735016655,           
                maxY: 39.91906116726478,             
            },
        }
    },
    {
        input: { 
            radius: 30, 
            units: 'kilometers', 
            lat: 39.91006796362754,
            lng: -120.11739786794394
        },
        wanted: {
            constraint: [                   
                "materialCitationsRtree.minX <= @minX",
                "materialCitationsRtree.minY <= @minY",
                "materialCitationsRtree.maxX >= @maxX",
                "materialCitationsRtree.maxY >= @maxY",
            ],                                       
            runparams: {                    
                minX: -120.46912703959228,           
                minY: 39.64027185451018,             
                maxX: -119.76566869629558,           
                maxY: 40.1798640727449,             
            },
        }
    },
    {
        input: { 
            min_lat: 39.91006796362754, 
            min_lng: -120.11739786794394, 
            max_lat: 40.08993203637245, 
            max_lng: -119.88260213205605 
        },
        wanted: {
            constraint: [                   
                "materialCitationsRtree.minX <= @minX",
                "materialCitationsRtree.minY <= @minY",
                "materialCitationsRtree.maxX >= @maxX",
                "materialCitationsRtree.maxY >= @maxY",
            ],                                       
            runparams: {                    
                minX: -120.11739786794394,           
                minY: 39.91006796362754,             
                maxX: -119.88260213205605,           
                maxY: 40.08993203637245,             
            },
        }
    }
];

const tests2 = [
    {
        input: { 
            col: {
                name: 'minX', 
                selname: 'materialCitationsRtree.minX'
            },
            val: '-120.11739786794394',
            operator: '>='
        },
        wanted: {
            constraint: 'materialCitationsRtree.minX >= @minX',
            runparams: {
                minX: -120.11739786794394
            }
        }
    },
    {
        input: { 
            col: {
                name: 'maxX', 
                selname: 'materialCitationsRtree.maxX'
            },
            val: '-119.88260213205605',
            operator: '<='
        },
        wanted: {
            constraint: 'materialCitationsRtree.maxX <= @maxX',
            runparams: {
                maxX: -119.88260213205605 
            }
        }
    },
    {
        input: { 
            col: {
                name: 'minY', 
                selname: 'materialCitationsRtree.minY'
            },
            val: '39.91006796362754',
            operator: '>='
        },
        wanted: {
            constraint: 'materialCitationsRtree.minY >= @minY',
            runparams: {
                minY: 39.91006796362754
            }
        }
    },
    {
        input: { 
            col: {
                name: 'maxY', 
                selname: 'materialCitationsRtree.maxY'
            },
            val: '40.08993203637245',
            operator: '<='
        },
        wanted: {
            constraint: 'materialCitationsRtree.maxY <= @maxY',
            runparams: {
                maxY: 40.08993203637245
            }
        }
    }
];

tap.test('geolocation', tap => {
    tests.forEach(test => {
        const found = geolocation(test.input);
        tap.same(found, test.wanted);
    });

    tap.end();
});

// tap.test('geoloc', tap => {
//     tests2.forEach(test => {
//         const found = geoloc(test.input);
//         tap.same(found, test.wanted);
//     });

//     tap.end();
// });