import { ddutils } from "../../../../data-dictionary/utils/index.js";

export const getFrom = (resource, request) => {

    // Determine if a schema is required. If the table is attached,
    // there will be a schema
    const schema = ddutils.getTable(resource.name, 'attachedDatabase')
        ? ddutils.getTable(resource.name, 'attachedDatabase').name
        : '';

    // FROM tables will always include the main resource table
    const tables = [];

    if (schema) {
        tables.push(`${schema}.${resource.name}`);
    }
    else {
        tables.push(resource.name);
    }

    // To find the tables we need in the query, we collect the names of all the 
    // columns in the SELECT clause as well as those in the WHERE clause and 
    // then look for the JOIN information in those params. We collect the 
    // columns in a temporary variable tmp
    const tmp = [];

    // FROM tables may exist because of columns in the SELECT clause 
    // (`params.cols` in the queryString) because those tables are needed 
    // to select the columns
    //
    if (request.query.cols) {
        tmp.push(...request.query.cols);
    }

    // FROM tables may also exist because of the constraints in the WHERE 
    // clause (`Object.keys(params)`)
    if (Object.keys(request.query)) {
        tmp.push(...Object.keys(request.query));
    }
    
    // But any cols that are non-queryable are excluded from the FROM clause
    // so we filter them out
    const nonSqlQueryable = ddutils.getNotCols();
    const queryCols = tmp.filter(i => nonSqlQueryable.indexOf(i) === -1);

    // Create the intersection of queryCols and resourceParams, and extract the
    // JOIN information for the intersected params.
    //
    // The simplest code for array intersection in javascript
    // https://stackoverflow.com/a/1885569/183692
    const intersectedCols = resource.params
        .filter(col => queryCols.includes(col.name) && col.joins);

    // const isGeolocation = intersectedCols
    //     .filter(col => col.zqltype === 'geolocation');

    const join_tables = intersectedCols.map(col => col.joins);
    tables.push(...join_tables.flat());
    
    // return de-duplicated tables
    // https://stackoverflow.com/a/15868720
    return [ ...new Set(tables) ];
}