import { ddutils } from "../../../../data-dictionary/utils/index.js";
import { getQueryType } from '../../z-utils/index.js';
import debug from 'debug';
const log = (fn, msg) => debug(`lib/zql/queryMaker/select:${fn}`)(msg);

export const getSelect = ({ 
    resource, 
    params, 
    resourceParams, 
    resourceId, 
    pk,
    queryType 
}) => {
    const self = 'getSelect';
    
    if (!resourceParams) {
        resourceParams = ddutils.getParams(resource);
    }

    if (!resourceId) {
        resourceId = resourceParams
            .filter(param => param.isResourceId)[0] || 'none';
    }

    if (!pk) {
        pk = resourceParams
            .filter(param => {
                if (param.sql && param.sql.type) {
                    return param.sql.type = 'INTEGER PRIMARY KEY'
                }
            })[0];
    }

    if (!queryType) {
        queryType = getQueryType({ params, resourceId });
    }

    const columns = [];

    // Always add the PK for the resource
    if (pk && pk.selname) {
        if (pk.selname.indexOf('.id') > -1) {
            const alias = pk.selname.replace(/\.id/, '_id');
            columns.push(`${pk.selname} AS ${alias}`);
        }
    }
        

    // Always add the resourceId for the resource
    if (resourceId.selname) {
        if (resourceId.selname.indexOf('.id') > -1) {

            // but only if it is not also the PK, in which case, it has already 
            // been included above
            const alias = resourceId.selname.replace(/\.id/, '_id');
            const resourceIdAlias = `${resourceId.selname} AS ${alias}`;
            if (columns.indexOf(resourceIdAlias) == -1) {
                columns.push(resourceIdAlias);
            }
            
        }
        else {
            columns.push(resourceId.selname);
        }
    }
    
    
    if (params.cols) {
        const nonSqlQueryable = ddutils.getNotCols();
        
        // Simplest code for array intersection in javascript
        // https://stackoverflow.com/a/1885569/183692
        resourceParams

            // include all params unless the param is a resourceId
            // of the resource table (not an external param)
            .filter(param => {

                if (param.external) {
                    return true;
                }
                else {
                    return param.isResourceId 
                        ? false
                        : true;
                }
                
            })

            // queryString params.cols should have the col.name
            .filter(param => params.cols.includes(param.name))

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


    log(self, columns);
    return columns;
}