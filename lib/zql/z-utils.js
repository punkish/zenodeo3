'use strict'

import * as utils from '../utils.js';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;

// see https://ajv.js.org/packages/ajv-errors.html
import Ajv from 'ajv';
const ajv = new Ajv(config.ajv.opts);

import * as turf from '@turf/turf'
import { dispatch as ddutils } from '../../data-dictionary/dd-utils.js';

// map zop to sql operator
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
};

// check if the submitted params conform to the schema
const validate = function({ resource, params }) {
    const schema = {
        type: 'object',
        additionalProperties: false,
        properties: ddutils.getQueryStringSchema(resource)
    };
    
    const validator = ajv.compile(schema);
    const valid = validator(params);

    if (valid) {
        return params;
    }
    
    // validation failed
    console.error('😩 validation failed')
    console.error(validator.errors);
    return false;
}

const formatDate = (date) => {
    let yyyy;
    let mm;
    let dd;

    if (date === 'yesterday') {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        yyyy = date.getUTCFullYear();
        mm = date.getUTCMonth() + 1;
        dd = date.getUTCDate();
    }
    else {
        [ yyyy, mm, dd ] = date.split('-');
    }

    if (parseInt(mm) < 10) {
        mm = mm.toString().padStart(2, '0');
    }

    if (parseInt(dd) < 10) {
        dd = dd.toString().padStart(2, '0');
    }

    return `${yyyy}-${mm}-${dd}`;
}

const castanet = (input) => `CAST(strftime('%s', ${input}) AS INT)`;

/***
 *   The queryString is made up of key-value pairs separated by '&'
 *   Within each pair, the key and the value are separated by '='
 *
 *   Two kinds of patterns are possible
 *       <key> = <value>
 *       <key> = <zql>(<value>)
 *
 *   1. Convert queryString into an object of k,v pairs
 *   2. evaluate each k,v pair
 *       - convert key to 'left' by using getWhere()
 *       - evaluate value to see if it contains a ZQL operator (zop)
 *           - yes:
 *               - convert zop to operator
 *               - convert value to 'right'
 *           - no:
 *               - find default operator
 *               - convert value to 'right'
**/
const _getConstraint = (resource, key, val) => {
    let constraint = "";
    const runparams = {};

    /**
     * The val (right side of the k,v pair) is either -
     *      a string: foo=bar
     *      or a boolean: foo=true
     *      or a number: foo=42
     * 
     * ZQL operators are only present in strings.
    **/
    if (typeof(val) === 'string') {
        
        /**
         * first, lets check if there is an ZQL operator in the val 
        **/ 
        const zqltype = ddutils.getZqltype(resource, key);

        if (zqltype) {
            const pattern = utils.getPattern(zqltype);
            const res = val.match(pattern);
            
            if (res) {
                
                const g = res.groups;
                const zop = g.operator1 || g.operator2 || g.operator;
                const operator = zops[zop];
                
                if (key === 'geolocation') {
                    constraint = isGeolocation(zop, g, runparams, operator);
                }
                else {
                    if (zqltype === 'date') {
                        constraint = isDate(resource, key, zop, g, runparams, operator);
                        
                        /**
                         *   convert Object null prototype to regular Object
                         *   https://stackoverflow.com/questions/56298481/how-to-fix-object-null-prototype-title-product#comment111312577_60333849
                         *   runparams = { ...g }
                        **/
                    }
                    else if (zqltype === 'text') {
                        constraint = isText(resource, key, zop, g, operator, runparams);
                    }
                }
            }

            /**
             *   no ZQL operator was found, so let's try to determine a 
             *   nonzql constraint
            **/
            else {
                const { c, r } = nonZqlConstraint(resource, key, val);
                constraint = c;

                for (let [key, val] of Object.entries(r)) {
                    runparams[key] = val;
                }
            }
        }

        /**
         * there is no zqltype, so we try to determine a nonzql constraint
        **/
        else {
            const { c, r } = nonZqlConstraint(resource, key, val);
            constraint = c;
                    
            for (let [key, val] of Object.entries(r)) {
                runparams[key] = val;
            }
        }
    }

    /**
     *   val is not a string, so it is either a boolean or a 
     *   number. It is going to be a straightforward left op right
     *   constraint
    **/
    else {
        if (typeof(val) === 'boolean') {
            constraint = isBoolean(resource, key, val);
        }
        else {
            const left = ddutils.getSelect(resource, key);
            const queryableParams = ddutils.getQueryableParams(resource)
        
            // https://stackoverflow.com/questions/19874555/how-do-i-convert-array-of-objects-into-one-object-in-javascript
            const _defaultOps = queryableParams
                .reduce((o, i) => Object.assign(
                        o, 
                        { [i.name]: i.defaultOp || 'eq' }
                    ), 
                    {}
                )
    
            const zop = _defaultOps[key];
            const operator = zops[zop];
        
            constraint = `${left} ${operator} @${key}`;
            runparams[key] = val;
        }
    }

    return { constraint, rp: runparams }
}

