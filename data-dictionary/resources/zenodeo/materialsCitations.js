'use strict'

const utils = require('../../../lib/utils.js');

module.exports = [
    {
        name: 'materialsCitationId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the materialsCitation. Has to be a 32 character string like: '38C63CC3D744DE1FE88B8A56FB7EDD14'`,
            // isResourceId: true
        },
        isResourceId: true,
        //selname: 'materialsCitations.materialsCitationId',
        sqltype: 'TEXT NOT NULL UNIQUE',
        cheerio: '$("materialsCitation").attr("id")'
    },

    {
        name: 'treatmentId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the parent treatment (FK). Has to be a 32 character string like: '00078788D744DE18E88B8B8BFE7FDBF9'`
        },
        sqltype: 'TEXT NOT NULL'
    },

    {
        name: 'collectingDate',
        schema: {
            type: 'string',
            format: 'date',
            description: 'The date when the specimen was collected',
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("collectingDate")'
    },
    {
        name: 'collectionCode',
        alias: {
            select: 'collectionCodes.collectionCode',
            where : null
        },
        schema: {
            type: 'string',
            description: 'The collection code for a natural history collection'
        },
        //selname: 'collectionCodes.collectionCode',
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("collectionCode")',
        joins: {
            select: [ 
                'JOIN materialsCitations_x_collectionCodes mc ON materialsCitations.materialsCitationId = mc.materialsCitationId',
                'JOIN collectionCodes ON mc.collectionCode = collectionCodes.collectionCode',
                'LEFT JOIN gbifcollections.institutions ON collectionCodes.collectionCode = institution_code'
            ],
            where : [ 
                'JOIN materialsCitations_x_collectionCodes mc ON materialsCitations.materialsCitationId = mc.materialsCitationId',
                'JOIN collectionCodes ON mc.collectionCode = collectionCodes.collectionCode',
                'LEFT JOIN gbifcollections.institutions ON collectionCodes.collectionCode = institution_code'
            ]
        },
    },
    {
        name: 'institution_name',
        schema: {
            type: 'string',
            description: 'The name of the institution that houses the collection',
        },
        sqltype: 'TEXT'
    },
    {
        name: 'collectorName',
        schema: {
            type: 'string',
            description: `The person who collected the specimen. Can use the following syntax:
- collectorName=Udzungwa Scarp FR & N. Scharff
- collectorName=starts_with(Udzungwa)
- collectorName=ends_with(Scharff)
- collectorName=contains(Scarp FR)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("collectorName")',
        defaultOp: 'starts_with'
    },
    {
        name: 'country',
        schema: {
            type: 'string',
            description: `The country where the specimen was collected. Can use the following syntax:
- country=Tanzania
- country=starts_with(Tan)
- country=ends_with(nia)
- country=contains(zan)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("country")',
        defaultOp: 'starts_with'
    },
    {
        name: 'collectingRegion',
        schema: {
            type: 'string',
            description: `The geographic region where the specimen was collected. Can use the following syntax:
- collectingRegion='Galapagos'
- collectingRegion=starts_with(Gal)
- collectingRegion=ends_with(gos)
- collectingRegion=contains(lap)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("collectingRegion")',
        defaultOp: 'starts_with'
    },
    {
        name: 'municipality',
        schema: {
            type: 'string',
            description: `A lower administrative region. Can use the following syntax:
- municipality='Zona Velasco Ibarra (near Scalesia quadrat)'
- municipality=starts_with(Zona Velasco)
- municipality=ends_with(calesia quadrat))
- municipality=contains(Ibarra)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("municipality")',
        defaultOp: 'starts_with'
    },
    {
        name: 'county',
        schema: {
            type: 'string',
            description: `The county where the specimen was collected. Can use the following syntax:
- county='Mahenge District'
- county=starts_with(Mahenge)
- county=ends_with(District)
- county=contains(henge)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("county")',
        defaultOp: 'eq'
    },
    {
        name: 'stateProvince',
        schema: {
            type: 'string',
            description: `The state or province where the specimen was collected. Can use the following syntax:
- stateProvince='Iringa Region'
- stateProvince=starts_with(Iringa)
- stateProvince=ends_with(Region)
- stateProvince=contains(ringa)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("stateProvince")',
        defaultOp: 'starts_with'
    },
    {
        name: 'location',
        schema: {
            type: 'string',
            description: `The location where the specimen was collected. Can use the following syntax:
- location='Udekwa Village'
- location=starts_with(Udekwa)
- location=ends_with(Village)
- location=contains(ekwa)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("location")',
        defaultOp: 'starts_with'
    },
    {
        name: 'locationDeviation',
        schema: {
            type: 'string',
            description: `The distance to the nearest location, e.g. 23km NW from…. Can use the following syntax:
- location='mountain top'
- location=starts_with(mountain)
- location=ends_with(top)
- location=contains(tain)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("locationDeviation")',
        defaultOp: 'starts_with'
    },
    {
        name: 'specimenCount-female',
        schema: {
            type: 'integer',
            description: 'The number of listed female specimens',
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("specimenCount-female")'
    },
    {
        name: 'specimenCount-male',
        schema: {
            type: 'integer',
            description: 'The number of listed male specimens',
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("specimenCount-male")'
    },
    {
        name: 'specimenCount',
        schema: {
            type: 'integer',
            description: 'The number of listed specimens',
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("specimenCount")'
    },
    {
        name: 'specimenCode',
        schema: {
            type: 'string',
            description: `The code of the specimen. Can use the following syntax:
- specimenCode='01 - SRNP- 4156'
- specimenCode=starts_with(01)
- specimenCode=ends_with(4156)
- specimenCode=contains(SRNP)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("specimenCode")',
        defaultOp: 'starts_with'
    },

    {
        name: 'typeStatus',
        schema: {
            type: 'string',
            description: 'The type status',
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("typeStatus")',
        defaultOp: 'starts_with'
    },
    {
        name: 'determinerName',
        schema: {
            type: 'string',
            description: `The person or agent who identified the specimen. Can use the following syntax:
- determinerName='A. d'Orchymont & J. L. Hellman'
- determinerName=starts_with(A. d'Orchymont)
- determinerName=ends_with(Hellman)
- determinerName=contains(Orchymont)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("determinerName")',
        defaultOp: 'starts_with'
    },
    {
        name: 'collectedFrom',
        schema: {
            type: 'string',
            description: `The substrate where the specimen has been collected, e.g. leaf, flower. Can use the following syntax:
- collectedFrom='5 year-old longleaf pine stand'
- collectedFrom=starts_with(5 year-old)
- collectedFrom=ends_with(pine stand)
- collectedFrom=contains(longleaf)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("collectedFrom")',
        defaultOp: 'starts_with'
    },
    {
        name: 'collectingMethod',
        schema: {
            type: 'string',
            description: `The method used for collecting the specimen. Can use the following syntax:
- collectingMethod='03 MaxiWinks, mixed samples'
- collectingMethod=starts_with(03 MaxiWinks)
- collectingMethod=ends_with(mixed samples)
- collectingMethod=contains(mixed)
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("collectingMethod")',
        defaultOp: 'starts_with'
    },

    {
        name: 'latitude',
        schema: {
            type: 'number',
            pattern: utils.re.real,
            description: `The geolocation of the treatment.`,
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("latitude")',
        notDefaultCol: true
    },

    {
        name: 'longitude',
        schema: {
            type: 'number',
            pattern: utils.re.real,
            description: 'The geolocation of the treatment.',
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("longitude")',
        notDefaultCol: true
    },

    {
        name: 'elevation',
        schema: {
            type: 'integer',
            description: `Elevation of the location where the specimen was collected. Can use the following syntax:
- elevation=58
- elevation=gt(58)
- elevation=gte(58)
- elevation=lt(58)
- elevation=lte(58)
- elevation=between(-1000 and 102)`,
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("elevation")'
    },

    {
        name: 'httpUri',
        schema: {
            type: 'string',
            format: 'uri',
            description: 'The persistent identifier of the specimen'
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation").attr("httpUri")',
        notQueryable: true
    },

    {
        name: 'deleted',
        schema: { 
            type: 'boolean',
            default: false,
            description: 'A boolean that tracks whether or not this resource is considered deleted/revoked, 1 if yes, 0 if no',
            isResourceId: false
        },
        sqltype: 'INTEGER DEFAULT 0',
        cheerio: '$("materialsCitation").attr("deleted")',
        notDefaultCol: true
    },

    {
        name: 'innerText',
        schema: {
            type: 'string',
            description: 'xml'
        },
        sqltype: 'TEXT',
        cheerio: '$("materialsCitation")',
        notQueryable: true
    },

    {
        name: 'validGeo',
        schema: {
            type: 'number',
            description: 'True if treatment has a valid geolocation.',
        },
        sqltype: 'INTEGER'
    },

    {
        name: 'isOnLand',
        schema: {
            type: 'number',
            description: 'True if treatment is on land.',
        },
        sqltype: 'INTEGER DEFAULT NULL'
    },

    {
        name: 'geolocation',
        schema: {
            type: 'string',
            pattern: utils.getPattern('geolocation'),
            description: `The geolocation of the treatment. Can use the following syntax:
- \`geolocation=within({radius:10, units: 'kilometers', lat:40.00, lng: -120})\`
- \`geolocation=containted_in({lowerLeft:{lat: -40.00, lng: -120},upperRight: {lat:23,lng:6.564}})\`
`,
        },
        zqltype: 'geolocation'
    }
]