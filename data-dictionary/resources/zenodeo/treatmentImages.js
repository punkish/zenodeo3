import * as utils from '../../../lib/utils.js';
import { dictionary as dictTreatments } from './treatments.js';
import { dictionary as dictMaterialCitations } from './materialCitations.js';

/** 
 * first we define all the params corresponding to the columns in the 
 * treatments table
 */
const dictionary = [
    {
        name: 'id',
        schema: {
            type:"integer",
            description: 'unique identifier of the record',
        },
        isResourceId: true,
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
            description: `The full text of the figure cited by this treatment. Can use the following syntax: 
- \`captionText=spiders\``
        },
        sqltype: 'TEXT',
    },

    {
        name: 'treatmentId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the parent treatment (FK). Has to be a 32 character string like: '000087F6E320FF95FF7EFDC1FAE4FA7B'`
        },
        sqltype: 'TEXT',
    },

    {
        name: 'q',
        alias: {
            select: "snippet(vtreatments, 1, '<b>', '</b>', '…', 25) snippet",
            where : 'vtreatments'
        },
        schema: {
            type: 'string',
            description: `A snippet extracted from the full text of the treatment. Can use the following syntax: 
- \`q=spiders\``
        },
        sqltype: 'TEXT',
        notDefaultCol: true,
        defaultOp: 'match',
        joins: {
            select: null,
            where : [ 'JOIN vtreatments ON treatmentImages.treatmentId = vtreatments.treatmentId' ]
        },
        notDefaultCol: true
    }
];

/** 
 * then we add params that are in other tables but can be queried 
 * via this REST endpoint
 */
 const externalParams = [
    {
        name: 'treatmentTitle',
        dict: dictTreatments,
        alias: {
            select: 'treatments.treatmentTitle',
            where : 'treatments.treatmentTitle'
        },
        joins: {
            select: [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ],
            where : [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ]
        }
    },
    {
        name: 'treatmentDOI',
        dict: dictTreatments,
        alias: {
            select: 'treatments.treatmentDOI',
            where : 'treatments.treatmentDOI'
        },
        joins: {
            select: [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ],
            where : [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ]
        }
    },
    {
        name: 'zenodoDep',
        dict: dictTreatments,
        alias: {
            select: 'treatments.zenodoDep',
            where : 'treatments.zenodoDep'
        },
        joins: {
            select: [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ],
            where : [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ]
        }
    },
    {
        name: 'publicationDate',
        dict: dictTreatments,
        alias: {
            select: 'treatments.publicationDate',
            where : 'treatments.publicationDate'
        },
        joins: {
            select: [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ],
            where : [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ]
        }
    },
    {
        name: 'checkinTime',
        dict: dictTreatments,
        alias: {
            select: 'treatments.checkinTime',
            where : 'treatments.checkinTime'
        },
        joins: {
            select: [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ],
            where : [ 'JOIN treatments ON treatmentImages.treatmentId = treatments.treatmentId' ]
        }
    },
    {
        name: 'latitude',
        dict: dictMaterialCitations,
        alias: {
            select: 'materialsCitations.latitude',
            where : 'materialsCitations.latitude'
        },
        joins: {
            select: [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ],
            where : [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ]
        }
    },
    {
        name: 'longitude',
        dict: dictMaterialCitations,
        alias: {
            select: 'materialsCitations.longitude',
            where : 'materialsCitations.longitude'
        },
        joins: {
            select: [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ],
            where : [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ]
        }
    },
    {
        name: 'geolocation',
        dict: dictMaterialCitations,
        joins: {
            select: [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ],
            where : [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ]
        }
    },
    {
        name: 'isOnLand',
        dict: dictMaterialCitations,
        alias: {
            select: 'materialsCitations.isOnLand',
            where : 'materialsCitations.isOnLand'
        },
        joins: {
            select: [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ],
            where : [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ]
        }
    },
    {
        name: 'validGeo',
        dict: dictMaterialCitations,
        alias: {
            select: 'materialsCitations.validGeo',
            where : 'materialsCitations.validGeo'
        },
        joins: {
            select: [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ],
            where : [ 'JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId' ]
        }
    }
];

externalParams.forEach(param => utils.addExternalDef(param, dictionary));

export { dictionary }