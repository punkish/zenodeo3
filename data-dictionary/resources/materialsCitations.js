'use strict'

module.exports = [
    {
        name: 'materialsCitationId',
        type: 'resourceId',
        description: 'The unique ID of the materialsCitation',
        sqltype: 'TEXT NOT NULL UNIQUE',
        cheerio: '$("materialsCitation").attr("id")',
        defaultCols: true,
        defaultOp: 'eq',
    },

    // ???? //
    {
        name: 'treatmentId',
        type: 'fk',
        description: 'The unique ID of the parent treatment (FK)',
        sqltype: 'TEXT NOT NULL',
        cheerio: '$("document").attr("????")',
        defaultCols: true,
        defaultOp: 'eq',
    },

    {
        name: 'collectingDate',
        type: 'date',
        description: 'The date when the specimen was collected',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("collectingDate")',
        defaultCols: true,
        defaultOp: 'eq'
    },
    {
        name: 'collectionCode',
        type: 'string',
        description: 'The collection code for a natural history collection',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("collectionCode")',
        defaultCols: true,
        defaultOp: 'eq'
    },
    {
        name: 'collectorName',
        type: 'string',
        description: 'The person who collected the specimen',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("collectorName")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },
    {
        name: 'country',
        type: 'string',
        description: 'The country where the specimen was collected',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("country")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },
    {
        name: 'collectingRegion',
        type: 'string',
        description: 'The geographic region where the specimen was collected',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("collectingRegion")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },
    {
        name: 'municipality',
        type: 'string',
        description: 'A lower administrative region',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("municipality")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },
    {
        name: 'county',
        type: 'string',
        description: 'The county where the specimen was collected',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("county")',
        defaultCols: true,
        defaultOp: 'eq'
    },
    {
        name: 'stateProvince',
        type: 'string',
        description: 'The state or province where the specimen was collected',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("stateProvince")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },
    {
        name: 'location',
        type: 'string',
        description: 'The location where the specimen was collected',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("location")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },
    {
        name: 'locationDeviation',
        type: 'string',
        description: 'The distance to the nearest location, e.g. 23km NW from…',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("locationDeviation")',
        defaultCols: true,
        defaultOp: ''
    },
    {
        name: 'specimenCountFemale',
        type: 'string',
        description: 'The number of listed female specimens',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("specimenCount-female")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },
    {
        name: 'specimenCountMale',
        type: 'string',
        description: 'The number of listed male specimens',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("specimenCount-male")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },
    {
        name: 'specimenCount',
        type: 'string',
        description: 'The number of listed specimens',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("specimenCount")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },
    {
        name: 'specimenCode',
        type: 'string',
        description: 'The code of the specimen',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("specimenCode")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },
    {
        name: 'typeStatus',
        type: 'string',
        description: 'The nomenclatural status of the specimen, e.g. holotype, paratype',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("typeStatus")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },
    {
        name: 'determinerName',
        type: 'string',
        description: 'The person or agent who identified the specimen',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("determinerName")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },
    {
        name: 'collectedFrom',
        type: 'string',
        description: 'The substrate where the specimen has been collected, e.g. leaf, flower',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("collectedFrom")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },
    {
        name: 'collectingMethod',
        type: 'string',
        description: 'The method used for collecting the specimen',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("collectingMethod")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'geolocation',
        type: 'geolocation',
        description: 'The geo-location of the materialsCitation'
    },
    /*
    {
        name: 'latitude',
        type: 'string',
        description: `Geographic coordinates of the location where the specimen was collected.
Since it is unreasonable to expect the user to provide exact lat/lon coordinates, a delta of 0.9
is used to find all the points contained in the resulting box. For example, if latitude 77 and 
longitude 78 are provided, the two points A and B are located inside the bounding box made from 
submitted coordinates +- a delta of 0.9

lat: 77.9                                       lat: 77.9 
lon: 77.1                                       lon: 78.9
┌───────────────────────────────────────────────┐
│                                               │
│                                               │
│                        lat: 77.53333          │
│                        lon: 78.88333          │
│                             B                 │
│                                               │
│                                               │
│             lat: 77.2                         │
│             lon: 78.11667                     │
│                 A                             │
│                                               │
│                                               │
└───────────────────────────────────────────────┘
lat: 76.1                                      lat: 76.1
lon: 77.1                                      lon: 78.9`,
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("latitude")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },
    {
        name: 'longitude',
        type: 'string',
        description: `Geographic coordinates of the location where the specimen was collected.
Since it is unreasonable to expect the user to provide exact lat/lon coordinates, a delta of 0.9
is used to find all the points contained in the resulting box. For example, if latitude 77 and 
longitude 78 are provided, the two points A and B are located inside the bounding box made from 
submitted coordinates +- a delta of 0.9

lat: 77.9                                       lat: 77.9 
lon: 77.1                                       lon: 78.9
┌───────────────────────────────────────────────┐
│                                               │
│                                               │
│                        lat: 77.53333          │
│                        lon: 78.88333          │
│                             B                 │
│                                               │
│                                               │
│             lat: 77.2                         │
│             lon: 78.11667                     │
│                 A                             │
│                                               │
│                                               │
└───────────────────────────────────────────────┘
lat: 76.1                                      lat: 76.1
lon: 77.1                                      lon: 78.9`,
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("longitude")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },
    */
    {
        name: 'elevation',
        type: 'string',
        description: 'Elevation of the location where the specimen was collected',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("elevation")',
        defaultCols: true,
        defaultOp: 'starts_with'
    },
    {
        name: 'httpUri',
        type: 'string',
        description: 'The persistent identifier of the specimen',
        sqlType: 'TEXT',
        cheerio: '$("materialsCitation").attr("httpUri")',
        defaultCols: true,
        defaultOp: 'starts_with'
    }
]