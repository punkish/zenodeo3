'use strict'

const util = require('util')
const commonparams = require('./commonparams')
const JSON5 = require('json5')
const resources = require('./index')

// All params of a resource
const getAllParams = (resource) => {
    return JSON5.parse(JSON5.stringify(resources
        .filter(r => r.name === resource)[0].dictionary
        .concat(...commonparams)))
}

const getAllFacetColumns = (resource) => {
    return getAllParams(resource)
        .filter(p => p.facets)
        .map(p => {
            return {
                name: p.selname || p.name,
                tables: p.join || ''
            }
        })
}

// All queryable params of a resource.
// All params are queryable unless 'false'
const getQueryableParams = (resource) => {
    return getAllParams(resource)
        .filter(p => p.queryable !== false)
}

const getSourceOfResource = (resource) => {
    return resources
        .filter(r => r.name === resource)[0].source
}

const getResourcesFromSpecifiedSource = (source) => {
    return resources
        .filter(r => r.source === source)
}

// All queryable params of a resource with default values
const getQueryableParamsWithDefaults = (resource) => {
    const resourceId = getResourceId(resource)
    const params = getQueryableParams(resource)
    
    const p = params
        .filter(p => p.schema.default)
        .map(p => {
            if (typeof p.schema.default === 'string') {
                p.schema.default = p.schema.default.replace(/resourceId/, resourceId.selname)
            }
            return p
        })

    return p
}

const getNamesOfQueryableParams = (resource) => {
    return getQueryableParams(resource)
        .map(p => p.name)
}

// A param is a col if sqltype is present
const getAllCols = (resource) => {
    return getAllParams(resource)
        .filter(p => p.sqltype)
        .map(p => {
            return {
                name: p.name, 
                selname: p.selname || p.name, 
                where: p.where || '', 
                join: p.join || ''
            }
        })
}

// A param is a part of the set of default columns 
// if 'defaultCols' is true
const getDefaultCols = (resource) => {
    return getAllParams(resource)
        .filter(p => p.defaultCols === true)
        .map(p => { 
            return {
                name: p.name, 
                selname: p.selname || p.name,
                join: p.join
            }
        })
}

const getSchema = (resource) => {
    const queryableParams = getQueryableParams(resource)
    const resourceId = getResourceId(resource)
    const resourcesFromZenodeo = getResourcesFromSpecifiedSource('zenodeo')
        .map(r => r.name)

    const schema = {
        type: 'object',
        properties: {},
        additionalProperties: false
    }
    
    queryableParams.forEach(p => {
        if (p.schema.default && typeof(p.schema.default) === 'string') {
            p.schema.default = p.schema.default.replace(/resourceId/, resourceId.selname)
        }

        if (resourcesFromZenodeo.includes(resource)) {
            if (p.schema.type === 'array') {
                if (p.name === '$cols') {
                    p.schema.items.enum = getAllCols(resource).map(c => c.name)
                    p.schema.default = getDefaultCols(resource).map(c => c.name)
                }

                p.schema.errorMessage = 'should be one of: ' + p.schema.default.join(', ')
            }
        }
        schema.properties[p.name] = p.schema
    })

    return schema
}

const getResourceId = (resource) => {
    const col = getAllParams(resource)
        .filter(c => c.schema.isResourceId)[0]

    return { 
        name: col.name, 
        selname: col.selname || col.name 
    }
}

const getForeignKey = (resource) => {
    const cols = columns[resource]
    const fk = cols.filter(c => c.type === 'fk')
    if (fk.length) {
        return fk[0].name
    }
}

const getRequiredParams = (resource) => {
    const rp = {}

    getAllParams(resource).filter(c => c.required === true).forEach(c => {
        rp[c.name] = { default: c.default }
    })

    return rp
}

const getSelName = (resource, column) => {
    const allCols = getAllCols(resource)
    const vc = allCols
        .filter(c => c.name === column)
        .map(c => c.selname ? c.selname : c.name)
    
    return vc[0]
}

const dispatch = {
    resources: resources,
    getSourceOfResource: getSourceOfResource,
    getResourcesFromSpecifiedSource: getResourcesFromSpecifiedSource,
    getAllParams: getAllParams,
    getSchema: getSchema,
    getAllCols: getAllCols,
    getSelName: getSelName,
    getDefaultCols: getDefaultCols,
    getResourceId: getResourceId,
    getForeignKey: getForeignKey,
    getRequiredParams: getRequiredParams,
    getQueryableParams: getQueryableParams,
    getQueryableParamsWithDefaults: getQueryableParamsWithDefaults,
    getNamesOfQueryableParams: getNamesOfQueryableParams,
    getAllFacetColumns: getAllFacetColumns
}

const test = () => {
    if (process.argv.length <= 5) {
        console.log("Usage: node " + __filename.split('/').pop() + " --fn <functions> --in <input>")

        console.log()

        console.log('available functions')
        console.log('\t- ' + Object.keys(dispatch).join('\n\t- '))

        console.log()

        console.log('available inputs')
        console.log('\t- ' + resources.map(r => r.name).join('\n\t- '))

        process.exit(-1);
    }

    const fn = process.argv[3]
    const input = process.argv[5]

    const res = dispatch[fn](input)

    // http://stackoverflow.com/questions/10729276/ddg#10729284
    console.log(util.inspect(res, false, null))
    
}

// https://stackoverflow.com/questions/6398196/detect-if-called-through-require-or-directly-by-command-line?rq=1
if (require.main === module) {
    test()
} 
else {
    module.exports = dispatch
}
