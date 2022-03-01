'use strict'

const util = require('util')
const commonparams = require('./commonparams');
// const JSON5 = require('json5')
const resources = require('./index');

/*
elements are extracted from articles (-> 'cheerio')
and stored in a db (-> 'sqltype' ) table (-> 'resource').

rest query is made of params that can be directly mapped to 
a sql column (-> 'name') or a sql expression (-> 'selname').
In some cases, the sql expression has to be calculated 
based on the values of the param submitted in the query.

every param has an enry in the data-dictionary. The entry 
includes a schema (-> 'schema') that describes the data type 
of the param


query: ?q=foo
param: q
selname: snippet(vtreatments, 1, '<b>', '</b>', '…', 25) snippet

    {
        name: 'q',
        schema: {
            type: 'string',
            description: 'A snippet extracted from the full text of the treatment'
        },
        selname: "snippet(vtreatments, 1, '<b>', '</b>', '…', 25) snippet",
        sqltype: 'TEXT',
        cheerio: '',
        defaultCols: false,
        defaultOp: 'match',
        where: 'vtreatments',
        queryable: true,
        join: [ 'JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId'  ],
        facet: ''
    }
*/

// resources: REST resources that map 1 -> 1 to SQL tables
// returns an array of resource names
const getResources = () => resources.map(r => r.name);

// returns the source ('zenodeo' or 'zenodo') of a given resource
const getSourceOfResource = (resource) => resources
    .filter(r => r.name === resource)[0].source;

const getResourcesFromSource = (source) => resources
    .filter(r => r.source === source)
    .map(r => r.name);

// params: all entries in the data dictionary for a given resource
const getParams = (resource) => resources
    .filter(r => r.name === resource)[0].dictionary
    .concat(...commonparams);

const getResourceid = (resource) => getParams(resource)
    .filter(p => p.schema.isResourceId)[0];

const getParamsNameAndSelname = (resource) => getParams(resource)
    .map(p => {return {name: p.name, selname: p.selname}})

// queryableParams: dd entries that are allowed in a REST query
const getQueryableParams = (resource) => getParams(resource)
    .filter(p => p.queryable !== false)

// All queryable params of a resource with default values
const getQueryableParamsWithDefaults = function(resource) {
    const resourceId = getResourceid(resource)
    const params = getQueryableParams(resource)
    
    const p = params
        .filter(p => 'default' in p.schema)
        .map(p => {
            if (typeof p.schema.default === 'string') {
                p.schema.default = p.schema.default.replace(/resourceId/, resourceId.selname)
            }

            return p
        })

    return p
}

// cols: columns suitable to make a SQL query. Columns in the 
// SELECT clause can be different from those in the JOIN or  
// the WHERE clauses
const getCols = (resource) => getParams(resource)
    .map(p => {
        return {
            name: p.name, 
            schema: p.schema,
            alias: p.alias, 
            isResourceId: p.schema.isResourceId || false,
            where: p.where, 
            join: p.join || '',
            sqltype: p.sqltype,
            zqltype: p.zqltype || 'text',
            isDefaultCol: p.defaultCols || false,
            facet: p.facet || false
        }
    })

// defaultCols: columns that are returned if no columns are 
// specified in a REST query via 'cols'
const getDefaultCols = (resource) => getCols(resource)
    .filter(p => p.isDefaultCol === true)

// facetCols: all cols that can be used in facet queries
const getFacetCols = (resource) => getCols(resource)
    .filter(p => p.facet)

const getSqlCols = (resource) => getParams(resource)
    .map(p => {
        return {
            name: p.name, 
            isResourceId: p.schema.isResourceId || false,
            cheerio: p.cheerio
        }
    })

// selname: the column name or expression used in a SQL query
const getSelect = (resource, column) => {
    const col = getParams(resource).filter(p => p.name === column)[0];
    return col.alias ? col.alias.select : column;
}

// where: the column name used in the WHERE clause of a SQL query
const getWhere = (resource, column) => {
    const col = getParams(resource).filter(c => c.name === column)[0];
    return col.alias ? col.alias.where : column;
}

const getZqltype = (resource, column) => getCols(resource)
    .filter(c => c.name === column)[0].zqltype

// schema: we use the schema to validate the query params
const getSchema = function(resource) {
    const queryableParams = JSON.parse(JSON.stringify(getQueryableParams(resource)));
    const rId = getResourceid(resource);
    const rIdName = rId.alias ? rId.alias.select : rId.name;
    
    const resourcesFromZenodeo = getResourcesFromSource('zenodeo');
        //.map(r => r.name)

    const schema = {
        type: 'object',
        properties: {},
        additionalProperties: false
    };
    
    queryableParams.forEach(p => {
        if (p.schema.default && typeof(p.schema.default) === 'string') {
            p.schema.default = p.schema.default.replace(/resourceId/, rIdName);
        }

        if (resourcesFromZenodeo.includes(resource)) {
            if (p.schema.type === 'array') {
                if (p.name === 'cols') {
                    
                    //p.schema.prefixItems = getCols(resource).map(c => {
                    p.schema.items.enum = getCols(resource).map(c => {
                        // const operator = '(?<groupby>distinct)?';
                        // return `^${operator}\\(${c.name}\\)$`;
                        // return { type: c.schema.type }
                        return c.name;
                    });

                    // allow empty col as in "cols=''"
                    p.schema.items.enum.push('');
                    //p.schema.prefixItems.push('');
                    p.schema.default = getDefaultCols(resource).map(c => c.name);
                    p.schema.errorMessage = {
                        properties: {
                            enum: 'should be one of: ' + p.schema.default.join(', ') + '. Provided value is ${/enum}'
                        }
                    }
                }
            }
        }

        schema.properties[p.name] = p.schema;
    })

    return schema
}

const getJoin = (resource, column, type) => {
    const col = getParams(resource).filter(c => c.name === column)[0];
    return col.joins ? col.joins[type] : '';
}

const getNotCols = () => commonparams.map(c => c.name)

// Finding the number of function parameters in JavaScript
// https://stackoverflow.com/a/6293830/183692
const getArgs = (f) => {
    let args = f.toString()
    args = args.split('\n').join('')
    args = args.replace(/^function\((.*?)\).*/,'$1').split(', ')
    return args
}

const dispatch = {
    getResources,
    getSourceOfResource,
    getResourcesFromSource,
    getParams,
    getParamsNameAndSelname,
    getQueryableParams,
    getQueryableParamsWithDefaults,
    getCols,
    getDefaultCols,
    getFacetCols,
    getSqlCols,
    getSelect,
    getWhere,
    getZqltype,
    getSchema,
    getResourceid,
    getJoin,
    getNotCols
}

const test = () => {
    if (process.argv.length <= 2) {
        console.log('available functions are:');
        console.log('- ' + Object.keys(dispatch).join('\n- '));
    }
    else {
        const [one, two, fn, ...args] = process.argv;
        //dispatch[fn](...args)
        console.log(util.inspect(dispatch[fn](...args), false, 4, true));
    }
}

// https://stackoverflow.com/questions/6398196/detect-if-called-through-require-or-directly-by-command-line?rq=1
if (require.main === module) {
    test();
}
else {
    module.exports = dispatch;
}