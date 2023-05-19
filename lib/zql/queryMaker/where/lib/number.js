import { queryCache, _zops } from "../../utils.js";

export const number = (resource, key, val, col) => {
    const left = col.selname;
    const zop = queryCache(resource)[key];
    const operator = _zops[zop];
    const constraint = {
        bind: `${left} ${operator} @${key}`,
        vals: `${left} ${operator} ${val}`
    };
    
    const runparams = {};
    runparams[key] = val;
    return { constraint, runparams }
 }