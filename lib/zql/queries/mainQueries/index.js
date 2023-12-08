import { 
    getSelect, 
    getFrom, 
    getWhere,
    getGroupBy, 
    getOrderBy,
    getLimitAndOffset,
    getCountSql,
    getFullSql
} from '../../queryMaker/index.js';
import { ddutils } from '../../../../data-dictionary/utils/index.js';

export const mainQueries = ({ resource, params, origParams }) => {
    const columns = getSelect({ resource, params });
    const tables = getFrom({ resource, params });
    const { resourceId, resourceIdName } = ddutils.getResourceId(resource);
    const queries = {};
    
    const countQueryMaker = {
        columns,
        tables
    };

    const fullQueryMaker = {
        columns,
        tables
    };

    //
    // if origParams doesn't exist then the count and default query without
    // and constraints should be run. If there are no keys in origParams, it 
    // is an empty object (effectively doesn't exist)
    //
    if (!Object.keys(origParams).length) {
        queries.runparams = {};
    
        // count query with no constraints and no further clauses
        queries.count = getCountSql(countQueryMaker);
    
        // full query without constraints but with sortorder and limit
        fullQueryMaker.sortorder = getOrderBy({ resource, params });
        fullQueryMaker.groupby = getGroupBy({ resource, params });
        const { limit, offset } = getLimitAndOffset({ resource, params });
        fullQueryMaker.limit = limit;
        fullQueryMaker.offset = offset;
        queries.full = getFullSql(fullQueryMaker);
    }
    else {
        const { constraints, runparams } = getWhere({ resource, params });
        queries.runparams = runparams;
    
        countQueryMaker.constraints = constraints ? constraints.bind : null;
        queries.count = getCountSql(countQueryMaker);
    
        if (resourceIdName in params) {
            
            // we run the full query with constraints but without sortorder or 
            // groupby
            fullQueryMaker.constraints = constraints ? constraints.bind : null; 
            queries.full = getFullSql(fullQueryMaker);
        
        }
        else if ('cols' in origParams && origParams.cols === '') {
            
            // only count query with required constraints that has already  
            // run above
            
        }
        else if ('cols' in params) {
        
            // full query with all the clauses
            fullQueryMaker.constraints = constraints ? constraints.bind : null; 
            fullQueryMaker.sortorder = getOrderBy({ resource, params });
            fullQueryMaker.groupby = getGroupBy({ resource, params });
            const { limit, offset } = getLimitAndOffset({ resource, params });
            fullQueryMaker.limit = limit;
            fullQueryMaker.offset = offset;
            queries.full = getFullSql(fullQueryMaker);
        }
    }
    
    // if (!Object.keys(origParams).length) {
        
    //     queries.runparams = {};

    //     // count query with no constraints and no further clauses
    //     queries.count = getCountSql(countQueryMaker);

    //     // full query without constraints but with sortorder and limit
    //     fullQueryMaker.sortorder = getOrderBy({ resource, params });
    //     fullQueryMaker.groupby = getGroupBy({ resource, params });
    //     const { limit, offset } = getLimitAndOffset({ resource, params });
    //     fullQueryMaker.limit = limit;
    //     fullQueryMaker.offset = offset;
    //     queries.full = getFullSql(fullQueryMaker);
    // }
    // else if (resourceIdName in params) {
        
    //     const { constraints, runparams } = getWhere({ resource, params });
    //     queries.runparams = runparams;
    //     countQueryMaker.constraints = constraints ? constraints.bind : null;
    //     queries.count = getCountSql(countQueryMaker);

    //     // we run the full query without sortorder or groupby
    //     fullQueryMaker.constraints = constraints ? constraints.bind : null; 
    //     queries.full = getFullSql(fullQueryMaker);

    // }
    // else if ('cols' in origParams && origParams.cols === '') {
        
    //     const { constraints, runparams } = getWhere({ resource, params });
    //     queries.runparams = runparams;

    //     // only count query with required constraints
    //     countQueryMaker.constraints = constraints ? constraints.bind : null;
    //     queries.count = getCountSql(countQueryMaker);
    // }
    // else if ('cols' in params) {
        
    //     const { constraints, runparams } = getWhere({ resource, params });
    //     queries.runparams = runparams;

    //     // count query with required constraints
    //     countQueryMaker.constraints = constraints ? constraints.bind : null;
    //     queries.count = getCountSql(countQueryMaker);

    //     // full query with all the clauses
    //     fullQueryMaker.constraints = constraints ? constraints.bind : null; 
    //     fullQueryMaker.sortorder = getOrderBy({ resource, params });
    //     fullQueryMaker.groupby = getGroupBy({ resource, params });
    //     const { limit, offset } = getLimitAndOffset({ resource, params });
    //     fullQueryMaker.limit = limit;
    //     fullQueryMaker.offset = offset;
    //     queries.full = getFullSql(fullQueryMaker);
    // }

    // 
    // get dashboard stats only if explicitly requested *and* the resource is 
    // treatments
    // 
    // if (params.stats && resource === 'treatments') {
    //     queries.stats = statsQueries({ 
    //         tables, 
    //         constraints: constraints.bind 
    //     });
    // }

    return queries;
}