'use strict';

/***********************************************************************
 * 
 * Data dictionary for families (used for lookups) from Zenodeo
 * 
 **********************************************************************/

module.exports = [
    {
        name: 'id',
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the family',
            // isResourceId: true
        },
        isResourceId: true,
        sqltype: 'INTEGER',
        notDefaultCol: true
    },
    {
        name: 'q',
        schema: {
            type: 'string',
            description: 'The name of the family'
        },
        sqltype: 'TEXT',
        selname: 'family',
        defaultOp: 'starts_with'
    }
]