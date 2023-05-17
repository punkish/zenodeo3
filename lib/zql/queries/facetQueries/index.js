import { ddutils } from '../../../../data-dictionary/utils/index.js';

export const facetQueries = (resource) => {
    const facets = {};
    const table = ddutils.tableFromResource(resource);
    const tables = [ table ];
    
    const columns = ddutils.getFacetCols(resource);
    
    columns.forEach(c => {
        let obj = {
            columns: [ c.name, `Count(${c.name}) AS count` ],
            tables,
            constraints: [ `${c.name} != ''` ],
            group: c.name,
            having: c.facet,
            sortorder: [ `count DESC` ],
            limit: 50
        }
        const innerSql = getSql(obj);

        obj = {
            columns: [ c.name, 'count' ],
            tables: [ `(${innerSql}) AS t` ],
            sortorder: [ `${c.name} ASC` ]
        }

        //facets[c.name] = `SELECT ${c.name}, count FROM (SELECT ${c.name}, Count(${c.name}) AS count FROM ${tables.join(' JOIN ')} WHERE ${c.name} != '' GROUP BY ${c.name} HAVING ${c.facet} ORDER BY count DESC LIMIT 50) AS t ORDER BY ${c.name} ASC`;
        facets[c.name] = getSql(obj);
    })

    return facets;
}