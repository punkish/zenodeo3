'use strict';

/***********************************************************************
 * 
 * Data dictionary for images from Zenodo
 * 
 **********************************************************************/

module.exports = [
    {
        name: 'id',
        schema: {
            type:"integer",
            description: 'unique identifier of the record',
            isResourceId: true
        },
        defaultCols: true
    },

    {
        name: 'subtype',
            schema: { 
            type: 'array', 
            items: { 
                type: 'string',
                enum: [ "article", "report", "book", "thesis", "section", "workingpaper", "preprint" ]
            },
            minItems: 1,
            maxItems: 7,
            additionalItems: false,
            default: [ "article", "report", "book", "thesis", "section", "workingpaper", "preprint" ],
            description: 'The publication subtype; defaults to all subtypes'
        },
        defaultCols: true
    },

    {
      name: 'communities',
      schema: { 
          type: 'array', 
          items: { 
            type: 'string',
            enum: [ 'biosyslit', 'belgiumherbarium' ]
          },
          minItems: 1,
          maxItems: 2,
          additionalItems: false,
          default: [ 'biosyslit' ],
          description: 'The community on Zenodo; defaults to <b>"biosyslit"</b>'
      },
      defaultCols: true
  },

    {
        name: 'q',
        schema: { 
            type: 'string', 
            description: 'The term for full-text search. Can use the following syntax: \`q=spiders\`'
        }
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
        },
        defaultCols: true
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
        },
        defaultCols: true
    },

    {
        name: 'keywords',
        schema: { 
            type: 'array',
            items: {
                type: 'string'
            },
            description: 'The keywords associated with the publication; more than one keywords may be used'
        },
        defaultCols: true
    }
]