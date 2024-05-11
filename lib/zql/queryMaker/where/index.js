import { boolean } from './lib/boolean.js';
import { number } from './lib/number.js';
import { datetime } from './lib/datetime.js';
import { text } from './lib/text.js';
import { geolocation } from './lib/geolocation.js';
import { nonZql } from './lib/nonZql.js';
import * as utils from '../../../utils.js';
import { _zops } from "../../z-utils/index.js";
import { ddutils } from "../../../../data-dictionary/utils/index.js";

const getWhere = ({ resource, params, resourceParams, resourceId }) => {
    
    // Constraints will be returned as an array of constraints that can be 
    // JOINed with ' AND '. Runparams will be returned as an object with 
    // key-val pairs that can feed directly into the prepared SQL
    //
    const constraints = [];
    let runparams = {};
    
    // We check if resourceId is included in the params. If it is, we don't 
    // need to calculate any other constraints as resourceId by itself is 
    // sufficient to conduct the query
    //
    if (resourceId) {
        const { name, selname } = resourceId;
    
        if (name in params) {
            const left = selname;
            const right = name;
            const operator = '=';
            const val = params[name];

            constraints.push(`${left} ${operator} @${right}`);
            runparams[right] = val;
            return { constraints, runparams };
        }
    }
    
    // If we reached here, more constraints are needed. The WHERE clause has 
    // constraints because of the key-val pairs specifed in the params. 
    //

    // Let's grab the non SQL cols such as page, size, refreshCache, cols, etc.
    // that we will filter out from the params
    //
    const nonSqlQueryable = ddutils.getNotCols();
    
    // We start with all the columns for the resource
    //
    resourceParams

        // Retain only SQL-queryable columns
        //
        .filter(col => !nonSqlQueryable.includes(col.name))

        // Retain only those params that are valid
        //
        .filter(col => Object.keys(params).includes(col.name))

        // Now we are left with only valid, queryable params. We can find the 
        // constraints and runparams for each of them.
        //
        .forEach(col => {
            const val = params[col.name];

            // for every k,v pair, a constraint <string> and runparams <object> 
            // are returned 
            //
            const res = getConstraint(resource, resourceParams, col, val);
            constraints.push(...res.constraint);

            // merge runparams
            // https://stackoverflow.com/a/171256/183692
            runparams = { ...runparams, ...res.runparams }
        });

    // remove duplicates from constraints 
    // https://stackoverflow.com/a/15868720
    //

    return {
        constraints,
        runparams
    }
}

const getConstraint = (resource, resourceParams, col, val) => {
    
    // Every col-val pair will have a single scalar constraint and an
    // object for runparams with one or more key-val pairs
    //
    const constraint = [];
    let runparams;

    // The val (right side of the k,v pair) is either -
    //      or a boolean: foo=true
    //      or a number: foo=42
    //      a string: foo=bar
    // 
    // ZQL operators are only present in strings.
    //
    if (typeof(val) === 'boolean') {
        const res = boolean({ col, val, operator: '=' });
        constraint.push(res.constraint);
        runparams = res.runparams;
    }
    else if (typeof(val) === 'number') {
        const operator = _zops[col.defaultOp];
        const res = number({ col, val, operator })
        constraint.push(res.constraint);
        runparams = res.runparams;
    }
    else if (typeof(val) === 'string') {
        
        // first, lets check if there is an ZQL operator in the val. Every col 
        // has a zqltype or defaults to text
        //
        const zqltype = col.zqltype || 'text';
        const pattern = utils.getPattern(zqltype);
        const res = val.match(pattern);

        if (res) {

            // There was a match, so there could be zql present in the query. 
            // The only way to confirm that is to check if there is an operator 
            // in the match.groups.
            //
            const g = res.groups;
            
            if (g.operator || g.preglob || g.postglob || g.operator1 || g.operator2) {

                // There is a zql operator(s) and an operand(s) in 
                // `res.groups`. So we construct the constraints based on the 
                // zqltype
                //
                let r;

                if (zqltype === 'geolocation') {
                    r = geolocation(g);
                    constraint.push(...r.constraint);
                }

                // publicationDate is stored as a string '2010-12-27'
                else if (zqltype === 'datetime') {
                    const zop = g.operator1 || g.operator2;
                    const operator = _zops[zop]; 
                    r = datetime({ col, val: g, operator });
                    constraint.push(r.constraint);
                }

                else if (zqltype === 'text') {
                    const zop = g.operator;
                    let globs;

                    if (g.preglob && g.postglob) {
                        globs = 'bothglobs';
                    }
                    else if (g.preglob) {
                        globs = 'preglob';
                    }
                    else if (g.postglob) {
                        globs = 'postglob';
                    }

                    const operator = zop || globs;
                    r = text({ col, val: g.operand, operator });

                    constraint.push(r.constraint);
                }

                runparams = r.runparams;
            }

            // no ZQL operator was found, so let's try to determine a nonzql 
            // constraint
            //
            else {
                const operator = _zops[col.defaultOp];
                const r = nonZql({ col, val, operator });
                
                constraint.push(r.constraint);
                runparams = {};

                for (const [key, val] of Object.entries(r.runparams)) {
                    runparams[key] = val;
                }
            }
        }
    }
    

    return { constraint, runparams }
}

export { getWhere }