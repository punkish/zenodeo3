'use strict'

const utils = require('../../lib/utils');
const log = utils.logger('ZQL-UTILS');

const config = require('config');
const ajvOpts = config.get('v3.ajv.options.customOptions');
const Ajv = require('ajv');
const ajv = new Ajv(ajvOpts);
require('ajv-errors')(ajv);

const turf = require('@turf/turf');
const ddUtils = require('../../data-dictionary/dd-utils');

// table of zops to sql operators
const zops = {

    // numeric and string operators
    eq            : '=',
    ne            : '!=',

    // numeric operators
    gte           : '>=',
    lte           : '<=',
    gt            : '>',
    lt            : '<',
    
    // also between

    // string operators
    like          : 'LIKE',
    starts_with   : 'LIKE',
    ends_with     : 'LIKE',
    contains      : 'LIKE',

    // date operators
    between       : 'BETWEEN',
    since         : '>=',
    until         : '<=',

    // spatial operator
    within        : 'BETWEEN',
    contained_in  : 'BETWEEN',

    // fts5
    match         : 'MATCH'
}

// check if the submitted params conform to the schema
const validate = function({resource, params}) {
    const schema = ddUtils.getSchema(resource);
    const validator = ajv.compile(schema)
    const valid = validator(params)

    if (valid) {
        return params;
    }
    else {
        log.error(validator.errors)
        return false
    }
}

const formatDate = (date) => {
    let [yyyy, mm, dd] = date.split('-');

    if (parseInt(mm) < 10) {
        mm = mm.toString().padStart(2, '0');
    }

    if (parseInt(dd) < 10) {
        dd = dd.toString().padStart(2, '0');
    }

    return `${yyyy}-${mm}-${dd}`;
}

