import { nonSqlQueryable } from "../utils.js";
import { ddutils } from "../../../../data-dictionary/utils/index.js";

export const getFrom = ({ resource, params }) => {

    //
    // FROM tables will always include the main resource table
    //
    const tables = [ resource ];

    //
    // FROM tables may exist because of columns in the SELECT clause 
    // (`params.cols` in the queryString) because those tables are needed 
    // to select the columns
    //
    const tmp = [];

    if (params.cols) {
        tmp.push(...params.cols);
    }

    // 
    // FROM tables may also exist because of the constraints in the WHERE 
    // clause (`Object.keys(params)`)
    //
    if (Object.keys(params)) {
        tmp.push(...Object.keys(params));
    }
    
    //
    // But any cols that are non-queryable are excluded from the FROM clause
    // so we filter them out
    //
    const queryCols = tmp.filter(i => nonSqlQueryable.indexOf(i) === -1);

    // 
    // All the columns for this resource
    //
    const cols = ddutils.getParams(resource);

    //
    // Create the intersection of queryCols and cols, and extract the
    // JOIN information for the intersected array of cols.
    //
    // The simplest code for array intersection in javascript
    // https://stackoverflow.com/a/1885569/183692
    //
    const intersectedCols = cols
        .filter(col => queryCols.includes(col.name) && col.joins);

    const isGeolocation = intersectedCols
        .filter(col => col.zqltype === 'geolocation');

    const join_tables = intersectedCols
        .map(col => col.joins);

    if (isGeolocation.length) {
        join_tables.push(`JOIN materialCitationsRtree ON images.treatments_id = materialCitationsRtree.treatments_id`);
    }

    tables.push(...join_tables.flat());

    //
    // return de-duplicated tables
    // https://stackoverflow.com/a/15868720
    //
    return [ ...new Set(tables) ];
}