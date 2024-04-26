// import { ddu } from './index.js';
// import tap from 'tap';

// const propertyTests = [
//     {
//         i: { tableName: 'bibRefCitations', property: 'name' },
//         o: 'bibRefCitations'
//     },
//     {
//         i: { tableName: 'collectionCodes', property: 'name' },
//         o: 'collectionCodes'
//     },
//     {
//         i: { tableName: 'figureCitations', property: 'name' },
//         o: 'figureCitations'
//     },
//     {
//         i: { tableName: 'materialCitations', property: 'name' },
//         o: 'materialCitations'
//     },
//     {
//         i: { 
//             tableName: 'materialCitations_x_collectionCodes', 
//             property: 'name' 
//         },
//         o: 'materialCitations_x_collectionCodes'
//     },
//     {
//         i: { tableName: 'treatmentAuthors', property: 'name' },
//         o: 'treatmentAuthors'
//     },
//     {
//         i: { tableName: 'treatmentCitations', property: 'name' },
//         o: 'treatmentCitations'
//     },
//     {
//         i: { tableName: 'treatments', property: 'name' },
//         o: 'treatments'
//     },
//     {
//         i: { tableName: 'treatmentsFts', property: 'name' },
//         o: 'treatmentsFts'
//     }
// ]

// tap.test('get tableName and specified property', tap => {
//     propertyTests.forEach(t => {
//         const tableName = t.i.tableName;
//         const property = t.i.property;
//         const output = t.o;

//         tap.equal(
//             ddu.getTable(tableName, property), 
//             output, 
//             `getTable('${tableName}', '${property}') is '${output}'`
//         );
//     });

//     tap.end();
// });

// const createTableTests = [
//     {
//         i: { tableName: 'bibRefCitations' },
//         o: `CREATE TABLE IF NOT EXISTS bibRefCitations (

//     -- PK
//     "id" INTEGER PRIMARY KEY,

//     -- The unique ID of the bibRefCitation
//     "bibRefCitationId" TEXT NOT NULL UNIQUE CHECK(Length("bibRefCitationId") = 32),

//     -- The unique ID of the parent treatment (FK)
//     "treatmentId" TEXT NOT NULL UNIQUE CHECK(Length("treatmentId") = 32),

//     -- The author
//     "author" TEXT,

//     -- The journal or publisher
//     "journalOrPublisher" TEXT,

//     -- The title of the citation
//     "title" TEXT,

//     -- The full text of the reference cited by the treatment
//     "refString" TEXT,

//     -- The type of reference cited by the treatment
//     "type" TEXT,

//     -- The year of the reference cited by this treatment
//     "year" TEXT,

//     -- The full text of the bibRefCitation
//     "fulltext" TEXT
// )`
//     },

//     {
//         i: { tableName: 'bibRefCitationsFts' },
//         o: `CREATE VIRTUAL TABLE IF NOT EXISTS bibRefCitationsFts USING fts5 (
//     fulltext,
//     content=''
// )`
//     },

//     {
//         i: { tableName: 'collectionCodes' },
//         o: `CREATE TABLE IF NOT EXISTS collectionCodes (

//     -- The collection code for a natural history collection
//     "collectionCode" TEXT UNIQUE NOT NULL PRIMARY KEY
// ) WITHOUT rowid`
//     },

//     {
//         i: { tableName: 'etlProcesses' },
//         o: `CREATE VIEW IF NOT EXISTS etlProcesses AS
//     SELECT

//         -- the time the process started
//         datetime("started" / 1000, 'unixepoch') AS start,

//         -- the time the process ended
//         datetime("ended" / 1000, 'unixepoch') AS end,

//         -- the duration of the process
//         ("ended" - "started") AS duration,

//         -- the name of the process
//         "process"
//     FROM
//         etlstats`
//     },

//     {
//         i: { tableName: 'etlStats' },
//         o: `CREATE TABLE IF NOT EXISTS etlStats (

//     -- PK
//     "id" INTEGER PRIMARY KEY,

//     -- Time ETL process started in UTC ms since epoch
//     "started" INTEGER,

//     -- Time ETL process ended in UTC ms since epoch
//     "ended" INTEGER,

//     -- The type of archive
//     "typeOfArchive" TEXT,

//     -- Time when the archive was created in UTC ms since epoch
//     "timeOfArchive" INTEGER,

//     -- Size of the archive in kilobytes
//     "sizeOfArchive" INTEGER,

