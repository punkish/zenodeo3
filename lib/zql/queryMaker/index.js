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


const getCountSqlBare = ({ tables }) => {
    return `SELECT Count(*) AS num_of_records FROM ${tables.join(' ')}`
}

const getFullSqlBare = ({
    cols,
    tables,
    constraints,
    groupby,
    sortorder,
    limit,
    offset
}) => {
    const clauses = [];

    clauses.push(`SELECT ${cols.join(', ')}`);
    clauses.push(`FROM ${tables.join(' ')}`);

    if (constraints) {
        clauses.push(`WHERE ${constraints.join(' AND ')}`);
    }
    
    if (groupby) {
        clauses.push(`GROUP BY ${groupby}`);
    }

    if (sortorder) {
        clauses.push(`ORDER BY ${sortorder.join(', ')}`);
    }

    clauses.push(`LIMIT ${limit}`);
    clauses.push(`OFFSET ${offset}`);

    return clauses.join(' ');
}

const getFullSqlResourceId = ({
    cols,
    tables,
    constraints
}) => {
    const clauses = [];

    clauses.push(`SELECT ${cols.join(', ')}`);
    clauses.push(`FROM ${tables.join(' ')}`);
    clauses.push(`WHERE ${constraints.join(' AND ')}`);

    return clauses.join(' ');
}

const getCountSqlWithConstraints = ({ resourceId, tables, constraints }) => {
    const clauses = [];

    // if there is a JOIN in the SQL (number of tables is more than 1) then we 
    // use Count(DISTINCT <resourceId of the primary table>), otherwise we use 
    // Count(*)
    //
    if (resourceId) {
        clauses.push(`SELECT Count(DISTINCT ${resourceId})`)
    }
    else {
        clauses.push('SELECT Count(*)');
    }

    clauses.push('AS num_of_records');
    clauses.push(`FROM ${tables.join(' ')}`);
    clauses.push(`WHERE ${constraints.join(' ')}`);

    return clauses.join(' ');
}

const getCountSqlWithoutConstraints = ({ tables }) => {
    const clauses = [];

    // if there is a JOIN in the SQL (number of tables is more than 1) then we 
    // use Count(DISTINCT <resourceId of the primary table>), otherwise we use 
    // Count(*)
    //
    clauses.push('SELECT Count(*)');
    clauses.push('AS num_of_records');
    clauses.push(`FROM ${tables.join(' ')}`);

    return clauses.join(' ');
}

const getDropTmpSql = () => {
    return `DROP TABLE IF EXISTS tmp`
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
    clauses.push(`CREATE TEMP TABLE tmp AS`);
    clauses.push(`SELECT ${cols.join(', ')}`);
    clauses.push(`FROM ${tables.join(' ')}`);

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
    
    return clauses.join(' ');
}

const getCountSqlNormal = ({ 
    tables,
    constraints,
    resourceId
 }) => {
    const clauses = [];

    if (resourceId) {
        clauses.push(`SELECT Count(DISTINCT ${resourceId}) AS num_of_records`);
    }
    else {
        clauses.push('SELECT Count(*) AS num_of_records');
    }

    // If no yearlyCounts are required, there will not be any TEMP table tmp
    if (tables) {
        clauses.push(`FROM ${tables.join(' ')}`);
    }
    else {
        clauses.push('FROM tmp');
    }

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

    clauses.push(`LIMIT ${limit}`);
    clauses.push(`OFFSET ${offset}`);
    
    return clauses.join(' ');
}

export { 
    getCountSqlNormal,
    getFullSqlNormal,

    getCountSqlBare, 
    getFullSqlBare, 

    getFullSqlResourceId,

    getCountSqlWithConstraints,
    getCountSqlWithoutConstraints,

    getCreateTmpSql, 
    getDropTmpSql 
}