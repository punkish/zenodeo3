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

// All queryable params of a resource.
// All params are queryable unless 'false'
const getQueryableParams = (resource) => {
    const allParams = getAllParams(resource)
    return allParams.filter(p => p.queryable !== false)
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
    return getQueryableParams(resource).map(p => p.name)
}

// A param is a col if sqltype is present
const getAllCols = (resource) => {
    const allParams = getAllParams(resource)
    return allParams
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
    const allParams = getAllParams(resource)
    return allParams
        .filter(p => p.defaultCols === true)
        .map(p => { 
            return {
                name: p.selname || p.name, 
                join: p.join
            }
        })
}

const getSchema = (resource) => {
    const queryableParams = getQueryableParams(resource)
    const resourceId = getResourceId(resource)

    const schema = {
        type: 'object',
        properties: {},
        additionalProperties: false
    }
    
    queryableParams.forEach(p => {

        if (p.schema.default && typeof(p.schema.default) === 'string') {
            p.schema.default = p.schema.default.replace(/resourceId/, resourceId.selname)
        }

        schema.properties[p.name] = p.schema
        
    })

    return schema
}

/*
const getSchemaStrict = (resource) => {
    
    const queryable = getQueryableParams(resource)
    const resourceId = getResourceId(resource)

    const schema = {
        type: 'object',
        properties: {},
        additionalProperties: false
    }
    
    queryable.forEach(p => {
        const d = JSON5.parse(JSON5.stringify(definitions[p.type]))

        // we create a scheme for each param starting with the schema
        // defined in the data dictionary
        const scheme = {}

        // add more description…
        scheme.description = p.description

        // and help as apporpriate, customizing each param with its
        // column name by replacing the 'cname' placeholder
        const help = d.help
        if (help) scheme.description += '. ' + help.replace(/cname/g, p.name)

        // add default values, if needed…
        let defaultval = p.default || ''
        if (typeof(defaultval) === 'string') {
            defaultval = defaultval.replace(/resourceId/, resourceId)
        }

        if (defaultval) {
            scheme.default = defaultval
            scheme.description += ` (defaults to ${defaultval})`
        }

        // and a custom error message
        if (d.errorMessage) scheme.errorMessage = d.errorMessage

        if (p.type === 'resourceId') {
            scheme.isResourceId = true
            //schema.definitions['has-property-other-than-resourceId'].if.required.push(p.name)
        }
        else {
            scheme.isResourceId = false
        }

        schema.properties[p.name] = scheme
        
    })

    return schema
}
*/

const getResourceId = (resource) => {
    const allParams = getAllParams(resource)
    const col = allParams.filter(c => c.schema.isResourceId)[0]
    return { name: col.name, selname: col.selname || col.name }
}

const getForeignKey = (resource) => {
    const cols = columns[resource]
    const fk = cols.filter(c => c.type === 'fk')
    if (fk.length) {
        return fk[0].name
    }
}

const getRequiredParams = (resource) => {
    const allParams = getAllParams(resource)
    const rp = {}
    allParams.filter(c => c.required === true).forEach(c => {
        rp[c.name] = { default: c.default }
    })

    return rp
}

const dispatch = {
    resources: resources,
    getAllParams: getAllParams,
    getSchema: getSchema,
    getAllCols: getAllCols,
    getDefaultCols: getDefaultCols,
    getResourceId: getResourceId,
    getForeignKey: getForeignKey,
    getRequiredParams: getRequiredParams,
    getQueryableParams: getQueryableParams,
    getQueryableParamsWithDefaults: getQueryableParamsWithDefaults,
    getNamesOfQueryableParams: getNamesOfQueryableParams
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
