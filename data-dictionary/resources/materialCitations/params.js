import * as utils from '../../../lib/utils.js';

import { collectionCodes } from '../collectionCodes/index.js';
import { materialCitationsFts } from '../materialCitationsFts/index.js';
import { ecoregions } from '../ecoregions/index.js';

/** 
 * first we define all the params corresponding to the columns in the 
 * materialsCitation table
 */
const params = [
    {
        name: 'id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        }
    },
    {
        name: 'materialCitationId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `Has to be a 32 character string like: 
- \`materialCitationId=38C63CC3D744DE1FE88B8A56FB7EDD14\``,
        },
        isResourceId: true,
        sql: {
            desc: 'The unique resourceId of the materialCitation',
            type: 'TEXT NOT NULL UNIQUE'
        },
        cheerio: '$("materialsCitation").attr("id")'
    },
    {
        name: 'treatments_id',
        schema: { 
            type: 'integer', 
            description: ``
        },
        sql: {
            desc: 'The ID of the parent treatment (FK)',
            type: 'INTEGER NOT NULL REFERENCES treatments(id)'
        },
    },
    {
        name: 'collectingDate',
        schema: {
            type: 'string',
            pattern: utils.re.date,
            description: '',
        },
        sql: {
            desc: 'The date when the specimen was collected',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("materialsCitation").attr("collectingDate")'
    },
    {
        name: 'collectionCodeCSV',
        sql: {
            desc: 'The collection codes as a CSV string as they appear in text',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("materialsCitation").attr("collectionCode")',
        queryable: false,
        indexed: false
    },
    {
        name: 'collectorName',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- collectorName=Udzungwa Scarp FR & N. Scharff
- collectorName=starts_with(Udzungwa)
- collectorName=ends_with(Scharff)
- collectorName=contains(Scarp FR)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sql: {
            desc: 'The person who collected the specimen',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("materialsCitation").attr("collectorName")',
        defaultOp: 'starts_with'
    },
    {
        name: 'country',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- country=Tanzania
- country=starts_with(Tan)
- country=ends_with(nia)
- country=contains(zan)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sql: {
            desc: 'The country where the specimen was collected',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("materialsCitation").attr("country")',
        defaultOp: 'starts_with'
    },
    {
        name: 'collectingRegion',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- collectingRegion='Galapagos'
- collectingRegion=starts_with(Gal)
- collectingRegion=ends_with(gos)
- collectingRegion=contains(lap)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sql: {
            desc: 'The geographic region where the specimen was collected',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("materialsCitation").attr("collectingRegion")',
        defaultOp: 'starts_with'
    },
    {
        name: 'municipality',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- municipality='Zona Velasco Ibarra (near Scalesia quadrat)'
- municipality=starts_with(Zona Velasco)
- municipality=ends_with(calesia quadrat))
- municipality=contains(Ibarra)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sql: {
            desc: 'A lower administrative region',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("materialsCitation").attr("municipality")',
        defaultOp: 'starts_with'
    },
    {
        name: 'county',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- county='Mahenge District'
- county=starts_with(Mahenge)
- county=ends_with(District)
- county=contains(henge)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sql: {
            desc: 'The county where the specimen was collected',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("materialsCitation").attr("county")',
        defaultOp: 'eq'
    },
    {
        name: 'stateProvince',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- stateProvince='Iringa Region'
- stateProvince=starts_with(Iringa)
- stateProvince=ends_with(Region)
- stateProvince=contains(ringa)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sql: {
            desc: 'The state or province where the specimen was collected',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("materialsCitation").attr("stateProvince")',
        defaultOp: 'starts_with'
    },
    {
        name: 'location',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- location='Udekwa Village'
- location=starts_with(Udekwa)
- location=ends_with(Village)
- location=contains(ekwa)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sql: {
            desc: 'The location where the specimen was collected',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("materialsCitation").attr("location")',
        defaultOp: 'starts_with'
    },
    {
        name: 'locationDeviation',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- location='mountain top'
- location=starts_with(mountain)
- location=ends_with(top)
- location=contains(tain)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sql: {
            desc: 'The distance to the nearest location, e.g. 23km NW from…',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("materialsCitation").attr("locationDeviation")',
        defaultOp: 'starts_with'
    },
    {
        name: 'specimenCountFemale',
        schema: {
            type: 'integer',
            description: '',
        },
        sql: {
            desc: 'The number of listed female specimens',
            type: 'INTEGER'
        },
        cheerio: '$("materialsCitation").attr("specimenCount-female")',
        indexed: false
    },
    {
        name: 'specimenCountMale',
        schema: {
            type: 'integer',
            description: '',
        },
        sql: {
            desc: 'The number of listed male specimens',
            type: 'INTEGER'
        },
        cheerio: '$("materialsCitation").attr("specimenCount-male")',
        indexed: false
    },
    {
        name: 'specimenCount',
        schema: {
            type: 'integer',
            description: '',
        },
        sql: {
            desc: 'The number of listed specimens',
            type: 'INTEGER'
        },
        cheerio: '$("materialsCitation").attr("specimenCount")',
        indexed: false
    },
    {
        name: 'specimenCode',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- specimenCode='01-SRNP-4156'
- specimenCode=starts_with(01)
- specimenCode=ends_with(4156)
- specimenCode=contains(SRNP)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sql: {
            desc: 'The code of the specimen',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("materialsCitation").attr("specimenCode")',
        defaultOp: 'starts_with'
    },
    {
        name: 'typeStatus',
        schema: {
            type: 'string',
            description: '',
        },
        sql: {
            desc: 'The type status',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("materialsCitation").attr("typeStatus")',
        defaultOp: 'starts_with',
        indexed: false
    },
    {
        name: 'determinerName',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- determinerName='A. d'Orchymont & J. L. Hellman'
- determinerName=starts_with(A. d'Orchymont)
- determinerName=ends_with(Hellman)
- determinerName=contains(Orchymont)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sql: {
            desc: 'The person or agent who identified the specimen',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("materialsCitation").attr("determinerName")',
        defaultOp: 'starts_with'
    },
    {
        name: 'collectedFrom',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- collectedFrom='5 year-old longleaf pine stand'
- collectedFrom=starts_with(5 year-old)
- collectedFrom=ends_with(pine stand)
- collectedFrom=contains(longleaf)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sql: {
            desc: 'The substrate where the specimen has been collected, e.g. leaf, flower',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("materialsCitation").attr("collectedFrom")',
        defaultOp: 'starts_with'
    },
    {
        name: 'collectingMethod',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- collectingMethod='03 MaxiWinks, mixed samples'
- collectingMethod=starts_with(03 MaxiWinks)
- collectingMethod=ends_with(mixed samples)
- collectingMethod=contains(mixed)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sql: {
            desc: 'The method used for collecting the specimen',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("materialsCitation").attr("collectingMethod")',
        defaultOp: 'starts_with'
    },
    {
        name: 'latitude',
        schema: {
            type: "number",
            minimum: -90,
            maximum: 90,
            description: ``,
        },
        sql: {
            desc: 'The geolocation of the treatment',
            type: 'REAL'
        },
        cheerio: '$("materialsCitation").attr("latitude")',
        defaultCol: false
    },
    {
        name: 'longitude',
        schema: {
            type: "number",
            minimum: -180,
            maximum: 180,
            description: '',
        },
        sql: {
            desc: 'The geolocation of the treatment',
            type: 'REAL'
        },
        cheerio: '$("materialsCitation").attr("longitude")',
        defaultCol: false
    },
    {
        name: 'elevation',
        schema: {
            type: 'integer',
            description: `Can use the following syntax:
- elevation=58
- elevation=gt(58)
- elevation=gte(58)
- elevation=lt(58)
- elevation=lte(58)
- elevation=between(-1000 and 102)`,
        },
        sql: {
            desc: 'Elevation of the location where the specimen was collected',
            type: 'REAL'
        },
        cheerio: '$("materialsCitation").attr("elevation")'
    },
    {
        name: 'httpUri',
        schema: {
            type: 'string',
            description: ''
        },
        sql: {
            desc: 'The persistent identifier of the specimen',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("materialsCitation").attr("httpUri")',
        notQueryable: true
    },
    {
        name: 'deleted',
        schema: { 
            type: 'boolean',
            description: '',
        },
        sql: {
            desc: 'A boolean that tracks whether or not this resource is considered deleted/revoked, 1 if yes, 0 if no',
            type: 'INTEGER DEFAULT 0'
        },
        cheerio: '$("materialsCitation").attr("deleted")',
        defaultCol: false
    },
    {
        name: 'fulltext',
        schema: {
            type: 'string',
            description: ''
        },
        sql: {
            desc: 'The full text of the material citation',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("materialsCitation").text().replace(/(?:\\r\\n|\\r|\\n)/g, " ").replace(/  /g, " ").replace(/  /g, " ")',
        queryable: false,
        indexed: false
    },
    {
        name: 'validGeo',
        schema: {
            type: 'boolean',
            description: '',
        },
        sql: {
            desc: '1 (true) if treatment has a valid geolocation',
            type: `BOOLEAN GENERATED ALWAYS AS (
                typeof(latitude) = 'real' AND 
                abs(latitude) < 90 AND 
                typeof(longitude) = 'real' AND 
                abs(longitude) <= 180
            ) STORED`
        }
    },
    {
        name: 'isOnLand',
        schema: {
            type: 'boolean',
            description: '',
        },
        sql: {
            desc: '1 (true) if treatment is on land',
            type: 'INTEGER DEFAULT NULL'
        }
    },
    {
        name: 'ecoregions_id',
        schema: {
            type: 'integer',
            description: '',
        },
        sql: {
            desc: 'The ID of the enclosing ecoregion (FK)',
            type: 'INTEGER'
        }
    },
    {
        name: 'biomes_id',
        schema: {
            type: 'integer',
            description: '',
        },
        sql: {
            desc: 'The ID of the enclosing biome (FK)',
            type: 'INTEGER'
        }
    },
    {
        name: 'geolocation',
        schema: {
            type: 'string',
            pattern: utils.getPattern('geolocation'),
            description: `The geolocation of the treatment. Can use the following syntax:
- \`geolocation=within(radius:10, units: 'kilometers', lat:40.00, lng: -120)\`
- \`geolocation=contained_in(lower_left:{lat: -40.00, lng: -120},upper_right: {lat:23,lng:6.564})\`
`,
        },
        joins: [
            'JOIN materialCitationsRtree ON materialCitations.id = materialCitationsRtree.materialCitations_id'
        ],
        zqltype: 'geolocation',
        defaultCol: false,
        indexed: false
    }
];

/** 
 * then we add params that are in other tables but can be queried 
 * via this REST endpoint
 */
 const externalParams = [
    {
        name: 'collectionCode',
        dict: collectionCodes,
        joins: [
            `JOIN materialCitations_collectionCodes 
                ON materialCitations.id = materialCitations_collectionCodes.materialCitations_id`,
            `JOIN collectionCodes 
                ON materialCitations_collectionCodes.collectionCodes_id = collectionCodes.id`
        ]
    },
    {
        name: 'q',
        dict: materialCitationsFts
    },
    {
        name: 'eco_name',
        dict: ecoregions,
        joins: [
            `JOIN geodata.ecoregions  
                ON materialCitations.ecoregions_id = geodata.ecoregions.id`
        ]
    },
    {
        name: 'biome_name',
        dict: ecoregions,
        joins: [
            `JOIN geodata.ecoregions  
                ON materialCitations.ecoregions_id = geodata.ecoregions.id`
        ]
    }
    // {
    //     name: 'institution_name',
    //     dict: collectionCodes,
    //     joins: [
    //         'JOIN materialCitations_x_collectionCodes ON materialCitations.materialCitationId = materialCitations_x_collectionCodes.materialCitationId',

    //         'JOIN collectionCodes ON materialCitations_x_collectionCodes.collectionCode = collectionCodes.collectionCode',

    //         'LEFT JOIN gb.institutions ON collectionCodes.collectionCode = gb.institutions.institution_code'
    //     ]
    // }
];

externalParams.forEach(externalParam => utils.addExternalDef(
    externalParam, 
    'materialCitations', 
    'materialCitationId', 
    params
));

export { params }