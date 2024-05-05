import tap from 'tap';
import { getWhere } from './index.js';
import { ddutils } from "../../../../data-dictionary/utils/index-ng.js";

const tests = [
    {
        input: {
            resource: 'treatments',
            params: {
                treatmentTitle: 'Biodiversity'
            },
            resourceParams: ddutils.getParams('treatments'),
            resourceId: ddutils.getParams('treatments').filter(param => param.isResourceId)[0]
        },
        wanted: {
            constraints: [ 'treatments.treatmentTitle LIKE @treatmentTitle' ],
            runparams: {
                treatmentTitle: 'Biodiversity%'
            }
        }
    },
    {
        input: {
            resource: 'treatments',
            params: {
                treatmentLSID: 'urn:lsid:plazi:treatment:000B06B02350EF7F0E538C1045DA36A8'
            },
            resourceParams: ddutils.getParams('treatments'),
            resourceId: ddutils.getParams('treatments').filter(param => param.isResourceId)[0]
        },
        wanted: {
            constraints: [ 'treatments.treatmentLSID = @treatmentLSID' ],
            runparams: {
                treatmentLSID: 'urn:lsid:plazi:treatment:000B06B02350EF7F0E538C1045DA36A8'
            }
        }
    },
    {
        input: {
            resource: 'treatments',
            params: {
                treatmentId: '45fgedf5634c'
            },
            resourceParams: ddutils.getParams('treatments'),
            resourceId: ddutils.getParams('treatments').filter(param => param.isResourceId)[0]
        },
        wanted: {
            constraints: [ 'treatments.treatmentId = @treatmentId' ],
            runparams: {
                treatmentId: '45fgedf5634c'
            }
        }
    },
    {
        input: {
            resource: 'treatments',
            params: {
                zenodoDep: 5672923
            },
            resourceParams: ddutils.getParams('treatments'),
            resourceId: ddutils.getParams('treatments').filter(param => param.isResourceId)[0]
        },
        wanted: {
            constraints: [ 'treatments.zenodoDep = @zenodoDep' ],
            runparams: {
                zenodoDep: 5672923
            }
        }
    },
    {
        input: {
            resource: 'treatments',
            params: {
                validGeo: true
            },
            resourceParams: ddutils.getParams('treatments'),
            resourceId: ddutils.getParams('treatments').filter(param => param.isResourceId)[0]
        },
        wanted: {
            constraints: [ 'treatments.validGeo = @validGeo' ],
            runparams: {
                validGeo: 1
            }
        }
    },
    {
        input: {
            resource: 'treatments',
            params: {
                validGeo: false
            },
            resourceParams: ddutils.getParams('treatments'),
            resourceId: ddutils.getParams('treatments').filter(param => param.isResourceId)[0]
        },
        wanted: {
            constraints: [ 'treatments.validGeo = @validGeo' ],
            runparams: {
                validGeo: 0
            }
        }
    },
    {
        input: {
            resource: 'treatments',
            params: {
                q: 'agosti'
            },
            resourceParams: ddutils.getParams('treatments'),
            resourceId: ddutils.getParams('treatments').filter(param => param.isResourceId)[0]
        },
        wanted: {
            constraints: [ 'treatmentsFts.fulltext MATCH @q' ],
            runparams: {
                q: 'agosti',
                cssClass: 'hilite',
                sides: 50
            }
        }
    },
    {
        input: {
            resource: 'treatments',
            params: {
                checkinTime: 'until(2008-09-12)'
            },
            resourceParams: ddutils.getParams('treatments'),
            resourceId: ddutils.getParams('treatments').filter(param => param.isResourceId)[0]
        },
        wanted: {
            constraints: [ 'treatments.checkinTime <= Unixepoch(@checkinTime) * 1000' ],
            runparams: {
                checkinTime: '2008-09-12'
            }
        }
    },
    {
        input: {
            resource: 'treatments',
            params: {
                checkinTime: 'since(2008-09-12)'
            },
            resourceParams: ddutils.getParams('treatments'),
            resourceId: ddutils.getParams('treatments').filter(param => param.isResourceId)[0]
        },
        wanted: {
            constraints: [ 'treatments.checkinTime >= Unixepoch(@checkinTime) * 1000' ],
            runparams: {
                checkinTime: '2008-09-12'
            }
        }
    },
    {
        input: {
            resource: 'treatments',
            params: {
                checkinTime: 'between(2008-09-12 and 2010-12-19)'
            },
            resourceParams: ddutils.getParams('treatments'),
            resourceId: ddutils.getParams('treatments').filter(param => param.isResourceId)[0]
        },
        wanted: {
            constraints: [ 
                'treatments.checkinTime BETWEEN Unixepoch(@from) * 1000 AND Unixepoch(@to) * 1000' 
            ],
            runparams: {
                from: '2008-09-12',
                to: '2010-12-19'
            }
        }
    },
    {
        input: {
            resource: 'treatments',
            params: {
                treatmentTitle: 'starts_with(Biodiversity)'
            },
            resourceParams: ddutils.getParams('treatments'),
            resourceId: ddutils.getParams('treatments').filter(param => param.isResourceId)[0]
        },
        wanted: {
            constraints: [ 'treatments.treatmentTitle LIKE @treatmentTitle' ],
            runparams: {
                treatmentTitle: 'Biodiversity%'
            }
        }
    },
    {
        input: {
            resource: 'treatments',
            params: {
                treatmentTitle: 'Biodiversity*'
            },
            resourceParams: ddutils.getParams('treatments'),
            resourceId: ddutils.getParams('treatments').filter(param => param.isResourceId)[0]
        },
        wanted: {
            constraints: [ 'treatments.treatmentTitle LIKE @treatmentTitle' ],
            runparams: {
                treatmentTitle: 'Biodiversity%'
            }
        }
    },
    {
        input: {
            resource: 'treatments',
            params: {
                treatmentTitle: 'ends_with(Biodiversity)'
            },
            resourceParams: ddutils.getParams('treatments'),
            resourceId: ddutils.getParams('treatments').filter(param => param.isResourceId)[0]
        },
        wanted: {
            constraints: [ 'treatments.treatmentTitle LIKE @treatmentTitle' ],
            runparams: {
                treatmentTitle: '%Biodiversity'
            }
        }
    },
    {
        input: {
            resource: 'treatments',
            params: {
                treatmentTitle: '*Biodiversity'
            },
            resourceParams: ddutils.getParams('treatments'),
            resourceId: ddutils.getParams('treatments').filter(param => param.isResourceId)[0]
        },
        wanted: {
            constraints: [ 'treatments.treatmentTitle LIKE @treatmentTitle' ],
            runparams: {
                treatmentTitle: '%Biodiversity'
            }
        }
    },
    {
        input: {
            resource: 'treatments',
            params: {
                treatmentTitle: 'contains(Biodiversity)'
            },
            resourceParams: ddutils.getParams('treatments'),
            resourceId: ddutils.getParams('treatments').filter(param => param.isResourceId)[0]
        },
        wanted: {
            constraints: [ 'treatments.treatmentTitle LIKE @treatmentTitle' ],
            runparams: {
                treatmentTitle: '%Biodiversity%'
            }
        }
    },
    {
        input: {
            resource: 'treatments',
            params: {
                treatmentTitle: '*Biodiversity*'
            },
            resourceParams: ddutils.getParams('treatments'),
            resourceId: ddutils.getParams('treatments').filter(param => param.isResourceId)[0]
        },
        wanted: {
            constraints: [ 'treatments.treatmentTitle LIKE @treatmentTitle' ],
            runparams: {
                treatmentTitle: '%Biodiversity%'
            }
        }
    },
    {
        input: {
            resource: "images",
            params: {
                geolocation: "within(radius:10, units:'kilometers',lat:40.21,lng:-120.33)"
            },
            resourceParams: ddutils.getParams('images'),
            resourceId: ddutils.getParams('images').filter(param => param.isResourceId)[0]
        },
        wanted: {
            constraints: [
                "materialCitationsRtree.minX <= @minX",
                "materialCitationsRtree.minY <= @minY",
                "materialCitationsRtree.maxX >= @maxX",
                "materialCitationsRtree.maxY >= @maxY",
            ],
            runparams: {                    
                minX: -120.44776082589335,           
                minY: 40.12006796362754,             
                maxX: -120.21223917410664,           
                maxY: 40.299932036372454,             
            },
        }
    },
    {
        input: {
            resource: "images",
            params: {
                geolocation: "within(min_lat:20.1,min_lng:-120.32,max_lat:20.5,max_lng:-120.22)"
            },
            resourceParams: ddutils.getParams('images'),
            resourceId: ddutils.getParams('images').filter(param => param.isResourceId)[0]
        },
        wanted: {
            constraints: [
                "materialCitationsRtree.minX <= @minX",
                "materialCitationsRtree.minY <= @minY",
                "materialCitationsRtree.maxX >= @maxX",
                "materialCitationsRtree.maxY >= @maxY",
            ],
            runparams: {                    
                minX: -120.32,           
                minY: 20.1,             
                maxX: -120.22,           
                maxY: 20.5,             
            },
        }
    }
];


tap.test('where', tap => {
    tests.forEach(test => {
        const found = getWhere(test.input);
        tap.same(found, test.wanted);
    });

    tap.end();
});