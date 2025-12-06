import { getSelect, getFrom, getWhere } from "../../queryMaker/index.js";
import { makeSql } from "./utils.js";

// http://../treatments?treatmentId=XXXXXX
//
// A resourceId query is special because only one record will be returned. 
// So we don't need a count query because count is going to be 1. We also 
// don't need yearlyCounts queries as they make no sense. Since only a full 
// query is required (which will return only one row), we don't need to 
// create a temp table.
//
//  - full
export function resourceIdQueries (resource, request) {
    const tables = getFrom(resource, request);
    const cols = getSelect(resource, request);
    const { constraints, runparams } = getWhere(resource, request);

    // No groupby, sortorder, limit, or offset are needed for a resourceId 
    // query
    return {
        full: makeSql({ cols, tables, constraints }),
        runparams
    }
}