import { queryCache, _zops } from "../../utils.js";

export const nonZql = (resource, resourceParams, key, val, col) => {
    const zop = queryCache(resource, resourceParams)[key];
    const constraint = {};
    const runparams = {};

    const operator = _zops[zop];
    const left = col.where;

    if (zop === 'eq') {
        const right = val;
        constraint.bind = `${left} ${operator} @${key}`;
        constraint.vals = `${left} ${operator} ${right}`;
        runparams[key] = right;
    }
    else if (zop === 'match') {
        const right = val.toLowerCase();
        constraint.bind = `${left} ${operator} @${key}`;
        constraint.vals = `${left} ${operator} ${right}`;
        runparams[key] = right;
        runparams.cssClass = 'hilite';
        runparams.sides = 50;
    }
    else {
        constraint.bind = `${left} ${operator} @${key}`;
        const right = val.toLowerCase();

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

        constraint.vals = `Lower(${left}) ${operator} ${runparams[key]}`;
    }

    return { constraint, runparams }
}