import { ddutils } from "../../../../data-dictionary/utils/index.js";
import { nonSqlQueryable } from "../utils.js";

export const getSelect = ({ resource, params }) => {
    const cols = ddutils.getParams(resource);
    const resourceId = cols.filter(col => col.isResourceId)[0];
    const columns = [ resourceId.selname ];
    
    if (params.cols) {
        
        // Simplest code for array intersection in javascript
        // https://stackoverflow.com/a/1885569/183692
        cols
            .filter(col => {

                // don't include the resourceId since it is already included
                const cond0 = !col.isResourceId;

                // queryString params.cols should have the col.name
                const cond1 = params.cols.includes(col.name);

                // col.name should not be nonSqlQueryable
                const cond2 = nonSqlQueryable.indexOf(col.name) === -1;

                return cond0 && cond1 && cond2;
            })
            .forEach(col => columns.push(col.selname));
    }
    // else {
    //     //const colIsResourceId = cols.filter(col => col.isResourceId)[0];
        
    // }

    return columns;
}