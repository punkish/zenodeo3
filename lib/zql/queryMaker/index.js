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
export const getCountSql = ({ tables, constraints, groupby, having }) => {
    const clauses = [];

    // SELECT and FROM are mandatory
    clauses.push(`SELECT Count(*) AS num_of_records`);
    clauses.push(`FROM ${tables.join(' ')}`);

    // everything else is optional
    if (constraints) clauses.push(`WHERE ${constraints.join(' AND ')}`);
    if (groupby)     clauses.push(`GROUP BY ${groupby}`);
    if (having)      clauses.push(`HAVING ${having}`);
    
    return clauses.join(' ');
}

export const getFullSql = ({ 
    columns, tables, 
    constraints, sortorder, limit, 
    offset, groupby, having 
}) => {
    const clauses = [];

    // SELECT and FROM are mandatory
    clauses.push(`SELECT ${columns.join(', ')}`);
    clauses.push(`FROM ${tables.join(' ')}`);

    // everything else is optional
    if (constraints) clauses.push(`WHERE ${constraints.join(' AND ')}`);
    if (groupby)     clauses.push(`GROUP BY ${groupby}`);
    if (having)      clauses.push(`HAVING ${having}`);
    if (sortorder)   clauses.push(`ORDER BY +${sortorder.join(', ')}`);
    if (limit)       clauses.push(`LIMIT ${limit}`);
    if (typeof(offset) !== 'undefined') clauses.push(`OFFSET ${offset}`);
    
    return clauses.join(' ');
}