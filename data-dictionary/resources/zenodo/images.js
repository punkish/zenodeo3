'use strict';

// see https://github.com/plazi/Plazi-Communications/issues/1044#issuecomment-661246289 
// for notes from @gsautter

/*
 * All params are queryable unless notqueryable is true
 * Params with 'defaultCols' = true are SELECT-ed by default
 * Param 'type' is looked up in ../definitions.js to create the schema
 * Param 'sqltype' is used in CREATE-ing the db table
 * Param 'selname' is used when 'name' is inappropriate for SQL
 */
module.exports = [
    {
        name: 'id',
        schema: {
            type:"integer",
            description: 'unique identifier of the record',
            isResourceId: true
        }
    },

    {
        name: 'subtype',
        schema: { 
            type: 'array', 
            items: { 
                type: 'string',
                enum: [ 'figure', 'photo', 'drawing', 'diagram', 'plot', 'other' ]
            },
            minItems: 1,
            maxItems: 6,
            additionalItems: false,
            //default: [ 'figure', 'photo', 'drawing', 'diagram', 'plot', 'other' ],
            description: 'The image subtype; defaults to all subtypes'
        }
    },

    {
        name: 'communities',
        schema: { 
            type: 'array', 
            items: { 
              type: 'string',
              //enum: [ 'biosyslit', 'belgiumherbarium' ]
            },
            minItems: 1,
            maxItems: 2,
            additionalItems: false,
            default: [ 'biosyslit' ],
            description: 'The community on Zenodo; defaults to <b>"biosyslit"</b>'
        }
    },

    {
        name: 'q',
        schema: { 
            type: 'string', 
            description: 'The term for full-text search. Can use the following syntax: \`q=spiders\`'
        },
    },

    {
        name: 'creator',
        schema: { 
            type: 'string',
            description: `Usually the author. Can use the following syntax:
- creator="Agosti, Donat"
  will find all records containing exactly "Agosti, Donat"

- creator=Ago
  will find all records containing words startings with "Ago"

- creator=Agosti Donat
  will find all records containing Agosti, Donat, Donat Agosti, Agosti Donat (a boolean OR search)

- creator=Agosti AND Donat
  will find all records containing both Agosti and Donat in any order`
        }
    },

    {
        name: 'title',
        schema: { 
            type: 'string',
            description: `Title of the record. Can use the following syntax:
- title="spider, peacock"
  will find all records containing exactly "spider, peacock"

- title=pea
  will find all records containing words startings with "pea"

- title=spider peacock
  will find all records containing either spider or peacock, or both in any order (a boolean OR search)

- title=spider AND peacock
  will find all records containing both spider and peacock in any order`
        }
    },

    {
        name: 'keywords',
        schema: { 
            type: 'array',
            items: {
                type: 'string'
            },
            description: 'The keywords associated with the image; more than one keywords may be used'
        }
    }
]