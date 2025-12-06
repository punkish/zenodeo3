import { getFrom, getWhere } from "../../queryMaker/index.js";
import { makeSql } from "./utils.js";

// http://../treatments?cols=
// http://../treatments?cols=&q=agosti
// http://../treatments?cols=&q=agosti&yearlyCounts=true
//
// Count queries return only the count (no other column)
export function countQueries (resource, request) {
    const tables = getFrom(resource, request);
    const cols = [];

    if (tables.length > 1) {
        const resId = resource.resourceId.selname;
        cols.push(`Count(DISTINCT ${resId}) AS num_of_records`);
    }
    else {
        cols.push('Count(*) AS num_of_records');
    }

    // Count queries can be with or without any constraints, so we 
    // determine if there are any constraints
    const { constraints, runparams } = getWhere(resource, request);
    
    return { 
        count: makeSql({ cols, tables, constraints }), 
        runparams 
    }
}