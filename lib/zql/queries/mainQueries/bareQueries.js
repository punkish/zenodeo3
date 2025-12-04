import { 
    getSelect,
    getFrom,
    getLimitAndOffset,
    getOrderBy 
} from "../../queryMaker/index.js";

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
export function bareQueries(resource, request) {
    const tables = getFrom(resource, request);
    const cols = getSelect(resource, request);

    // There are no constraints or groupby in a bare query

    // Using default page and size values returned in validated params, we 
    // calculate the default limit and offset
    const { limit, offset } = getLimitAndOffset(resource, request);

    // Default sortby is returned in validated params, so we calculate the 
    // default sortorder with that
    const sortorder = getOrderBy(resource, request);

    return { 
        count: `
SELECT Count(*) AS num_of_records 
FROM 
    ${tables.join('\n')}`, 
        full: `
SELECT 
    ${cols.join(',\n')} 
FROM 
    ${tables.join('\n')} 
ORDER BY ${sortorder.join(', ')} 
LIMIT ${limit} OFFSET ${offset}`
    }
}