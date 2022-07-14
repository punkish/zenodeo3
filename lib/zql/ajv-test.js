import Ajv from 'ajv';
const ajv = new Ajv({
    "removeAdditional": false,
    "useDefaults": true,
    "coerceTypes": "array",
    "allErrors": true
});

const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      treatmentId: { type: 'string', maxLength: 32, minLength: 32 },
      treatmentTitle: { type: 'string' },
      treatmentVersion: { type: 'string' },
      treatmentDOI: { type: 'string' },
      treatmentLSID: { type: 'string' },
      zenodoDep: { type: 'string' },
      zoobankId: { type: 'string' },
      articleId: { type: 'string', maxLength: 32, minLength: 32 },
      articleTitle: { type: 'string' },
      articleAuthor: { type: 'string' },
      articleDOI: { type: 'string' },
      publicationDate: {
        type: 'string',
        pattern: '(?<operator1>eq|since|until)?\\((?<date>[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|yesterday)\\)|(?<operator2>between)?\\((?<from>[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|yesterday) *and *(?<to>[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|yesterday)\\)'
      },
      journalTitle: { type: 'string' },
      journalYear: { type: 'string', pattern: '^[0-9]{4}$' },
      journalVolume: { type: 'string' },
      journalIssue: { type: 'string' },
      pages: { type: 'string' },
      authorityName: { type: 'string' },
      authorityYear: { type: 'string', pattern: '^[0-9]{4}$' },
      kingdom: { type: 'string' },
      phylum: { type: 'string' },
      order: { type: 'string' },
      family: { type: 'string' },
      genus: { type: 'string' },
      species: { type: 'string' },
      status: { type: 'string' },
      taxonomicNameLabel: { type: 'string' },
      rank: {
        type: 'string',
        enum: [
            "kingdom",
            "phylum",
            "order",
            "family",
            "genus",
            "species"
        ]
      },
      updateTime: {
        type: 'string',
        pattern: '(?<operator1>eq|since|until)?\\((?<date>[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|yesterday)\\)|(?<operator2>between)?\\((?<from>[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|yesterday) *and *(?<to>[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|yesterday)\\)'
      },
      checkinTime: {
        type: 'string',
        pattern: '(?<operator1>eq|since|until)?\\((?<date>[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|yesterday)\\)|(?<operator2>between)?\\((?<from>[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|yesterday) *and *(?<to>[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|yesterday)\\)'
      },
      fulltext: { type: 'string' },
      deleted: { type: 'boolean', default: false },
      q: { type: 'string' },
      httpUri: { type: 'string' },
      captionText: { type: 'string' },
      collectionCode: { type: 'string' },
      latitude: { type: 'number' },
      longitude: { type: 'number' },
      geolocation: {
        type: 'string',
        pattern: `(?<operator1>within)\\(radius: *(?<radius>[0-9]+),units: *['"](?<units>kilometers|miles)['"],lat: *(?<lat>([+-]?([0-9]+)(.[0-9]+)?)),lng: *(?<lng>([+-]?([0-9]+)(.[0-9]+)?))\\)|(?<operator2>contained_in)\\(lower_left:\\{ *lat: *(?<min_lat>([+-]?([0-9]+)(.[0-9]+)?)), *lng: *(?<min_lng>([+-]?([0-9]+)(.[0-9]+)?))\\},upper_right:\\{ *lat: *(?<max_lat>([+-]?([0-9]+)(.[0-9]+)?)), *lng: *(?<max_lng>([+-]?([0-9]+)(.[0-9]+)?))\\}\\)`
      },
      isOnLand: { type: 'number' },
      validGeo: { type: 'number' },
      refreshCache: { type: 'boolean', default: false },
      facets: { type: 'boolean', default: false },
      relatedRecords: { type: 'boolean', default: false },
      page: { type: 'integer', minimum: 1, default: 1 },
      size: { type: 'integer', minimum: 1, default: 30 },
      sortby: { type: 'string' },
      cols: {
        type: 'array',
        items: {
            "type": "string",
            "enum": [
                "treatmentId",
                "treatmentTitle",
                "treatmentVersion",
                "treatmentDOI",
                "treatmentLSID",
                "zenodoDep",
                "zoobankId",
                "articleId",
                "articleTitle",
                "articleAuthor",
                "articleDOI",
                "publicationDate",
                "journalTitle",
                "journalYear",
                "journalVolume",
                "journalIssue",
                "pages",
                "authorityName",
                "authorityYear",
                "kingdom",
                "phylum",
                "order",
                "family",
                "genus",
                "species",
                "status",
                "taxonomicNameLabel",
                "rank",
                "updateTime",
                "checkinTime",
                "fulltext",
                "deleted",
                "q",
                "httpUri",
                "captionText",
                "collectionCode",
                "latitude",
                "longitude",
                "geolocation",
                "isOnLand",
                "validGeo",
                "refreshCache",
                "facets",
                "relatedRecords",
                "page",
                "size",
                "sortby",
                "cols",
                ""
            ]
        },
        default: [
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
            "journalTitle",
            "journalYear",
            "journalVolume",
            "journalIssue",
            "pages",
            "authorityName",
            "authorityYear",
            "kingdom",
            "phylum",
            "order",
            "family",
            "genus",
            "species",
            "status",
            "taxonomicNameLabel",
            "rank",
            "updateTime",
            "checkinTime",
            "httpUri",
            "captionText",
            "collectionCode",
            "isOnLand",
            "validGeo"
        ]
      }
    }
};

const validator = ajv.compile(schema);
const params = {
    cols: [ 'isOnLand', 'treatmentId' ],
    geolocation: 'contained_in(lower_left:{lat:-12.168225677390119,lng:-27.773437500000004},upper_right:{lat:12.168225677390119,lng:27.773437500000004})' 
}
const valid = validator(params);

if (valid) {
    console.log(params)
}

// validation failed
else {
    console.error(validator.errors);
}

