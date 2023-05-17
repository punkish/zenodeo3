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
const getSql = (obj, sqlType) => {
    const { 
        columns, tables, constraints, sortorder, 
        limit, offset, groupby, having 
    } = obj;

    const sqlClauses = [];

    if (sqlType === 'count') {
        //sqlClauses.push(`SELECT Count(DISTINCT ${columns[0]}) AS num_of_records`);
        sqlClauses.push(`SELECT Count(*) AS num_of_records`);
    }
    else {
        sqlClauses.push(`SELECT ${columns.join(', ')}`);
    }

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

export { getSql }