// see https://github.com/plazi/Plazi-Communications/issues/1044#issuecomment-661246289 
// for notes from @gsautter

/*
 * All params are queryable unless notqueryable is true
 * Params with 'defaultCols' = true are SELECT-ed by default
 * Param 'type' is looked up in ../definitions.js to create the schema
 * Param 'sqltype' is used in CREATE-ing the db table
 * Param 'selname' is used when 'name' is inappropriate for SQL
 */

export const dictionary = [
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
            type: 'string', 
            enum: [ 'full', 'monthly', 'weekly', 'daily' ],
            description: 'The type of archive'
        }
    }
]