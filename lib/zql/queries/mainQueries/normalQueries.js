import { 
    getSelect,
    getFrom,
    getWhere,
    getGroupBy,
    getLimitAndOffset,
    getOrderBy 
} from "../../queryMaker/index.js";

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
    const clauses = [];
    clauses.push(`
CREATE TEMP TABLE tmp AS 
    SELECT ${cols.join(', ')} 
    FROM ${tables.join(' ')}
    `);

    // everything else is optional
    if (constraints) {
        clauses.push(`
WHERE ${constraints.join(' AND ')}
        `);
    }
    
    if (groupby) {
        clauses.push(`
GROUP BY ${groupby}
        `);
    }

    if (sortorder) {
        clauses.push(`
ORDER BY ${sortorder.join(', ')}
        `);
    }
    
    return clauses.join(' ');
}

const getCountSqlNormalFromTmp = ({ tables, pk }) => {
    const clauses = [];

    if (pk) {
        const [name, alias] = pk.split(' AS ');
        clauses.push(`SELECT Count(DISTINCT ${alias}) AS num_of_records`);
    }
    else {
        clauses.push('SELECT Count(*) AS num_of_records');
    }

    clauses.push(`FROM ${tables.join(' ')}`);
    
    return clauses.join(' ');
}

const getCountSqlNormalNoTmp = ({ tables, constraints, resourceId }) => {
    const clauses = [];

    if (resourceId) {
        clauses.push(`SELECT Count(DISTINCT ${resourceId.selname}) AS num_of_records`);
    }
    else {
        clauses.push('SELECT Count(*) AS num_of_records');
    }

    clauses.push(`FROM ${tables.join(' ')}`);
    
    // everything else is optional
    if (constraints) {
        clauses.push(`WHERE ${constraints.join(' AND ')}`);
    }
    
    return clauses.join(' ');
}

const getFullSqlNormal = ({ 
    cols,
    tables,
    constraints,
    groupby,
    sortorder,
    limit, 
    offset
 }) => {
    const clauses = [];

    if (cols) {
        clauses.push(`SELECT ${cols.join(', ')}`);
    }
    else {
        clauses.push(`SELECT *`);
    }

    if (tables) {
        clauses.push(`FROM ${tables.join(' ')}`);
    }
    else {
        clauses.push(`FROM tmp`);
    }

    // everything else is optional
    if (constraints) {
        clauses.push(`WHERE ${constraints.join(' AND ')}`);
    }

    if (groupby) {
        clauses.push(`GROUP BY ${groupby}`);
    }

    if (sortorder) {
        clauses.push(`ORDER BY ${sortorder.join(', ')}`);
    }

    clauses.push(`LIMIT ${limit} OFFSET ${offset}`);
    
    return clauses.join(' ');
}