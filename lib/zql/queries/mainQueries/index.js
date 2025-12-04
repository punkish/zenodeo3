import { bareQueries } from './bareQueries.js';
import { countQueries } from './countQueries.js';
import { normalQueries } from './normalQueries.js';
import { ddutils } from "../../../../data-dictionary/utils/index.js";

export function mainQueries (fastify, resource, request) {

    // All the params of the resource
    resource.params = ddutils.getParams(resource.name);

    // resourceId of the resource, for example, treatments.id
    // materialCitations.id, etc.
    resource.resourceId = resource.params.filter(col => col.isResourceId)[0];

    // The queries we are going to construct
    const queries = {
        dropTmp: false,
        createTmp: false,
        createIndex: false,
        count: false,
        full: false,
        yearlyCounts: false,
        runparams: false,
    };

    // url: http://../treatments
    //
    // A bare query has only the resource in the URL. As such, 30 rows of a set 
    // of pre-defined columns (defaults) is sent back sorted by the resourceId
    // along with the count. While both count and full queries are required
    // alongwith the optional yearlyCounts query, creating a TEMP table would 
    // take a long time because the entire table will be copied. So the 
    // following queries are created, all of them without any constraints
    //
    //  - count
    //  - full
    //  - yearlyCounts (optional)
    if (request.queryType.type === 'bare') {
        const { count, full } = bareQueries(resource, request);
        queries.count = count;
        queries.full = full;
    }

    // http://../treatments?treatmentId=XXXXXX
    //
    // A resourceId query is special because only one record will be returned. 
    // So we don't need a count query because count is going to be 1. We also 
    // don't need yearlyCounts queries as they make no sense. Since only a full 
    // query is required (which will return only one row), we don't need to 
    // create a temp table.
    else if (request.queryType.type === 'resourceId') {
        const { full } = resourceIdQueries(resource, request);
        queries.full = full;
        queries.runparams = runparams;
    }

    // http://../treatments?cols=&q=agosti
    //
    // Count queries return only the count (no other column). The yearlyCounts 
    // query is optional, but if it is requested, making a temp table is 
    // worthwhile
    else if (request.queryType.type === 'count') {
        const res = countQueries(resource, request);
        queries.dropTmp = res.dropTmp || false;
        queries.createTmp = res.createTmp || false;
        queries.createIndex = res.createIndex || false;
        queries.count = res.count;
        queries.runparams = res.runparams;
    }

    // http://../treatments?q=agosti
    //
    // A normal query is one where a constraint is provided and, optionally, 
    // cols to be returned are specified. If no cols are specified then default
    // cols are returned. Both count and full queries are always required. If  
    // the optional yearlyCounts is also required, we are better off creating 
    // a TEMP table.
    else if (request.queryType.type === 'normal') {
        const res = normalQueries(resource, request);
        queries.dropTmp = res.dropTmp || false;
        queries.createTmp = res.createTmp || false;
        queries.createIndex = res.createIndex || false;
        queries.count = res.count;
        queries.full = res.full;
        queries.runparams = res.runparams;
    }

    else if (request.queryType.type === 'zai') {
        const { full, runparams } = zaiSummaryQuery(resource, request);
        queries.full = full;
        queries.runparams = runparams;
    }

    return queries;
}