import { 
    getSelect,
    getFrom,
    getWhere,
    getGroupBy,
    getLimitAndOffset,
    getOrderBy 
} from "../../queryMaker/index.js";
import { makeSql } from "./utils.js";

// http://../treatments?q=agosti
//
// A normal query is one where a constraint is provided and, optionally, 
// cols to be returned are specified. If no cols are specified then default
// cols are returned. Both count and full queries are always required. If  
// the optional yearlyCounts is also required, we are better off creating 
// a TEMP table.
export function normalQueries (resource, request) {
    const tables = getFrom(resource, request);
    const cols = getSelect(resource, request);
    const { constraints, runparams } = getWhere(resource, request);
    const groupby = getGroupBy(resource, request);
    const sortorder = getOrderBy(resource, request);
    const { limit, offset } = getLimitAndOffset(resource, request);

    if (request.query.yearlyCounts) {
        const dropTmp = `DROP TABLE IF EXISTS tmp`;
        const createTmp = getCreateTmpSql({
            cols,
            tables,
            constraints,
            groupby,
            sortorder
        });
        const createIndex = 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)';

        // If yearlyCounts are required, there will be a TEMP table tmp, and
        // we will get count from tmp
        const count = tables.length > 1
            ? getCountSqlNormalFromTmp({ tables: [ 'tmp' ], pk: cols[0] })
            : getCountSqlNormalFromTmp({ tables: [ 'tmp' ] });

        const full = getFullSqlNormal({ limit, offset });

        return {
            dropTmp,
            createTmp,
            createIndex,
            count,
            full,
            runparams
        }
    }
    else {
        const count = tables.length > 1
            ? getCountSqlNormalNoTmp({ tables, constraints, resourceId })
            : getCountSqlNormalNoTmp({ tables, constraints });
        
        const full = getFullSqlNormal({
            cols,
            tables,
            constraints,
            groupby,
            sortorder,
            limit, 
            offset
        });

        return {
            count,
            full,
            runparams
        }
    }
}

/**
 * Return a fully formed SQL statement for a full query.
 * @param {array} columns - an array of SELECT columns.
 * @param {array} tables - an array of FROM tables.
 * @param {array} constraints - an array of WHERE clauses.
 * @param {array} sortorder - an array of ORDER BY clauses.
 * @param {integer} limit - LIMIT clause.
 * @param {integer} offset - OFFSET clause.
 * @param {array} groupby - an array of GROUP BY clauses.
 * @param {array} having - an array of HAVING clauses.
 */
const getCreateTmpSql = ({
    cols,
    tables,
    constraints,
    groupby,
    sortorder
}) => {
    const sql = makeSql({ cols, tables, constraints, groupby, sortorder });
    return `CREATE TEMP TABLE tmp AS ${sql}`;
}

const getCountSqlNormalFromTmp = ({ tables, pk }) => {
    const cols = [];

    if (pk) {
        const [name, alias] = pk.split(' AS ');
        cols.push(`Count(DISTINCT ${alias}) AS num_of_records`);
    }
    else {
        cols.push('Count(*) AS num_of_records');
    }

    return makeSql({ cols, tables });
}

const getCountSqlNormalNoTmp = ({ tables, constraints, resourceId }) => {
    const cols = [];

    if (resourceId) {
        cols.push(`Count(DISTINCT ${resourceId.selname}) AS num_of_records`);
    }
    else {
        cols.push('Count(*) AS num_of_records');
    }
    
    // everything else is optional
    return makeSql({ cols, tables, constraints });
}

const getFullSqlNormal = ({ 
    cols=[],
    tables=[],
    constraints,
    groupby,
    sortorder,
    limit, 
    offset
 }) => {

    if (!cols.length) cols.push('*');
    if (!tables.length) tables.push('tmp');

    // everything else is optional
    return makeSql({ 
        cols, 
        tables, 
        constraints, 
        groupby, 
        sortorder, 
        limit, 
        offset 
    })
}