/*

The queryString is made up of key-value pairs separated by '&'
Within each pair, the key and the value are separated by '='

Two kinds of patterns are possible
    <key> = <value>
    <key> = <zql>(<value>)

1. Convert queryString into an object of k,v pairs
2. evaluate each k,v pair
    - convert key to 'left' by using getWhere()
    - evaluate value to see if it contains a ZQL operator (zop)
        - yes:
            - convert zop to operator
            - convert value to 'right'
        - no:
            - find default operator
            - convert value to 'right'

*/
const _getConstraint = (resource, key, val) => {
    const constraint = [];
    const runparam = {};

    // const c = ddUtils.getWhere(resource, key);
    // if (c) constraint.push(c);

    // The val (right side of the k,v pair) is either a string
    // or a boolean or a number. ZQL operators are only present
    // in strings.
    if (typeof(val) === 'string') {
        
        // first, lets check if there is an ZQL operator in the val
        const zqltype = ddUtils.getZqltype(resource, key);
        
        const pattern = utils.getPattern(zqltype);
        const res = val.match(pattern);

        if (res) {
            const g = res.groups
            const zop = g.operator;
            const operator = zops[zop];

            if (zqltype === 'geolocation') {
                let min_lng;
                let min_lat;
                let max_lng;
                let max_lat;

                if (zop === 'within') {
                    const radius = Number(g.radius) || 1;
                    const units = g.units || 'kilometers';
                    const coords = [ Number(g.lng), Number(g.lat) ];
                    const buffered = turf.buffer(
                        turf.point(coords), 
                        radius, 
                        { units }
                    );
                    
                    [min_lng, min_lat, max_lng, max_lat] = turf.bbox(buffered);
                }
                else if (zop === 'contained_in') {
                    [min_lng, min_lat, max_lng, max_lat] = [g.min_lng, g.min_lat, g.max_lng, g.max_lat];
                }

                constraint.push(`latitude ${operator} @min_lat AND @max_lat`);
                runparam.min_lat = min_lat;
                runparam.max_lat = max_lat;

                constraint.push(`longitude ${operator} @min_lng AND @max_lng`);
                runparam.min_lng = min_lng;
                runparam.max_lng = max_lng;
            }
            else if (zqltype === 'date') {
                if (zop === 'between') {                    
                    constraint.push(`${key} ${operator} strftime('%s', @from) * 1000 AND strftime('%s', @to) * 1000`);

                    runparam.from = formatDate(g.from);
                    runparam.to = formatDate(g.to);
                }
                else if (zop === 'eq' || zop === 'since' || zop === 'until') {
                    constraint.push(`${key} ${operator} strftime('%s', @date) * 1000`);
                    runparam.date = formatDate(g.date);
                }
                
                //convert Object null prototype to regular Object
                // https://stackoverflow.com/questions/56298481/how-to-fix-object-null-prototype-title-product#comment111312577_60333849
                //runparam = { ...g }
            }
            // else if (zqltype === 'number') {
            // }
            else if (zqltype === 'text') {
                const left = `Lower(${key})`;
                const right = g.text.toLowerCase();
                
                
                constraint.push(`${left} ${operator} @${key}`)
                if (zop === 'like') {
                    runparam[key] = right
                }
                else if (zop === 'starts_with') {
                    runparam[key] = `${right}%`
                }
                else if (zop === 'ends_with') {
                    runparam[key] = `%${right}`
                }
                else if (zop === 'contains') {
                    runparam[key] = `%${right}%`
                }
                else {
                    runparam[key] = right
                }
            }
        }

        /*
         * no ZQL operator was found, so let's try to determine a 
         * nonzql constraint
         */
        else {
            const queryableParams = ddUtils.getQueryableParams(resource);
    
            // https://stackoverflow.com/questions/19874555/how-do-i-convert-array-of-objects-into-one-object-in-javascript
            const _defaultOps = queryableParams
                .reduce((o, i) => Object.assign(o, {[i.name]: i.defaultOp || 'eq'}), {});
        
            const zop = _defaultOps[key];
            const operator = zops[zop];

            let left = ddUtils.getWhere(resource, key);

            if (zop === 'eq') {
                constraint.push(`${left} ${operator} @${key}`);
                runparam[key] = val;
            }
            else if (zop === 'match') {
                constraint.push(`${left} ${operator} @${key}`);
                runparam[key] = val;
            }
            else {
                left = `Lower(${left})`;
                const right = val.toLowerCase()
                
                constraint.push(`${left} ${operator} @${key}`);

                if (zop === 'like') {
                    runparam[key] = right
                }
                else if (zop === 'starts_with') {
                    runparam[key] = `${right}%`
                }
                else if (zop === 'ends_with') {
                    runparam[key] = `%${right}`
                }
                else if (zop === 'contains') {
                    runparam[key] = `%${right}%`
                }
            }
        }
    }

    /*
     * val is not a string, so it is either a boolean or a 
     * number. It is going to be a straightforward left op right
     * constraint
     */

    else {
        if (typeof(val) === 'boolean') {
            const left = ddUtils.getSelect(resource, key);
            const str = `${left} = ${val === 'true' ? 1 : 0}`;
            constraint.push(str)
        }
        else {
            const left = ddUtils.getSelect(resource, key);
    
            const queryableParams = ddUtils.getQueryableParams(resource)
        
            // https://stackoverflow.com/questions/19874555/how-do-i-convert-array-of-objects-into-one-object-in-javascript
            const _defaultOps = queryableParams
                .reduce((o, i) => Object.assign(o, {[i.name]: i.defaultOp || 'eq'}), {})
    
            const zop = _defaultOps[key]
            const operator = zops[zop]
        
            constraint.push(`${left} ${operator} @${key}`)
            runparam[key] = val
        }

    }

    return { constraint, runparam }
}

const getColumns = (resource, params) => {
    const rId = ddUtils.getResourceid(resource);

    // SELECT columns will always include the resourceId
    const columns = [ rId.alias ? rId.alias.select : rId.name ];

    if (params.cols.length) {

        // and all other columns specified in 'cols'
        const tmp = params.cols

            // remove resourceId since it has already been included above
            .filter(col => col !== rId.name)

            // get selnames for the rest of the columns
            .map(col => ddUtils.getSelect(resource, col));

        columns.push(...tmp);
    }

    return columns;
}

