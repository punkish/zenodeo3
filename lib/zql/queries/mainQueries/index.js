import * as zu from '../../z-utils.js';
import { getSql } from '../../queryMaker/index.js';
import { ddutils } from '../../../../data-dictionary/utils/index.js';

export const mainQueries = ({ resource, params }) => {
    const columns = zu.getSelect({ resource, params });
    const tables = zu.getFrom({ resource, params });
    const { constraints, runparams } = zu.getWhere({ resource, params });

    const isFts = constraints
        .filter(constraint => constraint.indexOf('MATCH') > -1);

    // let t = tables;
    // if (!isFts.length) {
    //     t = tables.filter(table => table.indexOf('Fts') === -1);
    // }

    const queries = { runparams };

    /**
     * count sql is always created, and we don't 
     * need sortorder and limit for it
     */
    queries.count = getSql({ columns, tables, constraints }, 'count');

    /**
     * 'cols' can be specified explicitly with an empty value
     * to force only a count SQL. So we check 'cols' and 
     * return fullSql **only** if 'cols' is not empty
     */
    if (params.cols) {

        /**
         * if resourceId exists in params – for example,
         * `treatmentId=000040332F2853C295734E7BD4190F05` – 
         * only one record is going to be returned from the 
         * query, so we don't need sortorder, limit and offset 
         * because they make no sense
         */
        const { resourceId, resourceIdName } = ddutils.getResourceId(resource);
        const obj = {
            columns, 
            tables, 
            constraints
        }

        /**
         * resourceId is not in the params, so we need sortorder, 
         * limit and offset
         */
        if (!(resourceIdName in params)) {
            obj.sortorder = zu.getOrderBy({ resource, params });
            obj.groupby = zu.getGroupBy({ resource, params });
            const { limit, offset } = zu.getLimitAndOffset({ resource, params });
            obj.limit = limit;
            obj.offset = offset;
        }

        queries.full = getSql(obj, 'full');
    }

    /**
     * get dashboard stats only if explicitly requested *and*
     * the resource is treatments
     */
    if (params.stats && resource === 'treatments') {
        queries.stats = statsQueries({ tables, constraints });
    }

    return queries;
}