//     -- Number of files in the archive
//     "numOfFiles" INTEGER,

//     -- Number of treatments in the archive
//     "treatments" INTEGER,

//     -- Number of treatmentCitations in the archive
//     "treatmentCitations" INTEGER,

//     -- Number of materialsCitations in the archive
//     "materialsCitations" INTEGER,

//     -- Number of figureCitations in the archive
//     "figureCitations" INTEGER,

//     -- Number of bibRefCitations in the archive
//     "bibRefCitations" INTEGER
// )`
//     },

//     {
//         i: { tableName: 'figureCitations' },
//         o: `CREATE TABLE IF NOT EXISTS figureCitations (

//     -- PK
//     "id" INTEGER PRIMARY KEY,

//     -- The unique resourceId of the figureCitation
//     "figureCitationId" TEXT NOT NULL UNIQUE CHECK(Length("figureCitationId") = 32),

//     -- The unique ID of the parent treatment (FK)
//     "treatmentId" TEXT NOT NULL UNIQUE CHECK(Length("treatmentId") = 32),

//     -- serial number of figure for a figureCitationId and treatmentId
//     -- combination
//     "figureNum" INTEGER DEFAULT 0,

//     -- The full text of the figure cited by this treatment
//     "captionText" TEXT,

//     -- The URI of the image
//     "httpUri" TEXT
// )`
//     },

//     {
//         i: { table: 'figureCitationsFts' },
//         o: `CREATE VIRTUAL TABLE IF NOT EXISTS figureCitationsFts USING fts5 (
//     captionText,
//     content=''
// )`
//     },

//     {
//         i: { table: 'journals' },
//         o: `CREATE TABLE IF NOT EXISTS journals (

//     -- PK
//     "journalId" INTEGER PRIMARY KEY,

//     -- The journal in which the treatment was published
//     "journalTitle" TEXT UNIQUE NOT NULL
// )`
//     },

//     {
//         i: { table: 'journals_x_year' },
//         o: `CREATE TABLE IF NOT EXISTS journals_x_year (

//     -- PK
//     "id" INTEGER PRIMARY KEY,

//     -- FK to journals(journalId)
//     "journalId" INTEGER NOT NULL REFERENCES journals(journalId),

//     -- Year the journal was published
//     "journalYear" INTEGER NOT NULL,

//     -- Number of times the journal was processed in a given year
//     "num" INTEGER NOT NULL
// )`
//     }
// ];

// tap.test('create table statement', tap => {
//     createTableTests.forEach(t => {
//         const tableName = t.i.tableName;
//         const output = t.o;

//         tap.equal(
//             ddu.createTable(tableName), 
//             output, 
//             `createTable('${tableName}') is '${output}'`
//         );
//     });

//     tap.end();
// });

import { Config } from '@punkish/zconfig';
const config = new Config().settings;

// see https://ajv.js.org/packages/ajv-errors.html
import Ajv from 'ajv';
const ajv = new Ajv(config.ajv.opts);

import { ddutils } from './index.js';


/**
 * Check if the submitted params conform to the schema.
 * @param {string} resource - name of the resource.
 * @param {object} params - query parameters
 */
const validate = function({ resource, params }) {
    const schema = {
        type: 'object',
        additionalProperties: false,
        properties: ddutils.getQueryStringSchema(resource)
    };

    try {
        const validator = ajv.compile(schema);
        const valid = validator(params);

        if (valid) {
            // if (params.cols && params.cols.length === 1 && params.cols[0] === '') {
            //     delete params.cols;
            // }
    
            // return params;
            console.log(`😀 ${resource} schema is valid ✅`);
        }
        else {
            //
            // validation failed
            //
            console.error(`😩 ${resource}: validation failed ❌`);
            console.error(validator.errors);
     
        }
    }
    catch (error) {
        console.error(error);
    }
}

function validateSchemas(resources) {
    resources.forEach(resource => validate({ resource, params }));
}

function getResourceIds(resources) {
    resources.forEach(resource => {
        const resourceId = ddutils.getResourceId(resource);

        if (resourceId) {
            console.log(`😀 ${resource}: ${resourceId.name} ✅`);
        }
        else {
            console.log(`😩 ${resource}: resourceId does not exist ❌`);
        }
    });
}

const resources = ddutils.getResources();
//validateSchemas(resources);
getResourceIds(resources);