see [notes from @gsautter](https://github.com/plazi/Plazi-Communications/issues/1044#issuecomment-661246289)


Elements are extracted from articles (-> 'cheerio')
and stored in a db (-> 'sqltype' ) table (-> 'resource').

A REST query is made of params that can be directly mapped to 
a sql column (-> 'name') or a sql expression (-> 'selname').
In some cases, the sql expression has to be calculated 
based on the values of the param submitted in the query.

Every param has an entry in the data-dictionary. The entry 
includes a schema (-> 'schema') that describes the data type 
of the param

All params are queryable unless notqueryable is true

Params with 'defaultCols' = true are SELECT-ed by default

Param 'sqltype' is used to CREATE the db table

Param 'selname' is used when 'name' is inappropriate for SQL. 
For example, when a column exists in two JOIN-ed tables, we 
can use 'selname' to prefix the column name with the table. Or,
if a column name is a reserved SQL word, we can double quote it 
as in the case of "order"

The dictionary defines each param that can be used in a REST query. As such, it is an array of objects. Each object (a param) is made of the following key:value pairs (not all kv pairs are required):

```js
{
        // the key used in the REST query
        name: 'treatmentId',

        // alternative name to use in the SELECT and WHERE clauses of SQL. 
        // This is important when using a db column from a different 
        // table, or when the name of the key is a reserved word in SQL
        // for example, 'rank' shown below which is a special word in 
        // SQLite FTS module
        alias: {
            select: 'treatments.rank',
            where : 'treatments.rank'
        },
        
        // JSON schema that verifies the queries
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the treatment. Has to be a 32 character string:
- \`treatmentId=388D179E0D564775C3925A5B93C1C407\``,
        },

        // whether on not the db column is a primary key. This key is required
        // *only* if the column is a PK. Otherwise, it defaults to false.
        isResourceId: true,
        
        // SQL datatype
        sqltype: 'TEXT NOT NULL UNIQUE',

        // zqltype is 'text' by default unless defined explicitly
        zqltype: 'date' | 'geolocation' | 'number'

        // cheerio expression used to parse the value from the XML
        cheerio: '$("document").attr("docId")',

        // all columns are included in the query results by 
        // default unless notDefaultCol is true
        notDefaultCol: true

        // all params are queryable unless notqueryable is true
        notQueryable: true
    }
```

query string pattern
`<resource>/?<key> =<val>&<key> =<val>`

## Case 1

condition:  query key maps directly to a resource column
example  :  `treatments/?treatmentTitle=some text`
dd       :  {
                name: 'treatmentTitle'
            }
select   :  ${resource}.${key.name}
            treatments.treatmentTitle
operator :  =
where    :  ${resource}.${key.name} ${operator} ${val} 
            treatments.treatmentTitle = 'some text'

## Case 2

condition:  query param maps to an expression
example  :  `treatments/?q=some text`
dd       :  {
                name: 'q'
                alias: {
                    select: "snippet(vtreatments, 1, '<b>', '</b>', '…', 25) snippet",
                    where : 'vtreatments'
                }
            }
select   :  ${key.alias.select}
            snippet(vtreatments, 1, '<b>', '</b>', '…', 25) snippet
operator :  MATCH
where    :  ${key.alias.where} = ${val}
            vtreatments MATCH 'some text'

## Case 3

condition:  query param maps to a column from a different resource
example  :  `treatments/?httpUri=ne('')`
dd       :  {
                name: 'httpUri'
                alias: {
                    select: 'figureCitations.httpUri',
                    where : 'figureCitations.httpUri'
                }
            }
operator :  !=
select   :  ${key.alias.select}
            figureCitations.httpUri
where    :  ${key.alias.where} = ${val}
            figureCitations.httpUri != ''