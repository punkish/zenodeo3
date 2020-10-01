'use strict'

const util = require('util')
const definitions = require('./definitions')
const commonparams = require('./commonparams')
const JSON5 = require('json5')

const resources = require('./index')

// All params of a resource
const allParams = (resource) => {
    return resources.filter(r => r.name === resource)[0].dictionary.concat(...commonparams)
}

// All queryable params of a resource.
// All params are queryable unless 'false'
const getQueryableParams = (resource) => {
    const params = allParams(resource)
    return params.filter(p => p.queryable !== false)
}

const getNamesOfQueryableParams = (resource) => {
    return getQueryableParams(resource).map(p => p.name)
}

// JSON schema of a resource
const getSchema = (resource) => {
    const queryable = getQueryableParams(resource)
    const schema = {
        type: 'object',
        properties: {}
    }

    queryable.forEach(p => {
        const d = JSON5.parse(JSON5.stringify(definitions[p.type]))
        const scheme = d.schema
        scheme.description = p.description

        const help = d.help
        scheme.description += help ? '. ' + help.replace(/col/g, p.name) : ''

        const defaultval = p.default
        scheme.description +=  defaultval ? ` (defaults to ${defaultval})` : ''
        
        scheme.isResourceId = p.type === 'resourceId' ? true : false
        schema.properties[p.name] = scheme
    })

    return schema
}


const getSchemaStrict = (resource) => {
    
    const queryable = getQueryableParams(resource)
    const resourceId = getResourceId(resource)

    // see https://stackoverflow.com/questions/64094775/requiring-a-param-with-json-schema-when-another-param-is-not-present/64110512?noredirect=1#comment113391938_64110512
    // const schema = {
    //     type: 'object',
    //     properties: {},
    //     additionalProperties: false,
    //     if: { $ref: '#/definitions/has-property-other-than-resourceId' },
    //     then: { required: [] }, // [ '$page', '$size' ] },
    //     definitions: {
    //         'has-property-other-than-resourceId': {
    //             if: { required: [] }, // resourceId
    //             then: { minProperties: 3 },
    //             else: { minProperties: 1 }
    //         }
    //     }
    // }

    const schema = {
        type: 'object',
        properties: {},
        additionalProperties: false
    }
    
    queryable.forEach(p => {
        const d = JSON5.parse(JSON5.stringify(definitions[p.type]))

        // we create a scheme for each param starting with the schema
        // defined in the data dictionary
        const scheme = d.schema

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
        
        // if (p.required) {
        //     schema.then.required.push(p.name)
        // }

        schema.properties[p.name] = scheme
        
    })

    return schema
}

const getResourceId = (resource) => {
    const cols = allParams(resource)
    const col = cols.filter(c => c.type === 'resourceId')[0]
    return col.selectname ? col.selectname : col.name
}

const getForeignKey = (resource) => {
    const cols = columns[resource]
    const fk = cols.filter(c => c.type === 'fk')
    if (fk.length) {
        //console.log(fk)
        return fk[0].name
    }
}

const getRequiredParams = (resource) => {
    const cols = allParams(resource)
    const rp = {}
    cols.filter(c => c.required === true).forEach(c => {
        rp[c.name] = { default: c.default }
    })

    return rp
}

const dispatch = {
    resources: resources,
    allParams: allParams,
    getSchema: getSchema,
    getSchemaStrict: getSchemaStrict,
    getResourceId: getResourceId,
    getForeignKey: getForeignKey,
    getRequiredParams: getRequiredParams,
    getQueryableParams: getQueryableParams,
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