const getTables = (resource, params) => {

    // FROM tables will always include the main resource table
    let tables = [ resource ];

    /* 
     * FROM tables may exist because of columns in the SELECT 
     * clause or because of the constraints in the WHERE 
     * clause.
     */
    params.cols.forEach(col => {
        const t = ddUtils.getJoin(resource, col, 'select');
        if (t) {
            tables.push(...t);
        }
    });

    //const notCols = ddUtils.getNotCols();

    Object.keys(params)
        //.filter(p => !notCols.includes(p))
        .forEach(p => {

            /*
             * Get any tables that may need to be in the FROM … JOIN clause
             * for every parameter
             */
            const t = ddUtils.getJoin(resource, p, 'where');
            if (t) {
                tables.push(...t);
            }         
        })

    // remove duplicates from tables
    // https://stackoverflow.com/a/15868720
    tables = [ ...new Set(tables) ];

    // remove duplicated FTS searches
    // const fts = tables.filter(c => c.substring(0, 6) === 'JOIN v');
    // if (fts.length > 1) {
    //     tables = tables.filter(e => e.substring(0, 16) !== 'JOIN vtreatments');
    // }

    return tables;
}

const getConstraints = ({ resource, params }) => {

    /*
     * The WHERE clause can have constraints because of 
     * the columns specified in the SELECT clause OR
     * because of the constraints specifed in the params. 
     * The latter is more common but first we cover the 
     * SELECT columns. Note, these constraints won't be 
     * reflected in 'runparams'
     */
    let constraints = [];    
    const runparams = {};

    /*
     * If resourceId exists in params, we don't need to 
     * calculate any further constraints
     */
    const resourceId = ddUtils.getResourceid(resource);
    
    if (resourceId.name in params) {
        let selname;
        if (resourceId.alias) {
            if (resourceId.alias.select) {
                selname = resourceId.alias.select;
            }
        }

        constraints.push(`${selname} = '${params[resourceId.name]}'`);
        runparams[resourceId.name] = params[resourceId.name];

        return { constraints, runparams }
    }

    const notCols = ddUtils.getNotCols();

    // If we reached here, more constraints are needed
    Object.keys(params)
        .filter(p => !notCols.includes(p))
        .forEach(p => {
            const { constraint, runparam } = _getConstraint(resource, p, params[p]);
            
            /*
            * for every k,v pair, an array of constraints is returned.
            * most of the times this array contains only one constraint
            * (hence singular) but sometimes it can contain more than 
            * one constraint for one k,v pair. We flatten the array and 
            * push it in the main constraints array
            */
            constraints.push(...constraint);

            /*
            * we do the same for the runparam for each k,v pair
            * adding it to the main runparams object
            */
            for (let [key, val] of Object.entries(runparam)) {
                runparams[key] = val;
            }
        });

    // remove duplicates from constraints
    // https://stackoverflow.com/a/15868720
    constraints = [...new Set(constraints)];
    
    // remove duplicated FTS searches
    // const fts = constraints.filter(c => c.search(/MATCH/) > -1);
    // if (fts.length > 1) {
    //     constraints = constraints.filter(e => e.substring(0, 11) !== 'vtreatments');
    // }

    return {
        constraints,
        runparams
    }
}

const getSortOrder = (params) => {
    if ('sortby' in params) {
        return params.sortby.split(',').map(o => {
            o = o.trim();
            const arr = o.split(/:/);
            if (arr) return [`${arr[0]} ${arr[1].toUpperCase()}`];
        })
    }
}

const getLimitAndOffset = (params) => {
    return {
        limit: params.size,
        offset: ((params.page - 1) * params.size)
    }
}

module.exports = {
    validate,
    formatDate,
    getColumns,
    getTables,
    getConstraints,
    getSortOrder,
    getLimitAndOffset
}