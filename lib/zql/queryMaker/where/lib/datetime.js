//  The source date (date | from, to) in the query will always be a string 
// 'yyyy-mm-dd'. The following are the target date/year columns in treatments
//  
//  | field             | sqltype | zqltype | format        | units |
//  |-----------------  |---------|---------|---------------|-------|
//  | publicationDate   | TEXT    | date    | yyyy-mm-dd    |       |
//  | publicationDateMs | INTEGER | msecs   | sssssssssssss | ms    |
//  | updateTime        | INTEGER | msecs   | sssssssssssss | ms    |
//  | checkinTime       | INTEGER | msecs   | sssssssssssss | ms    |
//  | journalYear       | INTEGER | year    | yyyy          |       |
//  | authorityYear     | INTEGER | year    | yyyy          |       |
//  | checkinYear       | INTEGER | year    | yyyy          |       |
//  
//  The following queries can be performed
//  
//  | query                    | sql                           |
//  |--------------------------|-------------------------------|
//  | key=val                  | WHERE key = val               |
//  |——————————————————————————|———————————————————————————————|
//  | key=since(val)           | WHERE key >= val              |
//  |——————————————————————————|———————————————————————————————|
//  | key=until(val)           | WHERE key <= val              |
//  |——————————————————————————|———————————————————————————————|
//  | key=between(from and to) | WHERE key BETWEEN from AND to |
//  
// The source date will always need be converted to ms. The target date will 
// be converted to ms *only* if its db format is TEXT

/**
 * Convert a date formatted as string to ms since epoch in SQLite3 syntax
 * @param {string} input - date formatted as string
 */
const str2ms  = (input) => `Unixepoch(${input}) * 1000`;
const str2s   = (input) => `Unixepoch(${input})`;

/**
 * Format a date as yyyy-mm-dd
 * @param {string} date - date formatted as string
 */
const formatDate = (date) => {
    let yyyy;
    let mm;
    let dd;

    if (date === 'yesterday') {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        yyyy = date.getUTCFullYear();
        mm = date.getUTCMonth() + 1;
        dd = date.getUTCDate();
    }
    else {
        [ yyyy, mm, dd ] = date.split('-');
    }

    mm = mm.toString().padStart(2, '0');
    dd = dd.toString().padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
}

// date pattern: operator1, date, operator2, from, to
// year pattern: operator1, year, operator2, from, to
// text pattern: operator, text
// geol pattern: operator, radius, units, lat, lng, min_lat, min_lng, max_lat, max_lng

//
// to make a constraint, we need 
// - left      : col.selname
// - operator  : zql -> sql
// - right.bind: @<col.name>
// - right.vals: val extracted from g
//
/**
 * Return a date-based SQL constraint
 * @param {string} col - name of column.
 * @param {object} g - object with date values.
 */
const datetime = ({ col, val, operator }) => {
    let constraint;
    const runparams = {};

    // left
    // ----
    // If the col is stored as a TEXT string in the db, it has to be converted 
    // to milliseconds. Otherwise it can remain as is since values to be 
    // compared with are in milliseconds or years, both integers.
    //

    // const left = col.name === 'publicationDate'
    //     ? str2s(col.selname)
    //     : col.selname;

    // right values
    // ------------
    // The query value(s) are submitted either as a date string 'yyyy-mm-dd'
    // that has to be converted to milliseconds, or as a year string 'yyyy' 
    // that has to be converted to a number.
    //
    let left = col.where;
    
    if (val.date) {
        let right = `@${col.name}`;

        if (col.name.indexOf('Year') > -1) {
            runparams[col.name] = Number(val.date);
        }
        else if (col.name.indexOf('Date') > -1) {
            left = str2s(left);
            right = str2s(right);
            
            runparams[col.name] = formatDate(val.date);
        }
        else if (col.name.indexOf('Time') > -1) {
            right = str2ms(right);
            
            runparams[col.name] = formatDate(val.date);
        }

        constraint = `${left} ${operator} ${right}`;
    }
    else if (val.from && val.to) {
        let rightFrom = '@from';
        let rightTo = '@to';

        if (col.name.indexOf('Year') > -1) {
            runparams.from = Number(val.from);
            runparams.to = Number(val.to);
        }
        else if (col.name.indexOf('Date') > -1) {
            left = str2s(left);
            rightFrom = str2s(rightFrom);
            rightTo = str2s(rightTo);

            runparams.from = formatDate(val.from);
            runparams.to = formatDate(val.to);
        }
        else if (col.name.indexOf('Time') > -1) {
            rightFrom = str2ms(rightFrom);
            rightTo = str2ms(rightTo);

            runparams.from = formatDate(val.from);
            runparams.to = formatDate(val.to);
        }

        constraint = `${left} BETWEEN ${rightFrom} AND ${rightTo}`;
    }

    return { constraint, runparams };
}

export { datetime }