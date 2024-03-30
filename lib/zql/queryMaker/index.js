export { getSelect } from './select/index.js';
export { getFrom } from './from/index.js';
export { getWhere } from './where/index.js';
export { getGroupBy } from './groupby/index.js';
export { getOrderBy } from './orderby/index.js';
export { getLimitAndOffset } from './limitandoffset/index.js';

// 
// A SQL SELECT statement is made up of following clauses
// 
// SELECT   [<columns>]                    <- getColumns()
// FROM     [<tables>]                     <- getTables()
// WHERE    [<constraints>]                <- getConstraints()
// GROUP BY [<groups]                      <- getGroupby()
// ORDER BY [<col> <dir>, <col> <dir> …]   <- getSortOrder()
// LIMIT    <int: limit>                   <- getLimitAndOffset()
// OFFSET   <int: offset>                  <- getLimitAndOffset()
// 
// The first two clauses (SELECT and FROM) are mandatory.
// The remaining clauses are optional
// 
/**
 * Return a fully formed Count() SQL statement.
 * @param {array} columns - an array of SELECT columns.
 * @param {array} tables - an array of FROM tables.
 * @param {array} constraints - an array of WHERE clauses.
 * @param {array} groupby - an array of GROUP BY clauses.
 * @param {array} having - an array of HAVING clauses.
 */
const getCountSql = ({ columns, tables, constraints }) => {

    //
    // SELECT and FROM are mandatory
    //
    // if there is a JOIN in the SQL (number of tables is more than 1) then we 
    // get Count(DISTINCT <resourceId of the primary table>), otherwise we get 
    // Count(*)
    //
    let sql = tables && tables.length > 1
        ? `SELECT Count(DISTINCT ${columns[0]}) `
        : `SELECT Count(*) `;

    sql += `AS num_of_records `;
    sql += tables 
        ? `FROM ${tables.join(' ')} `
        : `FROM tmp `;

    // WHERE is optional
    if (constraints && constraints.length) {
        sql += `WHERE ${constraints.join(' ')}`;
    }

    return sql;
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
const getCreateTmpSql = (
    { columns, tables, constraints, limit, offset, groupby, having }
) => {

    const clauses = [];

    clauses.push(`CREATE TABLE TEMP tmp AS`);

    // SELECT and FROM are mandatory
    clauses.push(`SELECT ${columns.join(', ')}`);
    clauses.push(`FROM ${tables.join(' ')}`);

    // everything else is optional
    if (constraints) {
        clauses.push(`WHERE ${constraints.join(' AND ')}`);
    }

    if (groupby) {
        clauses.push(`GROUP BY ${groupby}`);
    }

    if (having) {
        clauses.push(`HAVING ${having}`);
    }

    // if (sortorder) {
    //     clauses.push(`ORDER BY ${sortorder.join(', ')}`);
    // }

    if (limit) {
        clauses.push(`LIMIT ${limit}`);
    }

    if (typeof(offset) !== 'undefined') {
        clauses.push(`OFFSET ${offset}`);
    }
    
    return clauses.join(' ');
}

const getFullSql = ({ sortorder }) => {
    return `SELECT * FROM tmp ORDER BY ${sortorder.join(', ')}`
}

const getDropTmpSql = () => {
    return `DROP TABLE IF EXISTS tmp`
}

const getYearlyCountsSql = () => {}

export { 
    getCountSql, 
    getFullSql, 
    getCreateTmpSql, 
    getDropTmpSql, 
    getYearlyCountsSql 
}