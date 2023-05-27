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
    // let constraints;
    // let runparams;

    // if (params.cols) {
    //     const res = getWhere({ resource, params });
    //     constraints = res.constraints;
    //     runparams = res.runparams;
    // }

    const { constraints, runparams } = getWhere({ resource, params });

    const queries = { runparams };

    // 
    // count sql is always created, and we don't need sortorder and limit for 
    // it.
    // 
    queries.count = getCountSql({
        columns, 
        tables, 
        constraints: constraints ? constraints.bind : null
    });

    // 
    // 'cols' can be specified explicitly with an empty value
    // to force only a count SQL. So we check 'cols' and 
    // return fullSql **only** if 'cols' is not empty
    // 
    if (params.cols) {

        // 
        // if resourceId exists in params – for example,
        // `treatmentId=000040332F2853C295734E7BD4190F05` – 
        // only one record is going to be returned from the 
        // query, so we don't need sortorder, limit and offset 
        // because they make no sense
        // 
        const { resourceId, resourceIdName } = ddutils.getResourceId(resource);
        const obj = {
            columns, 
            tables, 
            constraints: constraints.bind 
        }

        // 
        // resourceId is not in the params, so we need sortorder, limit and 
        // offset
        // 
        if (!(resourceIdName in params)) {
            obj.sortorder = getOrderBy({ resource, params });
            obj.groupby = getGroupBy({ resource, params });
            const { limit, offset } = getLimitAndOffset({ resource, params });
            obj.limit = limit;
            obj.offset = offset;
        }

        queries.full = getFullSql(obj);
    }

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