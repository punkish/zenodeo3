import { ddutils } from "../../../../data-dictionary/utils/index-ng.js";

export const getSelect = ({ 
    resource, params, resourceParams, resourceId, queryType 
}) => {
    
    if (!resourceParams) {
        resourceParams = ddutils.getParams(resource);
    }

    if (!resourceId) {
        resourceId = resourceId
            .filter(resource => resource.isResourceId)[0] || 'none';
    }

    // Always add the resourceId for the resource
    const columns = [ resourceId.selname ];
    
    if (params.cols) {

        const nonSqlQueryable = ddutils.getNotCols();
        
        // Simplest code for array intersection in javascript
        // https://stackoverflow.com/a/1885569/183692
        resourceParams

            // don't include the resourceId since it is already included
            .filter(param => !param.isResourceId )

            // queryString params.cols should have the col.name
            .filter(param => params.cols.includes(param.name) )

            // col.name should not be nonSqlQueryable
            .filter(param => nonSqlQueryable.indexOf(param.name) === -1 )
            .forEach(param => columns.push(param.selname));
    }

    if (queryType === 'normal') {
        if (resource !== 'treatments') {
            let i = -1;
            i = columns.findIndex(c => c.toString().indexOf('.treatments_id') > -1);
        
            if (i < 0) {
                columns.push(`${resource}.treatments_id`);
            }
        }
    }

    
    
    return columns;
}