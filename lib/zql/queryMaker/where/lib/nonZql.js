import { queryCache, _zops } from "../../utils.js";

export const nonZql = (resource, key, val, col) => {
    //console.log(resource, key, val, col)
    
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
    const constraint = {};
    const runparams = {};

    const operator = _zops[zop];
    const left = col.where;
    const right = val.toLowerCase();

    if (zop === 'eq') {
        constraint.bind = `${left} ${operator} @${key}`;
        constraint.vals = `${left} ${operator} ${right}`;
        runparams[key] = right;
    }
    else if (zop === 'match') {
        
        constraint.bind = `${left} ${operator} @${key}`;
        constraint.vals = `${left} ${operator} ${val}`;
        runparams[key] = val;
        runparams.cssClass = 'hilite';
        runparams.sides = 50;
    }
    else {
        constraint.bind = `Lower(${left}) ${operator} @${key}`;

        if (zop === 'like') {
            runparams[key] = right;
        }
        else if (zop === 'starts_with') {
            runparams[key] = `${right}%`;
        }
        else if (zop === 'ends_with') {
            runparams[key] = `%${right}`;
        }
        else if (zop === 'contains') {
            runparams[key] = `%${right}%`;
        }

        constraint.vals = `Lower(${left}) ${operator} ${r[key]}`;
    }

    return { constraint, runparams }
}