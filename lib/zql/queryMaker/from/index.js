//import { nonSqlQueryable } from "../utils.js";
import { ddutils } from "../../../../data-dictionary/utils/index.js";

export const getFrom = ({ resource, params, resourceParams }) => {

    if (!resourceParams) {
        resourceParams = ddutils.getParams(resource);
    }

    // FROM tables will always include the main resource table
    //
    const tables = [ resource ];

    // add schema name if the table is attached
    const schema = ddutils.getTable(tables[0], 'attachedDatabase')
        ? ddutils.getTable(tables[0], 'attachedDatabase').name
        : '';

    if (schema) {
        tables[0] = `${schema}.${tables[0]}`;
    }

    // To find the tables we need in the query, we collect the names of all the 
    // columns in the SELECT clause as well as those in the WHERE clause and 
    // then look for the JOIN information in those params. We collect the 
    // columns in a temporary variable tmp
    //
    const tmp = [];

    // FROM tables may exist because of columns in the SELECT clause 
    // (`params.cols` in the queryString) because those tables are needed 
    // to select the columns
    //
    if (params.cols) {
        tmp.push(...params.cols);
    }

    // FROM tables may also exist because of the constraints in the WHERE 
    // clause (`Object.keys(params)`)
    //
    if (Object.keys(params)) {
        tmp.push(...Object.keys(params));
    }
    
    // But any cols that are non-queryable are excluded from the FROM clause
    // so we filter them out
    //
    const nonSqlQueryable = ddutils.getNotCols();
    const queryCols = tmp.filter(i => nonSqlQueryable.indexOf(i) === -1);

    // Create the intersection of queryCols and resourceParams, and extract the
    // JOIN information for the intersected params.
    //
    // The simplest code for array intersection in javascript
    // https://stackoverflow.com/a/1885569/183692
    //
    const intersectedCols = resourceParams
        .filter(col => queryCols.includes(col.name) && col.joins);

    // const isGeolocation = intersectedCols
    //     .filter(col => col.zqltype === 'geolocation');

    const join_tables = intersectedCols.map(col => col.joins);

    tables.push(...join_tables.flat());

    // return de-duplicated tables
    // https://stackoverflow.com/a/15868720
    //
    return [ ...new Set(tables) ];
}