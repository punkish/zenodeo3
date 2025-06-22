import { ddutils } from "../../../../data-dictionary/utils/index.js";

export const getSelect = ({ 
    resource, 
    params, 
    resourceParams, 
    resourceId, 
    pk,
    queryType 
}) => {
    
    if (!resourceParams) {
        resourceParams = ddutils.getParams(resource);
    }

    const nonSqlQueryable = ddutils.getNotCols();
    const columns = resourceParams
        .filter(param => 

            // name is in params.cols
            params.cols.includes(param.name)

            // name is 'treatments_id'
            || param.name === 'treatments_id'

            // is resourceId, but not of an external table
            || (param.isResourceId === true && !('external' in param))

            // is PK that is different from resourceId
            || (param.sql && param.sql.desc === 'PK')
        
        )

        // col.name should not be nonSqlQueryable
        .filter(param => !nonSqlQueryable.includes(param.name))
        .map(param => {
            if (param.alias) {
                return `${param.selname} AS ${param.alias}`;
            }
            else {
                return param.selname;
            }
        });

    return columns
}