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
export const getCountSql = ({ columns, tables, constraints, groupby, having }) => {
    //console.log(columns, tables, constraints, groupby, having)
    const clauses = [];

    //
    // SELECT and FROM are mandatory
    //
    // if there is a JOIN in the SQL (number of tables is more than 1) then we 
    // get Count(DISTINCT <resourceId of the primary table>), otherwise we get 
    // Count(*)
    //
    if (tables[0] === 'treatments' && tables.length > 1) {
        clauses.push(`SELECT Count(DISTINCT ${columns[0]}) AS num_of_records`);
    }
    else {
        clauses.push(`SELECT Count(*) AS num_of_records`);
    }
    
    clauses.push(`FROM ${tables.join(' ')}`);

    // everything else is optional
    if (constraints && constraints.length) clauses.push(`WHERE ${constraints.join(' AND ')}`);
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
    if (sortorder)   clauses.push(`ORDER BY ${sortorder.join(', ')}`);
    if (limit)       clauses.push(`LIMIT ${limit}`);
    if (typeof(offset) !== 'undefined') clauses.push(`OFFSET ${offset}`);
    
    return clauses.join(' ');

    // let sortcol;
    // let sortdir;

    // if (sortorder) {
    //     //console.log(sortorder)
    //     const [ sortfqcol, sortdirection ] = sortorder[0][0].split(' ');
    //     sortcol = sortfqcol.split('.')[1];
    //     sortdir = sortdirection;
    // }

    // return `SELECT * FROM (${innerSql}) t ORDER BY t.${sortcol} ${sortdir}`;
}