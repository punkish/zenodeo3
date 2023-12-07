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
    //console.log(params)
    const columns = getSelect({ resource, params });
    const tables = getFrom({ resource, params });
    // let constraints;
    // let runparams;

    // if (params.cols) {
    //     const res = getWhere({ resource, params });
    //     constraints = res.constraints;
    //     runparams = res.runparams;
    // }

    
    const queries = {};
    

    // 
    // count sql is always created, and we don't need sortorder and limit for 
    // it.
    // 
    // queries.count = getCountSql({
    //     columns, 
    //     tables, 
    //     //constraints: constraints ? constraints.bind : null
    // });

    const countQueryMaker = {
        columns,
        tables
    };

    const fullQueryMaker = {
        columns,
        tables
    };

    // 
    // 'cols' can be specified explicitly with an empty value
    // to force only a count SQL. So we check 'cols' and 
    // return fullSql **only** if 'cols' is not empty
    // 
    if (origParams.cols) {
        
        const { constraints, runparams } = getWhere({ resource, params });
        countQueryMaker.constraints = constraints ? constraints.bind : null;
        queries.runparams = runparams;

        // 
        // if resourceId exists in params – for example,
        // `treatmentId=000040332F2853C295734E7BD4190F05` – 
        // only one record is going to be returned from the 
        // query, so we don't need sortorder, limit and offset 
        // because they make no sense
        // 
        
        // const obj = {
        //     columns, 
        //     tables, 
        //     constraints: constraints.bind 
        // }
        fullQueryMaker.constraints = constraints ? constraints.bind : null;

        

        
    }


    // 
    // resourceId is not in the params, so we need sortorder, limit and 
    // offset
    // 
    const { resourceId, resourceIdName } = ddutils.getResourceId(resource);
    
    if (!(resourceIdName in params)) {
        fullQueryMaker.sortorder = getOrderBy({ resource, params });
        fullQueryMaker.groupby = getGroupBy({ resource, params });
        const { limit, offset } = getLimitAndOffset({ resource, params });
        fullQueryMaker.limit = limit;
        fullQueryMaker.offset = offset;
    }

    queries.count = getCountSql(countQueryMaker);
    queries.full = getFullSql(fullQueryMaker);

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