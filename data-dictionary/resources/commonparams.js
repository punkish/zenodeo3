export const commonparams = [

    /* 
     * parameters that affect the response but are  
     * not part of any specific query
     */
    {
        name: 'refreshCache',
        schema: {
            type: 'boolean',
            description: 'Force refresh cache (true | false)',
            default: false
        },
        notDefaultCol: true
    },
    {
        name: 'facets',
        schema: {
            type: 'boolean',
            description: 'Calculate facets (true | false)',
            default: false
        },
        notDefaultCol: true
    },
    {
        name: 'relatedRecords',
        schema: {
            type: 'boolean',
            description: 'Calculate related records (true | false)',
            default: false
        },
        notDefaultCol: true
    },
    {
        name: 'stats',
        schema: {
            type: 'boolean',
            description: 'Calculate statistics for dashboard (true | false)',
            default: false
        },
        notDefaultCol: true
    },

    /*
     * parameters that are a part of the query 
     * Note: these params are not names of any columns
     */

    /* 
     * maps --> OFFSET
     * OFFSET = page - 1
     */
    {
        name: 'page',
        schema: {
            type: 'integer',
            minimum: 1,
            description: 'Starting page. Has to be an integer greater than 0. Defaults to 1',
            default: 1
        },
        notDefaultCol: true
    },

    /* 
     * maps --> LIMIT
     */
    {
        name: 'size',
        schema: {
            type: 'integer',
            minimum: 1,
            description: 'Number of records to fetch per page. Has to be an integer between 1 and 100. Defaults to 30',
            default: 30
        },
        notDefaultCol: true
    }, 

    /*
     * maps --> ORDER BY
     */
    {
        name: 'sortby',
        schema: {
            type: 'string',
            description: `comma-separated list of &lt;column name&gt;.&lt;sort direction&gt;. Defaults to &lt;resourceId:ASC&gt;. Sorting is done in the order the columns appear in the list. For example:
- \`sortby=treatmentTitle:ASC,rank:DESC\`
  **Note:** sort direction can be ASC or DESC`,
            default: 'resourceId:ASC'
        },
        notDefaultCol: true
    },

    {
        name: 'groupby',
        schema: {
            type: 'string',
            description: `Fully-qualified name of column by which to group the results. For example:
- \`groupby=images.httpUri\``,
            //default: 'resourceId:ASC'
        },
        notDefaultCol: true
    },

    /* 
     * maps --> SELECT <columns>
     */
    {
        name: 'cols',
        schema: { 
            type: 'array', 
            items: { 
                type: 'string'
            },
            description: `Columns to retreive in the result set. Order of columns doesn't matter. Provide columns like so:
- \`cols=column1&cols=column2&cols=column3\``
        },
        notDefaultCol: true
    }
]