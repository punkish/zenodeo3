export function makeSql({ 
    cols, 
    tables, 
    constraints = [], 
    groupby = [], 
    having = [], 
    sortorder = [], 
    limit, 
    offset
}) {
    const sql = [];
    
    //SELECT and FROM are *always* present in a SQL query
    sql.push(`SELECT ${cols.join(', ')}`);
    sql.push(`FROM ${tables.join(' ')}`);

    // Everything else is optional
    if (constraints.length) sql.push(`WHERE ${constraints.join(' AND ')}`);
    if (groupby.length) sql.push(`GROUP BY ${groupby.join(', ')}`);
    if (having.length) sql.push(`HAVING ${having.join(' AND ')}`);
    if (sortorder.length) sql.push(`ORDER BY ${sortorder.join(', ')}`);

    if (limit) {
        sql.push(`LIMIT ${limit}`);
        
        // OFFSET can exist *only* if LIMIT is also present
        if (!offset) offset = 0;
        sql.push(`OFFSET ${offset}`);
    }

    return sql.join(' ');
}