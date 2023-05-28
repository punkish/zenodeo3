import { text } from './lib/text.js';
import { year, date } from './lib/yeardate.js';
import { geolocation } from './lib/geolocation.js';
import { boolean } from './lib/boolean.js';
import { number } from './lib/number.js';
import { nonZql } from './lib/nonZql.js';
import * as utils from '../../../utils.js';

import { _zops, nonSqlQueryable } from "../utils.js";
import { ddutils } from "../../../../data-dictionary/utils/index.js";

export const getWhere = ({ resource, params }) => {
    
    const constraints = {
        vals: [],
        bind: []
    }; 
    const runparams = {};
    
    //
    // We check if resourceId is included in the params. If it is, we don't 
    // need to calculate any other constraints as resourceId by itself is 
    // sufficient to conduct the query
    //
    const resourceId = ddutils.getResourceId(resource);
    
    if (resourceId.name in params) {
        const left = resourceId.selname;
        const bind = resourceId.name;
        const vals = params[resourceId.name];
        constraints.bind.push(`${left} = @${bind}`);
        constraints.vals.push(`${left} = '${vals}'`);
        runparams[bind] = vals;
        return { constraints, runparams };
    }

    //
    // If we reached here, more constraints are needed. The WHERE clause has 
    // constraints because of the key-value pairs specifed in the params. 
    //
    ddutils.getParams(resource)

        //
        // But some of the kv pairs are not columns that can be used in SQL 
        // queries, for example, page, size, refreshCache, cols, etc. So we 
        // need to filter the out and retain only SQL-queryable columns
        //
        .filter(col => {
            const isSQLQueryable = !nonSqlQueryable.includes(col.name);
            const isValidParam = Object.keys(params).includes(col.name);
            return isSQLQueryable && isValidParam;
        })
        .forEach(col => {
            const val = params[col.name];

            // 
            // for every k,v pair, a constraint <string> and runparams <object> 
            // are returned 
            //
            const r = getConstraint(resource, col, val);
            constraints.bind.push(r.constraint.bind);
            constraints.vals.push(r.constraint.vals);

            for (let [key, val] of Object.entries(r.runparams)) {
                runparams[key] = val;
            }
        });

    //  
    // remove duplicates from constraints 
    // https://stackoverflow.com/a/15868720
    //
    return {
        constraints: {
            bind: [...new Set(constraints.bind)],
            vals: [...new Set(constraints.vals)]
        },
        runparams
    }
}

const getConstraint = (resource, col, val) => {
    
    let constraint = {};
    let runparams;

    //
    // key is the left side of the constraint
    //
    const key = col.name;

    // 
    // The val (right side of the k,v pair) is either -
    //      a string: foo=bar
    //      or a boolean: foo=true
    //      or a number: foo=42
    // 
    // ZQL operators are only present in strings.
    //
    if (typeof(val) === 'string') {
        
        // 
        // first, lets check if there is an ZQL operator in the val. Every col 
        // has a zqltype or defaults to text
        //
        const zqltype = col.zqltype || 'text';
        const pattern = utils.getPattern(zqltype);
        const res = val.match(pattern);
        
        if (res) {

            //
            // There was a match, so there could be zql present in the query. 
            // The only way to confirm that is to check if there is an operator 
            // in the match.groups.
            //
            const g = res.groups;
            
            if (g.operator || g.preglob || g.postglob || g.operator1 || g.operator2) {

                //
                // There is a zql operator(s) and an operand(s) in 
                // `res.groups`. So we construct the constraints based on the 
                // zqltype
                //
                if (zqltype) {
                    let r;

                    if (zqltype === 'geolocation') {
                        r = geolocation(g);
                    }
                    else if (zqltype === 'date') {
                        r = date(col, g);
                    }
                    else if (zqltype === 'year') {
                        r = year(col, g);
                    }
                    else if (zqltype === 'text') {
                        r = text(col, g);
                    }

                    constraint.bind = r.constraint.bind;
                    constraint.vals = r.constraint.vals;

                    runparams = r.runparams;
                }
                
                else {
                    const left = col.selname;
                    const zop = queryCache(resource)[key];
                    const operator = _zops[zop];

                    constraint.bind = `${left} ${operator} @${key}`;
                    constraint.vals = `${left} ${operator} ${val}`;

                    runparams = {};
                    runparams[key] = val;
                }
            }

            //
            // no ZQL operator was found, so let's try to determine a nonzql 
            // constraint
            //
            else {
                const r = nonZql(resource, key, val, col);

                constraint.bind = r.constraint.bind;
                constraint.vals = r.constraint.vals;

                runparams = {};

                for (let [key, val] of Object.entries(r.runparams)) {
                    runparams[key] = val;
                }
            }
        }

        
    }

    //
    // val is not a string, so it is either a boolean or a number. It is going 
    // to be a straightforward left op right constraint
    //
    else if (typeof(val) === 'boolean') {
        const r = boolean(val, col);

        constraint.bind = r.constraint.bind;
        constraint.vals = r.constraint.vals;

        runparams = r.runparams;
    }
    else if (typeof(val) === 'number') {
        const r = number(resource, key, val, col);

        constraint.bind = r.constraint.bind;
        constraint.vals = r.constraint.vals;
        
        runparams = r.runparams;
    }

    return { constraint, runparams }
}