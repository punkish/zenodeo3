const getFrom = ({ resource, params }) => {

    //
    // FROM tables will always include the main resource table.
    const tables = [ resource ];

    //
    // FROM tables may exist because of columns in the SELECT 
    // clause `params.cols` or because of the constraints in the WHERE 
    // clause `Object.keys(params)`, but not any cols that are non-
    // queryable
    const tmp = [];

    if (params.cols) {
        tmp.push(...params.cols);
    }

    if (Object.keys(params)) {
        tmp.push(...Object.keys(params));
    }
    
    const queryCols = tmp.filter(i => nonSqlQueryable.indexOf(i) === -1);

    // Simplest code for array intersection in javascript
    // https://stackoverflow.com/a/1885569/183692
    const cols = ddutils.getParams(resource);
    const join_tables = cols
        .filter(col => queryCols.includes(col.name) && col.joins)
        .map(col => col.joins);

    tables.push(...join_tables.flat());

    // remove duplicates from tables
    // https://stackoverflow.com/a/15868720
    return [ ...new Set(tables) ];
}