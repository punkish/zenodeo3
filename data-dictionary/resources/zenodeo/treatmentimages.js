import * as utils from '../../../lib/utils.js';
import { dictTreatments } from './treatments.js';
import { dictMaterialCitations } from './materialcitations.js';

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
            select: "snippet(tr.ftsTreatments, 1, '<b>', '</b>', '…', 25) snippet",
            where : 'tr.ftsTreatments'
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
            where : [ 'JOIN tr.ftsTreatments ON ti.treatmentImages.treatmentId = tr.ftsTreatments.treatmentId' ]
        }
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
            select: 'tr.treatments.treatmentTitle',
            where : 'tr.treatments.treatmentTitle'
        },
        joins: {
            select: [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ],
            where : [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ]
        }
    },
    {
        name: 'treatmentDOI',
        dict: dictTreatments,
        alias: {
            select: 'tr.treatments.treatmentDOI',
            where : 'tr.treatments.treatmentDOI'
        },
        joins: {
            select: [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ],
            where : [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ]
        }
    },
    {
        name: 'zenodoDep',
        dict: dictTreatments,
        alias: {
            select: 'tr.treatments.zenodoDep',
            where : 'tr.treatments.zenodoDep'
        },
        joins: {
            select: [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ],
            where : [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ]
        }
    },
    {
        name: 'journalTitle',
        dict: dictTreatments,
        alias: {
            select: 'tr.treatments.journalTitle',
            where : 'tr.treatments.journalTitle'
        },
        joins: {
            select: [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ],
            where : [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ]
        }
    },
    {
        name: 'phylum',
        dict: dictTreatments,
        alias: {
            select: 'tr.treatments.phylum',
            where : 'tr.treatments.phylum'
        },
        schema: {
            type: 'string',
            description: 'The higher category of the taxonomicName',
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("phylum")',
        joins: {
            select: [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ],
            where : [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ]
        }
    },
    {
        name: 'class',
        dict: dictTreatments,
        alias: {
            select: 'tr.treatments.class',
            where : 'tr.treatments.class'
        },
        schema: {
            type: 'string',
            description: 'The higher category of the taxonomicName',
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("class")',
        joins: {
            select: [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ],
            where : [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ]
        }
    },
    {
        name: 'family',
        dict: dictTreatments,
        alias: {
            select: 'tr.treatments.family',
            where : 'tr.treatments.family'
        },
        schema: {
            type: 'string',
            description: 'The higher category of the taxonomicName',
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("family")',
        joins: {
            select: [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ],
            where : [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ]
        }
    },
    {
        name: 'order',
        dict: dictTreatments,
        alias: {
            select: 'tr.treatments."order"',
            where : 'tr.treatments."order"'
        },
        schema: {
            type: 'string',
            description: 'The higher category of the taxonomicName',
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("family")',
        joins: {
            select: [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ],
            where : [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ]
        }
    },
    {
        name: 'publicationDate',
        dict: dictTreatments,
        alias: {
            select: 'tr.treatments.publicationDate',
            where : 'tr.treatments.publicationDate'
        },
        joins: {
            select: [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ],
            where : [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ]
        }
    },
    {
        name: 'checkinTime',
        dict: dictTreatments,
        alias: {
            select: 'tr.treatments.checkinTime',
            where : 'tr.treatments.checkinTime'
        },
        joins: {
            select: [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ],
            where : [ 'JOIN tr.treatments ON ti.treatmentImages.treatmentId = tr.treatments.treatmentId' ]
        }
    },
    {
        name: 'latitude',
        dict: dictMaterialCitations,
        alias: {
            select: 'mc.materialsCitations.latitude',
            where : 'mc.materialsCitations.latitude'
        },
        joins: {
            select: [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ],
            where : [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ]
        }
    },
    {
        name: 'longitude',
        dict: dictMaterialCitations,
        alias: {
            select: 'mc.materialsCitations.longitude',
            where : 'mc.materialsCitations.longitude'
        },
        joins: {
            select: [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ],
            where : [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ]
        }
    },
    {
        name: 'geolocation',
        dict: dictMaterialCitations,
        joins: {
            select: [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ],
            where : [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ]
        }
    },
    {
        name: 'isOnLand',
        dict: dictMaterialCitations,
        alias: {
            select: 'mc.materialsCitations.isOnLand',
            where : 'mc.materialsCitations.isOnLand'
        },
        joins: {
            select: [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ],
            where : [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ]
        }
    },
    {
        name: 'validGeo',
        dict: dictMaterialCitations,
        alias: {
            select: 'mc.materialsCitations.validGeo',
            where : 'mc.materialsCitations.validGeo'
        },
        joins: {
            select: [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ],
            where : [ 'JOIN mc.materialsCitations ON tr.treatments.treatmentId = mc.materialsCitations.treatmentId' ]
        }
    }
];

externalParams.forEach(param => utils.addExternalDef(param, dictionary));

export { dictionary as dictTreatmentImages }