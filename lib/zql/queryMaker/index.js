import { getSelect } from './select/index.js';
import { getFrom } from './from/index.js';
import { getWhere } from './where/index.js';
import { getGroupBy } from './groupby/index.js';
import { getOrderBy } from './orderby/index.js';
import { getLimitAndOffset } from './limitandoffset/index.js';

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
//  - yearlyCounts (optional)
const bareQueries = ({ 
    resource, 
    params, 
    resourceParams, 
    resourceId, 
    queryType 
}) => {
    const tables = getFrom({ resource, params, resourceParams });
    const cols = getSelect({ 
        resource, 
        params, 
        resourceParams, 
        resourceId, 
        queryType 
    });

    // There are no constraints or groupby in a bare query

    // Using default page and size values returned in validated params, we 
    // calculate the default limit and offset
    const { limit, offset } = getLimitAndOffset({ resource, params });

    // Default sortby is returned in validated params, so we calculate the 
    // default sortorder with that
    const sortorder = getOrderBy({ resource, params });

    return { 
        count: `SELECT Count(*) AS num_of_records FROM ${tables.join(' ')}`, 
        full: `SELECT ${cols.join(', ')} FROM ${tables.join(' ')} ORDER BY ${sortorder.join(', ')} LIMIT ${limit} OFFSET ${offset}`
    }
}

// http://../treatments?treatmentId=XXXXXX
//
// A resourceId query is special because only one record will be returned. 
// So we don't need a count query because count is going to be 1. We also 
// don't need yearlyCounts queries as they make no sense. Since only a full 
// query is required (which will return only one row), we don't need to 
// create a temp table.
//
//  - full
const resourceIdQueries = ({ 
    resource, 
    params, 
    resourceParams, 
    resourceId, 
    queryType 
}) => {
    const tables = getFrom({ resource, params, resourceParams });
    const cols = getSelect({ 
        resource, 
        params, 
        resourceParams, 
        resourceId, 
        queryType 
    });
    const { constraints, runparams } = getWhere({ 
        resource, 
        params,  
        resourceParams, 
        resourceId 
    });

    // No groupby, sortorder, limit, or offset are needed for a resourceId 
    // query

    return { 
        full: `SELECT ${cols.join(', ')} FROM ${tables.join(' ')} WHERE ${constraints.join(' AND ')}`,
        runparams
    }
}

// http://../treatments?cols=
// http://../treatments?cols=&q=agosti
//
// Count queries return only the count (no other column)
const countQueries = ({ 
    resource, 
    params, 
    resourceParams, 
    resourceId 
}) => {

    let count;

    // Count queries can be with or without any constraints, so we first 
    // determine if there are any constraints
    const { constraints, runparams } = getWhere({ 
        resource, 
        params,  
        resourceParams, 
        resourceId 
    });
    
    const tables = getFrom({ resource, params, resourceParams });

    // WITH constraint
    // http://../treatments?cols=&q=agosti
    //
    if (constraints.length) {
        const clauses = [];

        if (tables.length > 1) {
            clauses.push(`SELECT Count(DISTINCT ${resourceId.selname})`);
        }
        else {
            clauses.push('SELECT Count(*)');
        }

        clauses.push(`AS num_of_records FROM ${tables.join(' ')} WHERE ${constraints.join(' ')}`);

        count = clauses.join(' ');
    }

    // NO constraint
    // http://../treatments?cols=
    //
    else {
        count = `SELECT Count(*) AS num_of_records FROM ${tables.join(' ')}`;
    }

    return { 
        count,
        runparams
    }
}

// http://../treatments?q=agosti
//
// A normal query is one where a constraint is provided and, optionally, 
// cols to be returned are specified. If no cols are specified then default
// cols are returned. Both count and full queries are always required. If  
// the optional yearlyCounts is also required, we are better off creating 
// a TEMP table.
const normalQueries = ({ 
    //fastify,
    resource, 
    params, 
    resourceParams, 
    resourceId, 
    queryType 
}) => {

    const tables = getFrom({ resource, params, resourceParams });
    const cols = getSelect({ 
        resource, 
        params, 
        resourceParams, 
        resourceId,
        queryType
    });
    const { constraints, runparams } = getWhere({ 
        resource, 
        params, 
        resourceParams, 
        resourceId,
        queryType
    });
    const groupby = getGroupBy({ resource, params });
    const sortorder = getOrderBy({ resource, params });
    const { limit, offset } = getLimitAndOffset({ resource, params });

    if (params.yearlyCounts) {
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
    clauses.push(`CREATE TEMP TABLE tmp AS SELECT ${cols.join(', ')} FROM ${tables.join(' ')}`);

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

function zaiSummaryQuery({ 
    //fastify,
    resource, 
    params, 
    resourceParams, 
    resourceId, 
    queryType 
}) {
    const full = `
    SELECT 
        treatments.id AS treatments_id, 
        treatments.treatmentId, 
        treatments.treatmentTitle, 
        treatments.zenodoDep, 
        treatments.articleTitle, 
        treatments.articleAuthor, 
        treatments.articleDOI, 
        treatments.publicationDate AS publicationDate, 
        treatments.status, 
        zai.summary 
    FROM 
        treatments 
        JOIN genera ON treatments.genera_id = genera.id 
        JOIN species ON treatments.species_id = species.id 
        JOIN zai.treatments AS zai ON treatments_id = zai.id
    WHERE 
        genera.genus = @genus COLLATE NOCASE
        AND species.species = @species COLLATE NOCASE
    LIMIT 1`;

    const { constraints, runparams } = getWhere({ 
        resource, 
        params, 
        resourceParams, 
        resourceId,
        queryType
    });

    return {
        full,
        runparams
    }
}

export {
    bareQueries,
    resourceIdQueries,
    countQueries,
    normalQueries,
    zaiSummaryQuery
}