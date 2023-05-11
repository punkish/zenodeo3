import { ddu } from '../../../data-dictionary/utils/index.js';
import { text } from './lib/text.js';
import { year, date } from './lib/yeardate.js';
import { geolocation } from './lib/geolocation.js';
import * as utils from '../../utils.js';

const where = ({ resource, params }) => {
    
    const constraints = []; 
    const debug = [];   
    const runparams = {};
    
    //
    // We check if resourceId is included in the params. If it is,
    // we don't need to calculate any other constraints as resourceId
    // by itself is sufficient to conduct the query
    const resourceId = ddu.getResourceId(resource);

    if (resourceId.name in params) {
        constraints.push(`${resourceId.selname} = @${resourceId.name}`);
        debug.push(`${resourceId.selname} = '${params[resourceId.name]}'`);
        runparams[resourceId.name] = params[resourceId.name];
        return { constraints, debug, runparams };
    }

    //
    // If we reached here, more constraints are needed. The WHERE clause has 
    // constraints because of the key-value pairs specifed in the params. But
    // some of the kv pairs are not columns that can be used in SQL queries, 
    // for example, page, size, refreshCache, cols, etc. So we need to filter 
    // and retain only SQL-queryable columns
    const nonSqlQueryable = [
        'cols', 'refreshCache', 'facets', 'relatedRecords', 'stats', 'page', 
        'size', 'sortby'
    ];

    ddu.getParams(resource)
        .filter(col => {
            const isNotNonSQLQueryable = !nonSqlQueryable.includes(col.name);
            const isValidParam = Object.keys(params).includes(col.name);
            return isNotNonSQLQueryable && isValidParam;
        })
        .forEach(col => {
            const key = col.name;
            const val = params[key];

            // 
            // for every k,v pair, a constraint <string> and 
            // runparams <object> are returned 
            _getConstraint(resource, col, key, val, constraints, runparams);
        });

    //  
    // remove duplicates from constraints
    // https://stackoverflow.com/a/15868720
    const obj = {
        constraints: [...new Set(constraints)],
        debug,
        runparams
    }

    return obj
}

const _getConstraint = (resource, col, key, val, constraints, runparams) => {
    
    let constraint = '';
    const rp = {};

    // 
    // The val (right side of the k,v pair) is either -
    //      a string: foo=bar
    //      or a boolean: foo=true
    //      or a number: foo=42
    // 
    // ZQL operators are only present in strings.
    if (typeof(val) === 'string') {
        
        // 
        // first, lets check if there is an ZQL operator in the val 
        const zqltype = col.zqltype || 'text';

        if (zqltype) {
            const pattern = utils.getPattern(zqltype);
            const res = val.match(pattern);
            
            if (res) {
                const g = res.groups;
                const zop = g.operator1 || g.operator2 || g.operator;
                const operator = _zops[zop];
                
                if (key === 'geolocation') {
                    constraint = _isGeolocation(zop, g, rp, operator);
                }
                else {
                    if (zqltype === 'date') {
                        constraint = _isDate(resource, key, zop, g, rp, operator);
                        
                        //
                        //  convert Object null prototype to regular Object
                        //  https://stackoverflow.com/questions/56298481/how-to-fix-object-null-prototype-title-product#comment111312577_60333849
                        //  rp = { ...g }
                    }
                    else if (zqltype === 'text') {
                        constraint = _isText(resource, key, zop, g, operator, rp);
                    }
                }
            }

            //
            //  no ZQL operator was found, so let's try to determine a 
            //  nonzql constraint
            else {
                const { c, r } = _nonZqlConstraint(resource, key, val);
                constraint = c;

                for (let [key, val] of Object.entries(r)) {
                    rp[key] = val;
                }
            }
        }

        // 
        // there is no zqltype, so we try to determine a nonzql constraint
        else {
            const { c, r } = _nonZqlConstraint(resource, key, val, col);
            constraint = c;
                    
            for (let [key, val] of Object.entries(r)) {
                rp[key] = val;
            }
        }
    }

    //
    //  val is not a string, so it is either a boolean or a 
    //  number. It is going to be a straightforward left op right
    //  constraint
    else {
        if (typeof(val) === 'boolean') {
            constraint = _isBoolean(resource, key, val);
        }
        else {
            const left = col.selname;

            // if (!('_defaultOps' in cache)) {
            //     cache._defaultOps = {};
        
            //     if (!(resource in cache._defaultOps)) {
        
            //         const queryableParams = ddu.getParams(resource)
            //             .filter(p => !('notQueryable' in p));
        
            //         // https://stackoverflow.com/questions/19874555/how-do-i-convert-array-of-objects-into-one-object-in-javascript
            //         const _defaultOps = queryableParams
            //             .reduce((o, i) => Object.assign(o, {[i.name]: i.defaultOp || 'eq'}), {});
            //         cache._defaultOps[resource] = _defaultOps;
        
            //     }
        
            // }
            //const zop = cache._defaultOps[resource][key];

            const zop = queryCache(resource)[key];
            const operator = _zops[zop];
            constraint = `${left} ${operator} @${key}`;
            rp[key] = val;
        }
    }

    constraints.push(constraint);

    for (let [key, val] of Object.entries(rp)) {
        runparams[key] = val;
    }
}

// const res = getWhere({
//     resource: 'treatments',
//     params: {
//         treatmentId: 'foobar'
//     }
// });
// console.log(res);

export { where }