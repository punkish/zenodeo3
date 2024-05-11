import { ddutils } from "../../../../data-dictionary/utils/index.js";
import { getQueryType } from '../../z-utils/index.js';

export const getSelect = ({ 
    resource, params, resourceParams, resourceId, queryType 
}) => {
    
    if (!resourceParams) {
        resourceParams = ddutils.getParams(resource);
    }

    if (!resourceId) {
        resourceId = resourceParams
            .filter(resource => resource.isResourceId)[0] || 'none';
    }

    if (!queryType) {
        queryType = getQueryType({ params, resourceId });
    }

    
    const columns = [];

    // Always add the resourceId for the resource
    if (resourceId.selname.indexOf('.id') > -1) {
        const alias = resourceId.selname.replace(/\.id/, '_id');
        columns.push(`${resourceId.selname} AS ${alias}`);
    }
    else {
        columns.push(resourceId.selname);
    }
    
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
            if (!(columns.some(c => c.indexOf('.treatments_id') > -1))) {
                columns.push(`${resource}.treatments_id`);
            }
        }
    }

    return columns;
}