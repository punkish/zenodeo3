'use strict'

module.exports = [
    {
        name: 'fakeId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the fake column. Has to be a 32 character string like: '10922A65E320FF95FC0FFC83FB80FCAA'`,
            isResourceId: true
        },
        selname: 'fakeId',
        sqltype: 'TEXT NOT NULL UNIQUE',
        defaultCols: true
    },

    {
        name: 'fakeText',
        schema: {
            type: 'string',
            description: `The fake text`
        },
        sqltype: 'TEXT',
        defaultCols: true
    },

    {
        name: 'fakeTextEq',
        schema: {
            type: 'string',
            description: `The fake text`
        },
        sqltype: 'TEXT',
        defaultCols: true,
        defaultOp: 'eq'
    },

    {
        name: 'fakeTextLike',
        schema: {
            type: 'string',
            description: `The fake text`
        },
        sqltype: 'TEXT',
        defaultCols: true,
        defaultOp: 'like'
    },

    {
        name: 'fakeTextStartsWith',
        schema: {
            type: 'string',
            description: `The fake text`
        },
        sqltype: 'TEXT',
        defaultCols: true,
        defaultOp: 'starts_with'
    },

    {
        name: 'fakeTextContains',
        schema: {
            type: 'string',
            description: `The fake text`
        },
        sqltype: 'TEXT',
        defaultCols: true,
        defaultOp: 'contains'
    },

    {
        name: 'fakeTextEndsWith',
        schema: {
            type: 'string',
            description: `The fake text`
        },
        sqltype: 'TEXT',
        defaultCols: true,
        defaultOp: 'ends_with'
    }
]