'use strict';

const treatmentImages = [
    {
        name: 'id',
        schema: {
            type:"integer",
            description: 'unique identifier of the record',
            isResourceId: true
        },
        sqltype: 'INTEGER PRIMARY KEY',
    },

    {
        name: 'httpUri',
        schema: { 
            type: 'string', 
            description: 'The URI of the image'
        },
        sqltype: 'TEXT NOT NULL UNIQUE'
    },

    {
        name: 'captionText',
        schema: { 
            type: 'string', 
            description: `The full text of the figure cited by this treatment. Can use the following syntax: \`captionText=spiders\``
        },
        sqltype: 'TEXT',
    },

    {
        name: 'treatmentId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the parent treatment (FK). Has to be a 32 character string like:  '000087F6E320FF95FF7EFDC1FAE4FA7B'`
        },
        sqltype: 'TEXT',
    }
];

const otherResources = {
    treatments: {
        dd: require('./treatments.js'),
        params: [
            'treatmentTitle',
            'treatmentDOI',
            'zenodoDep',
            'publicationDate',
            'checkinTime',
            'q'
        ]
    },

    materialsCitations: {
        dd: require('./materialsCitations.js'),
        params: [
            'latitude',
            'longitude',
            'geolocation',
            'isOnLand',
            'validGeo'
        ]
    }
};

for (let [resource, desc] of Object.entries(otherResources)) {
    const dd = desc.dd;
    const params = desc.params;

    params.forEach(param => {
        const p = dd.filter(p => p.name === param)[0];
    
        if (p.zqltype && p.zqltype !== 'expression') {
            if (!('alias' in p)) {
                p.alias = {
                    select: `${resource}.${param}`,
                    where : `${resource}.${param}`
                };
            }
            
            if (!('joins' in p)) {
                p.joins = {
                    select: [ `JOIN ${resource} ON treatmentImages.treatmentId = ${resource}.treatmentId` ],
                    where : [ `JOIN ${resource} ON treatmentImages.treatmentId = ${resource}.treatmentId` ]
                };
            }
    
            p.notDefaultCol = true;
        }
        else {
            if (!('alias' in p)) {
                p.alias = {
                    select: `${resource}.${param}`,
                    where : `${resource}.${param}`
                };
            }
            
            if (!('joins' in p)) {
                p.joins = {
                    select: [ `JOIN ${resource} ON treatmentImages.treatmentId = ${resource}.treatmentId` ],
                    where : [ `JOIN ${resource} ON treatmentImages.treatmentId = ${resource}.treatmentId` ]
                };
            }
    
            p.notDefaultCol = true;
        }
        
        treatmentImages.push(p);
    });
}

//console.log(JSON.stringify(treatmentImages, null, 2));
module.exports = treatmentImages;