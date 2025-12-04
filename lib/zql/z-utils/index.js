
// map zop to sql operator
const _zops = {

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
    '='           : 'LIKE',
    like          : 'LIKE',
    starts_with   : 'LIKE',
    ends_with     : 'LIKE',
    contains      : 'LIKE',
    not_like      : 'NOT LIKE',

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

const CACHE = {};

const queryCache = (resource) => {
    
    if (!('_defaultOps' in CACHE)) {
        
        CACHE._defaultOps = {};

        if (!(resource in CACHE._defaultOps)) {
            
            const queryableParams = ddutils.getParams(resource)
                 .filter(p => !('notQueryable' in p));

            // https://stackoverflow.com/questions/19874555/how-do-i-convert-array-of-objects-into-one-object-in-javascript
            const _defaultOps = queryableParams
                .reduce((o, i) => Object.assign(
                    o, 
                    {[i.name]: i.defaultOp || 'eq'}
                ), {});
            
            CACHE._defaultOps[resource] = _defaultOps;
        }

    }

    return CACHE._defaultOps[resource];
}

export { _zops, queryCache, formatSql }