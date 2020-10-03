'use strict'

module.exports = [

    // parameters that affect the query but are  
    // not a part of it
    {
        name: '$refreshCache',
        schema: {
            type: 'boolean',
            description: 'Force refresh cache (true | false)',
            default: false
        }
    },
    {
        name: '$facets',
        schema: {
            type: 'boolean',
            description: 'Calculate facets (true | false)',
            default: false
        }
    },
    {
        name: '$stats',
        schema: {
            type: 'boolean',
            description: 'Calculate statistics (true | false)',
            default: false
        }
    },

    //****************************************//
    // parameters that are a part of the query 
    //****************************************//

    // parameters that are not columns

    // maps --> OFFSET
    {
        name: '$page',
        schema: {
            type: 'integer',
            minimum: 1,
            description: 'Starting page. Has to be an integer greater than 0. Defaults to 1',
            default: 1
        }
    },

    // maps --> LIMIT
    {
        name: '$size',
        schema: {
            type: 'integer',
            minimum: 1,
            description: 'Number of records to fetch per page. Has to be an integer between 1 and 100. Defaults to 30',
            default: 30
        }
    }, 

    // parameters that affect ORDER BY
    {
        name: '$sortby',
        schema: {
            type: 'string',
            minimum: 1,
            description: `comma-separated list of &lt;column name&gt;.&lt;sort direction&gt;. Defaults to &lt;resourceId:ASC&gt;. For example:
- \`$sortby=treatmentTitle:ASC\`
  **Note:** sort direction can be ASC or DESC`,
            default: 'resourceId:ASC'
        }
    },

    // parameters that affect SELECT
    {
        name: '$cols',
        schema: { 
            type: 'array', 
            items: { type: 'string' },
            description: `Columns to retreive in the result set. Provide a list like so:
- \`$col=column1&$col=column2&$col=column3\``
        }
    }
]