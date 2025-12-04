import { getFrom, getWhere } from "../../queryMaker/index.js";

// http://../treatments?cols=
// http://../treatments?cols=&q=agosti
// http://../treatments?cols=&q=agosti&yearlyCounts=true
//
// Count queries return only the count (no other column)
export function countQueries (resource, request) {
    const tables = getFrom(resource, request);
    const clauses = [];

    if (tables.length > 1) {
        const resId = resource.resourceId.selname;
        clauses.push(`SELECT Count(DISTINCT ${resId}) AS num_of_records`);
    }
    else {
        clauses.push('SELECT Count(*) AS num_of_records');
    }

    clauses.push(`FROM ${tables.join(' ')}`);

    // Count queries can be with or without any constraints, so we 
    // determine if there are any constraints
    const { constraints, runparams } = getWhere(resource, request);
    
    // WITH constraint
    // http://../treatments?cols=&q=agosti
    if (constraints.length) {
        clauses.push(`WHERE ${constraints.join(' ')}`);
    }

    const count = clauses.join(' ');
    return { count, runparams }
}