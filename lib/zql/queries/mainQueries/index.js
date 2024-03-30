import { 
    getSelect, 
    getFrom, 
    getWhere,
    getGroupBy, 
    getOrderBy,
    getLimitAndOffset,
    getCountSql,
    getFullSql,
    getDropTmpSql,
    getCreateTmpSql,
    getYearlyCountsSql
} from '../../queryMaker/index.js';
//import { yearlyCounts } from '../../queries/index.js';
import { ddutils } from '../../../../data-dictionary/utils/index.js';


const isBareQuery = (params) => {
    
    //
    // A query is a bare query if only non-sql cols are present in the params.
    // (The two arrays have to be sorted to compare them)
    //
    // code for comparing two arrays 
    // https://stackoverflow.com/a/19746771/183692
    //
    const nonSqlCols = ddutils.getNotCols().sort();
    const paramKeys = Object.keys(params).sort();
    
    return nonSqlCols.length === paramKeys.length && 
        nonSqlCols.every((value, index) => value === paramKeys[index]);
}

const isResourceIdQuery = ({ resource, params }) => {
    const { name } = ddutils.getResourceId(resource);
    return name in params;
}

const isCountQuery = (params) => {
    return (!('cols' in params));
}

export const mainQueries = ({ resource, params }) => {
    const queries = {};

    // console.log(`bare: ${isBareQuery(params)}`);
    // console.log(`resourceId: ${isResourceIdQuery({ resource, params })}`);
    // console.log(`count: ${isCountQuery(params)}`);
    //
    // 1. When there are no params specified as below
    //    treatments
    //
    if (isBareQuery(params)) {

        //
        // We don't need to calculate the constraints in this case so runparams 
        // is empty
        queries.runparams = {};
        
        // We need the following queries:
        //   dropTmp
        queries.dropTmp = getDropTmpSql();

        //   createTmp
        const columns = getSelect({ resource, params });
        const tables = getFrom({ resource, params });
        const sortorder = getOrderBy({ resource, params });
        const groupby = getGroupBy({ resource, params });
        const { limit, offset } = getLimitAndOffset({ resource, params });
        queries.createTmp = getCreateTmpSql({ 
            columns, 
            tables,
            sortorder,
            groupby,
            limit,
            offset
        });

        //   count
        queries.count = getCountSql({ columns, tables });

        //   full
        queries.full = getFullSql({ sortorder });

        // if yearlyCounts
        //   yearly Treatments
        //   yearly Species
        //   yearly Articles
        //   yearly Journals
        // if (params.yearlyCounts) {
        //     queries.yearlyCounts = getYearlyCountsSql();
        // }
    }

    //
    // 2. When a resourceId is specified
    //    treatments?treatmentId=XXXXXX
    //
    else if (isResourceIdQuery({ resource, params })) {
        const { constraintsObj, runparams } = getWhere({ resource, params });
        queries.runparams = runparams;

        const columns = getSelect({ resource, params });
        const tables = getFrom({ resource, params });

        // Since only one record will be returned, we don't need a count query
        // or yearlyCounts queries as they make no sense. We only need:
        //   full
        //
        // In this case the constraint is as simple as 
        //    resourceId = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
        //
        const constraints = constraintsObj 
            ? constraintsObj.bind 
            : null;

        const sortorder = getOrderBy({ resource, params });
        queries.full = getFullSql({ columns, tables, constraints, sortorder });
    }

    //
    // 3. When there are specifically no cols requested
    //    treatments?cols=
    //
    else if (isCountQuery(params)) {
        const { constraintsObj, runparams } = getWhere({ resource, params });
        queries.runparams = runparams;
        const constraints = constraintsObj 
            ? constraintsObj.bind 
            : null;

        // if yearlyCounts
        //   dropTmp
        //   createTmp
        //   count
        //   yearly Treatments
        //   yearly Species
        //   yearly Articles
        //   yearly Journals
        if (params.yearlyCounts) {

            // DROP TEMP TABLE tmp
            queries.dropTmp = getDropTmpSql();

            // CREATE TEMP TABLE tmp 
            const columns = getSelect({ resource, params });
            const tables = getFrom({ resource, params });
            queries.createTmp = getCreateTmpSql({ 
                columns, tables, constraints 
            });

            queries.count = getCountSql({ columns, tables });
            //queries.yearlyCounts = getYearlyCountsSql();
        }

        // if no yearlyCounts
        //   count
        else {
            const columns = getSelect({ resource, params });
            const tables = getFrom({ resource, params });
            queries.count = getCountSql({ columns, tables, constraints });
        }
    }

    // 4. All other queries, for example, select specified cols of images for a 
    //    given constraint
    //
    //    images?family=Formicidae&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption
    else {
        const { constraintsObj, runparams } = getWhere({ resource, params });
        queries.runparams = runparams;
        const constraints = constraintsObj 
            ? constraintsObj.bind 
            : null;

        // We need the following queries:
        //   dropTmp
        //   createTmp
        //   count
        //   full

        // DROP TEMP TABLE tmp
        queries.dropTmp = getDropTmpSql();

        // CREATE TEMP TABLE tmp 
        const columns = getSelect({ resource, params });
        const tables = getFrom({ resource, params });
        const sortorder = getOrderBy({ resource, params });
        const groupby = getGroupBy({ resource, params });
        const { limit, offset } = getLimitAndOffset({ resource, params });

        queries.createTmp = getCreateTmpSql({ 
            columns, 
            tables, 
            constraints,
            sortorder,
            groupby,
            limit, 
            offset
        });

        queries.count = getCountSql({ columns });
        queries.full = getFullSql({ sortorder });

        // if yearlyCounts
        //   yearly Treatments
        //   yearly Species
        //   yearly Articles
        //   yearly Journals
        // if (params.yearlyCounts) {
        //     queries.yearlyCounts = getYearlyCountsSql();
        // }
    }

    return queries;
}