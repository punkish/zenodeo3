'use strict';

// see https://github.com/plazi/Plazi-Communications/issues/1044#issuecomment-661246289 
// for notes from @gsautter

/*
 * All params are queryable unless notqueryable is true
 * Params with 'defaultCols' = true are SELECT-ed by default
 * Param 'type' is looked up in ../definitions.js to create the schema
 * Param 'sqltype' is used in CREATE-ing the db table
 * Param 'selname' is used when 'name' is inappropriate for SQL
 * SELECT
    typeOfArchive,
    datetime(timeOfArchive/1000, 'unixepoch') AS timeOfArchive, 
    datetime(Max(started)/1000, 'unixepoch') AS started, 
    datetime(ended/1000, 'unixepoch') AS ended, 
    (ended - started)/1000 AS duration,
    json_extract(result,'$.treatments') AS treatments,
    json_extract(result,'$.materialsCitations') AS materialsCitations,
    json_extract(result,'$.figureCitations') AS figureCitations,
    json_extract(result,'$.treatmentCitations') AS treatmentCitations,
    json_extract(result,'$.bibRefCitations') AS bibRefCitations
FROM
    etlstats
WHERE
    typeOfArchive = 'monthly';
 */

module.exports = [
    {
        name: 'id',
        schema: {
            type:"integer",
            description: 'unique identifier of the record',
        },
        isResourceId: true
    },

    {
        name: 'typeOfArchive',
        schema: { 
            type: 'array', 
            items: { 
                type: 'string',
                enum: [ 'full', 'monthly', 'weekly', 'daily' ]
            },
            minItems: 1,
            maxItems: 1,
            additionalItems: false,
            description: 'The type of archive'
        }
    }
]