/**
 * in case of boolean, we add the val directly to the
 * constraint instead of adding a placeholder and 
 * including it in runparams
**/
const isBoolean = (resource, key, val) => {
    const left = ddutils.getSelect(resource, key);
    const right = val === true ? 1 : 0;
    return `${left} = ${right}`;
}

const isDate = (resource, key, zop, g, runparams, operator) => {
    const sqltype = ddutils.getSqltype(resource, key);
    const left = sqltype === 'INTEGER'
        ? ddutils.getWhere(resource, key)
        : castanet(ddutils.getWhere(resource, key));
    
    let constraint;

    if (zop === 'between') {                    
        constraint = `${left} ${operator} CAST(strftime('%s', @from) AS INT) * 1000 AND CAST(strftime('%s', @to) AS INT) * 1000`;
        runparams.from = formatDate(g.from);
        runparams.to = formatDate(g.to);
    }
    else if (zop === 'eq' || zop === 'since' || zop === 'until') {
        constraint = `${left} ${operator} CAST(strftime('%s', @date) AS INT) * 1000`;
        runparams.date = formatDate(g.date);
    }

    return constraint;
}

const isText = (resource, key, zop, g, operator, runparams) => {
    const left = `${ddutils.getWhere(resource, key)}`;
    const right = g.text.toLowerCase();

    if (zop === 'like') {
        runparams[key] = right
    }
    else if (zop === 'starts_with') {
        runparams[key] = `${right}%`
    }
    else if (zop === 'ends_with') {
        runparams[key] = `%${right}`
    }
    else if (zop === 'contains') {
        runparams[key] = `%${right}%`
    }
    else {
        runparams[key] = right
    }

    return `${left} ${operator} @${key}`;
}

const isGeolocation = (zop, g, runparams, operator) => {
    let coords;

    if (zop === 'within') {
        const radius = Number(g.radius) || 1;
        const units = g.units || 'kilometers';
        coords = [ Number(g.lng), Number(g.lat) ];
        const buffered = turf.buffer(
            turf.point(coords), 
            radius, 
            { units }
        );
        
        coords = turf.bbox(buffered);
    }
    else if (zop === 'contained_in') {
        coords = [ 
            g.min_lng, 
            g.min_lat, 
            g.max_lng, 
            g.max_lat
        ]
    }

    runparams.min_lng = Number(coords[0]);
    runparams.min_lat = Number(coords[1]);
    runparams.max_lng = Number(coords[2]);
    runparams.max_lat = Number(coords[3]);

    return `materialsCitations.latitude ${operator} @min_lat AND @max_lat AND materialsCitations.longitude ${operator} @min_lng AND @max_lng`;
}

const nonZqlConstraint = (resource, key, val) => {
    let c = '';
    let r = {};

    const queryableParams = ddutils.getQueryableParams(resource);
        
    // https://stackoverflow.com/questions/19874555/how-do-i-convert-array-of-objects-into-one-object-in-javascript
    const _defaultOps = queryableParams
        .reduce((o, i) => Object.assign(o, {[i.name]: i.defaultOp || 'eq'}), {});

    const zop = _defaultOps[key];
    const operator = zops[zop];

    let left = ddutils.getWhere(resource, key);

    if (zop === 'eq') {
        c = `${left} ${operator} @${key}`;
        r[key] = val;
    }
    else if (zop === 'match') {
        c = `${left} ${operator} @${key}`;
        r[key] = val;
    }
    else {
        left = `${left}`;
        const right = val.toLowerCase();
        
        c = `${left} ${operator} @${key}`;

        if (zop === 'like') {
            r[key] = right;
        }
        else if (zop === 'starts_with') {
            r[key] = `${right}%`;
        }
        else if (zop === 'ends_with') {
            r[key] = `%${right}`;
        }
        else if (zop === 'contains') {
            r[key] = `%${right}%`;
        }
    }

    return { c, r }
}

