'use strict'

module.exports = [

    // parameters that affect the query but are  
    // not a part of it
    {
        name: '$refreshCache',
        type: 'boolean',
        description: 'Force refresh cache',
        default: false,
        queryable: true,
        defaultOp: 'eq'
    },
    {
        name: '$facets',
        type: 'boolean',
        description: 'Calculate facets',
        default: false,
        queryable: true,
        defaultOp: 'eq'
    },
    {
        name: '$stats',
        type: 'boolean',
        description: 'Calculate statistics',
        default: false,
        queryable: true,
        defaultOp: 'eq'
    },

    //****************************************//
    // parameters that are a part of the query 
    //****************************************//

    // parameters that are not columns

    // maps --> OFFSET
    {
        name: '$page',
        type: 'integer',
        description: 'Starting page (not required when &lt;resourceId&gt; is in the querystring, required otherwise)',
        default: 1,
        required: true,
        defaultOp: 'eq'
    },

    // maps --> LIMIT
    {
        name: '$size',
        type: 'size',
        description: 'Number of records to fetch per page (not required when &lt;resourceId&gt; is in the querystring, required otherwise)',
        default: 30,
        required: true,
        defaultOp: 'eq'
    }, 

    // parameters that affect ORDER BY
    {
        name: '$sortby',
        type: 'sortby',
        description: 'comma-separated list of &lt;column name&gt;.&lt;sort direction&gt;',
        default: 'resourceId:ASC',
        defaultOp: 'eq'
    },

    // parameters that affect SELECT
    {
        name: '$cols',
        type: 'array',
        description: 'Columns to retreive in the result set',
        defaultOp: 'eq'
    }
]