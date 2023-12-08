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

export const mainQueries = ({ resource, params }) => {
    //console.log(params)
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
    // if params has nothing other than the following keys, then we don't need
    // to calculate the constraints.
    //
    const nonSqlCols = [
        'cols',
        'facets',
        'page',
        'refreshCache',
        'relatedRecords',
        'size',
        'sortby',
        'stats',
        'termFreq'
    ];

    const pKeys = Object.keys(params).sort();
    
    // compare two arrays
    // https://stackoverflow.com/a/19746771/183692
    const cond = nonSqlCols.length === pKeys.length && nonSqlCols.every((value, index) => value === pKeys[index]);
    
    
    if (cond) {
        //console.log(11)
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
        //console.log(22)
        const { constraints, runparams } = getWhere({ resource, params });
        queries.runparams = runparams;
    
        countQueryMaker.constraints = constraints ? constraints.bind : null;
        queries.count = getCountSql(countQueryMaker);
    
        if (resourceIdName in params) {
            console.log(33)
            // we run the full query with constraints but without sortorder or 
            // groupby
            fullQueryMaker.constraints = constraints ? constraints.bind : null; 
            queries.full = getFullSql(fullQueryMaker);
        
        }
        else if (!('cols' in params)) {
            //console.log(44)
            // only count query with required constraints that has already  
            // run above
        }
        else if ('cols' in params) {
            //console.log(55)
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

    return queries;
}