const getSelect = ({ resource, params }) => {
    const resourceId = ddutils.getResourceid(resource);
    const resourceIdName = resourceId.split('.')[1];

    // SELECT columns will always include the resourceId
    const columns = [ resourceId ];

    if (params.cols.length) {

        // and all other columns specified in 'cols'
        const tmp = params.cols

            // remove resourceId since it has already been included above
            .filter(col => col !== resourceIdName)

            // get selnames for the rest of the columns
            .map(col => ddutils.getSelect(resource, col));

        columns.push(...tmp);
    }
    else {
        columns.push(ddutils.getResourceid(resource))
    }

    return columns;
}

const getFrom = ({ resource, params }) => {

    /** 
     * FROM tables will always include the main resource table.
     * 
     * Important Note: for 'materialCitations' the table name 
     * is 'materialsCitations' (note the extra 's' after material)
    **/
    const tables = [ ddutils.tableFromResource(resource) ];
    
    /** 
     *   FROM tables may exist because of columns in the SELECT 
     *   clause or because of the constraints in the WHERE 
     *   clause.
    **/
    params.cols.forEach(col => {
        const t = ddutils.getJoin(resource, col, 'select');

        if (t) {
            tables.push(...t);
        }
    });

    const notCols = ddutils.getNotCols();

    Object.keys(params)
        .filter(p => !notCols.includes(p))
        .forEach(p => {
            
            /**
             *   Get any tables that may need to be in the FROM … JOIN clause
             *   for every parameter
            **/
            const t = ddutils.getJoin(resource, p, 'where');
            
            if (t) {
                tables.push(...t);
            }         
        })

    
    // remove duplicates from tables
    // https://stackoverflow.com/a/15868720
    return [ ...new Set(tables) ];
    
    // remove duplicated FTS searches
    // const fts = tables.filter(c => c.substring(0, 6) === 'JOIN v');
    // if (fts.length > 1) {
    //     tables = tables.filter(e => e.substring(0, 16) !== 'JOIN vtreatments');
    // }

    //return tables;
}

const getWhere = ({ resource, params }) => {
    let constraints = [];    
    const runparams = {};

    /**
     * If resourceId exists in params, we don't need to 
     * calculate any further constraints.
     * 
     * ddutils returns a fully-qualified resourceId prefixed
     * with the table name, so we split it and use just the 
     * name for comparing with the params
    **/
    const resourceId = ddutils.getResourceid(resource);
    const resourceIdName = resourceId.split('.')[1];
    
    if (resourceIdName in params) {
        constraints.push(`${resourceId} = @${resourceIdName}`);
        runparams[resourceIdName] = params[resourceIdName];
        return { constraints, runparams };
    }

    /**
     * If we reached here, more constraints are needed.
     * The WHERE clause has constraints because of 
     * the key-value pairs specifed in the params. But
     * some of the kv pairs are not SQL columns, for example,
     * page, size, refreshCache, etc. So we need to filter 
     * them out
    **/
    const notCols = ddutils.getNotCols();
    
    Object.keys(params)
        .filter(param => !notCols.includes(param))
        .forEach(param => {
            const key = param;
            const val = params[param];
            
            /**
             * for every k,v pair, a constraint <string> and 
             * runparams <object> are returned 
            **/
            const { constraint, rp } = _getConstraint(resource, key, val);
            
            constraints.push(constraint);

            /**
             * we do the same for the runparams for each k,v pair
             * adding it to the main runparams object
            **/
            for (let [key, val] of Object.entries(rp)) {
                runparams[key] = val;
            }
        });

    /** 
     * remove duplicates from constraints
     * https://stackoverflow.com/a/15868720
    **/
    constraints = [...new Set(constraints)];
    
    // remove duplicated FTS searches
    // const fts = constraints.filter(c => c.search(/MATCH/) > -1);
    // if (fts.length > 1) {
    //     constraints = constraints.filter(e => e.substring(0, 11) !== 'vtreatments');
    // }
    
    return { constraints, runparams }
}

const getOrderBy = (params) => {
    if ('sortby' in params) {
        return params.sortby.split(',').map(o => {
            o = o.trim();
            const arr = o.split(/:/);
            if (arr) {
                return [`${arr[0]} ${arr[1].toUpperCase()}`];
            }
        })
    }
}

const getLimitAndOffset = (params) => {
    return {
        limit: params.size,
        offset: (params.page - 1) * params.size
    }
}

export {
    validate,
    formatDate,
    getSelect,
    getFrom,
    getWhere,
    getOrderBy,
    getLimitAndOffset
}