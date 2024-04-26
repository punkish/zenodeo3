import { 
    getSelect, 
    getFrom, 
    getWhere,
    getGroupBy, 
    getOrderBy,
    getLimitAndOffset,

    getCountSqlNormal,
    getFullSqlNormal,

    getCountSqlBare,
    getFullSqlBare,

    getFullSqlResourceId,

    getCountSqlWithConstraints,
    getCountSqlWithoutConstraints,

    getDropTmpSql,
    getCreateTmpSql
} from '../../queryMaker/index.js';
// import { getQueryType } from '../../z-utils.js';
// import { ddutils } from "../../../../data-dictionary/utils/index-ng.js";

export const mainQueries = ({ 
    resource, params, resourceParams, queryType, resourceId
}) => {
    const queries = {
        runparams: false,
        dropTmp: false,
        createTmp: false,
        createIndex: false,
        count: false,
        full: false,
        yearlyCounts: false
    };

    let cols = false;
    let tables = false;
    let constraints = false;
    let groupby = false;
    let sortorder = false;
    let limit = false;
    let offset = false;

    // const resourceId = resourceParams
    //     .filter(col => col.isResourceId)[0];

    // const queryType = getQueryType({ resource, params, resourceId });

    // url: http://../treatments
    //
    // A bare query has only the resource in the URL. As such, 30 rows of a set 
    // of pre-defined columns (defaults) is sent back sorted by the resourceId
    // along with the count. While both count and full queries are required
    // alongwith the optional yearlyCounts query, creating a TEMP table would 
    // take a long time because the entire table will be copied. So the 
    // following queries are created, all of them without any constraints
    //
    //  - count
    //  - full
    //  - yearlyCounts
    //
    if (queryType === 'bare') {
        const tables = getFrom({ resource, params, resourceParams });
        queries.count = getCountSqlBare({ tables });

        const { limit, offset } = getLimitAndOffset({ resource, params });

        queries.full = getFullSqlBare({
            cols: getSelect({ 
                resource, params, resourceParams, resourceId, queryType 
            }),
            tables,
            sortorder: getOrderBy({ resource, params }),
            limit,
            offset
        });
    }

    // http://../treatments?treatmentId=XXXXXX
    //
    // A resourceId query is special because only one record will be returned. 
    // So we don't need a count query because count is going to be 1. We also 
    // don't need yearlyCounts queries as they make no sense. Since only a full 
    // query is required (which will return only one row), we don't need to 
    // create a temp table.
    //
    else if (queryType === 'resourceId') {
        const constraints_runparams = getWhere({ 
            resource, 
            params,  
            resourceParams, 
            resourceId 
        });

        queries.runparams = constraints_runparams.runparams;
        
        queries.full = getFullSqlResourceId({
            cols: getSelect({ 
                resource, params, resourceParams, resourceId, queryType 
            }),
            tables: getFrom({ resource, params, resourceParams }),
            constraints: constraints_runparams.constraints
        });
    }

    // http://../treatments?cols=&q=agosti
    //
    // Count queries return only the count (no other column)
    //
    else if (queryType === 'count') {
    
        // But such queries can be with or without any constraints. So we find 
        // out if there are any constraints
        const constraints_runparams = getWhere({ 
            resource, params, resourceParams, resourceId 
        });

        // WITH constraint
        // http://../treatments?cols=&q=agosti
        //
        if (constraints_runparams.constraints.length) {
            const constraints = constraints_runparams.constraints;
            queries.runparams = constraints_runparams.runparams;
            const tables = getFrom({ resource, params, resourceParams });

            if (tables.length > 1) {
                queries.count = getCountSqlWithConstraints({ 
                    resourceId: resourceId.selname, 
                    tables, 
                    constraints 
                });
            }
            else {
                queries.count = getCountSqlWithConstraints({ 
                    tables, 
                    constraints 
                });
            }
        }

        // NO constraint
        // http://../treatments?cols=
        //
        else {
            const tables = getFrom({ resource, params, resourceParams });
            queries.count = getCountSqlWithoutConstraints({ tables });
        }
        
    }

    // http://../treatments?q=agosti
    //
    // A normal query is one where a constraint is provided and, optionally, 
    // cols to be returned are specified. If no cols are specified then default
    // cols are returned. Both count and full queries are always required. If  
    // the optional yearlyCounts is also required, we are better off creating 
    // a TEMP table.
    //
    else if (queryType === 'normal') {

        tables = getFrom({ resource, params, resourceParams });

        const constraints_runparams = getWhere({ 
            resource, 
            params, 
            resourceParams, 
            resourceId 
        });

        if (constraints_runparams.constraints.length) {
            constraints = constraints_runparams.constraints;
            queries.runparams = constraints_runparams.runparams;
        }

        groupby = getGroupBy({ resource, params });
        sortorder = getOrderBy({ resource, params });

        const limit_offset = getLimitAndOffset({ resource, params });
        limit = limit_offset.limit;
        offset = limit_offset.offset;

        if (params.yearlyCounts) {

            // Queries:
            //
            // - dropTmp
            // - createTmp
            // - count
            // - full
            // - yearlyCounts
            queries.dropTmp = getDropTmpSql();

            cols = getSelect({ 
                resource, 
                params, 
                resourceParams, 
                resourceId,
                queryType
            });

            queries.createTmp = getCreateTmpSql({
                cols,
                tables,
                constraints,
                groupby,
                sortorder
            });

            queries.createIndex = 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)';

            if (tables.length > 1) {
                queries.count = getCountSqlNormal({ 
                    resourceId: resourceId.name 
                });
            }
            else {
                queries.count = getCountSqlNormal({});
            }
            
            const limit_offset = getLimitAndOffset({ resource, params });
            limit = limit_offset.limit;
            offset = limit_offset.offset;
            queries.full = getFullSqlNormal({ limit, offset });
        }
        else {

            // Queries:
            //
            // - count
            // - full
            queries.count = getCountSqlNormal({
                tables,
                constraints,
                resourceId: resourceId.selname
            });

            cols = getSelect({ 
                resource, 
                params, 
                resourceParams, 
                resourceId,
                queryType: ''
            });
    
            queries.full = getFullSqlNormal({
                cols,
                tables,
                constraints,
                groupby,
                sortorder,
                limit, 
                offset
            });
        }
    
        
    }

    return queries;
}