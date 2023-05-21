import { queryCache, _zops } from "../../utils.js";

export const nonZql = (resource, key, val, col) => {
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

        constraint.vals = `Lower(${left}) ${operator} ${runparams[key]}`;
    }

    return { constraint, runparams }
}