'use strict'

module.exports = [

    // parameters that affect the query but are  
    // not a part of it
    {
        name: 'refreshCache',
        schema: {
            type: 'boolean',
            description: 'Force refresh cache (true | false)',
            default: false
        }
    },
    {
        name: 'facets',
        schema: {
            type: 'boolean',
            description: 'Calculate facets (true | false)',
            default: false
        }
    },
    {
        name: 'relatedRecords',
        schema: {
            type: 'boolean',
            description: 'Calculate related records (true | false)',
            default: false
        }
    },
    // {
    //     name: 'stats',
    //     schema: {
    //         type: 'boolean',
    //         description: 'Calculate statistics (true | false)',
    //         default: false
    //     }
    // },

    //****************************************//
    // parameters that are a part of the query 
    //****************************************//

    // parameters that are not columns

    // maps --> OFFSET
    // OFFSET = page - 1
    {
        name: 'page',
        schema: {
            type: 'integer',
            minimum: 1,
            description: 'Starting page. Has to be an integer greater than 0. Defaults to 1',
            default: 1
        }
    },

    // maps --> LIMIT
    {
        name: 'size',
        schema: {
            type: 'integer',
            minimum: 1,
            description: 'Number of records to fetch per page. Has to be an integer between 1 and 100. Defaults to 30',
            default: 30
        }
    }, 

    // maps --> ORDER BY
    {
        name: 'sortby',
        schema: {
            type: 'string',
            minimum: 1,
            description: `comma-separated list of &lt;column name&gt;.&lt;sort direction&gt;. Defaults to &lt;resourceId:ASC&gt;. Sorting is done in the order the columns appear in the list. For example:
- \`$sortby=treatmentTitle:ASC,rank:DESC\`
  **Note:** sort direction can be ASC or DESC`,
            default: 'resourceId:ASC'
        }
    },

    // maps --> SELECT
    {
        name: 'cols',
        schema: { 
            type: 'array', 
            items: { 
                type: 'string'
            },
            description: `Columns to retreive in the result set. Order of columns doesn't matter. Provide columns like so:
- \`cols=column1&cols=column2&cols=column3\``
        }
    }
]