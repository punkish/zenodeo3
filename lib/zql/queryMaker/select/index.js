import { ddutils } from "../../../../data-dictionary/utils/index.js";

export function getSelect(resource, request) {

    const nonSqlQueryable = ddutils.getNotCols();
    const columns = resource.params

        // col.name should not be nonSqlQueryable
        .filter(p => !nonSqlQueryable.includes(p.name))
        .filter(p => 

            // name is in params.cols
            request.query.cols.includes(p.name)

            // name is 'treatments_id'
            || p.name === 'treatments_id'

            // is resourceId, but not of an external table
            || (p.isResourceId === true && !('external' in p))

            // is PK that is different from resourceId
            || (p.sql && p.sql.desc === 'PK')
        )
        .map(p => (p.alias ? `${p.selname} AS ${p.alias}` : p.selname));

    return columns
}