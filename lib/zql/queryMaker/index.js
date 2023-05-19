export { getSelect } from './select/index.js';
export { getFrom } from './from/index.js';
export { getWhere } from './where/index.js';
export { getGroupBy } from './groupby/index.js';
export { getOrderBy } from './orderby/index.js';
export { getLimitAndOffset } from './limitandoffset/index.js';

/**
 * A SQL SELECT statement is made up of following clauses
 *
 * SELECT   [<columns>]                    <- getColumns()
 * FROM     [<tables>]                     <- getTables()
 * WHERE    [<constraints>]                <- getConstraints()
 * GROUP BY [<groups]                      <- getGroupby()
 * ORDER BY [<col> <dir>, <col> <dir> …]   <- getSortOrder()
 * LIMIT    <int: limit>                   <- getLimitAndOffset()
 * OFFSET   <int: offset>                  <- getLimitAndOffset()
 *
 * The first two clauses (SELECT and FROM) are mandatory.
 * The remaining clauses are optional
 */
export const getCountSql = (obj) => {
    const { tables, constraints, groupby, having } = obj;

    const sqlClauses = [];

    sqlClauses.push(`SELECT Count(*) AS num_of_records`);
    sqlClauses.push(`FROM ${tables.join(' ')}`);

    if (constraints && constraints.length) {
        sqlClauses.push(`WHERE ${constraints.join(' AND ')}`);
    }

    if (groupby !== undefined) {
        sqlClauses.push(`GROUP BY ${groupby}`);
    }

    if (having !== undefined) {
        sqlClauses.push(`HAVING ${having}`);
    }
    
    return sqlClauses.join(' ');
}

export const getFullSql = (obj) => {
    const { 
        columns, tables, constraints, sortorder, limit, offset, groupby, having 
    } = obj;

    const sqlClauses = [];

    sqlClauses.push(`SELECT ${columns.join(', ')}`);
    sqlClauses.push(`FROM ${tables.join(' ')}`);

    if (constraints && constraints.length) {
        sqlClauses.push(`WHERE ${constraints.join(' AND ')}`);
    }

    if (groupby !== undefined) {
        sqlClauses.push(`GROUP BY ${groupby}`);
    }

    if (having !== undefined) {
        sqlClauses.push(`HAVING ${having}`);
    }

    if (sortorder && sortorder.length) {
        sqlClauses.push(`ORDER BY +${sortorder.join(', ')}`);
    }

    if (limit) {
        sqlClauses.push(`LIMIT ${limit}`);
    }

    if (offset !== undefined) {
        sqlClauses.push(`OFFSET ${offset}`);
    }
    
    return sqlClauses.join(' ');
}