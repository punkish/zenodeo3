'use strict';

import * as utils from '../../../../utils.js';

/*
The following are the date fields in treatments

| field             | sqltype | format        | units |
|-----------------  |---------|---------------|-------|
| publicationDate   | TEXT    | yyyy-mm-dd    |       |
| publicationDateMs | INTEGER | sssssssssssss | ms    |
| updateTime        | INTEGER | sssssssssssss | ms    |
| checkinTime       | INTEGER | sssssssssssss | ms    |

The following are the year fields in treatments

| field             | sqltype | format        | units |
|-------------------|---------|---------------|-------|
| journalYear       | INTEGER | yyyy          |       |
| authorityYear     | INTEGER | yyyy          |       |
| checkinYear       | INTEGER | yyyy          |       |

| query                    | sql                           |
|--------------------------|-------------------------------|
| key=val                  | WHERE key = val               |
|——————————————————————————|———————————————————————————————|
| key=since(val)           | WHERE key >= val              |
|——————————————————————————|———————————————————————————————|
| key=until(val)           | WHERE key <= val              |
|——————————————————————————|———————————————————————————————|
| key=between(from and to) | WHERE key BETWEEN from AND to |
 */
// const validOperators = {
//     'since'  : (key, val) => `${key} >= ${val}`,
//     'until'  : (key, val) => `${key} <= ${val}`,
//     'between': (key, from, to) => `${key} BETWEEN ${from} AND ${to}`
// };

/**
 * convert a date formatted as string to ms since epoch in SQLite3 syntax
 */
const str2ms = (input) => `((julianday('${input}') - 2440587.5) * 86400000)`;

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

//const patternDate = utils.getPattern('date');

const date = (key, g, operator) => {
    const constraint = {};
   // let debug;
    const runparams = {};

    // if the key is 'publicationDate', we search the database against 
    // 'publicationDateMs' which is stored as ms since unixepoch
    let left = key;
    if (key === 'publicationDate') {
        left = 'publicationDateMs';
    }

    const { date, from, to } = g;

    if (date) {
        const right = str2ms(`@${key}`);
        constraint.bind = `${left} ${operator} ${right}`;

        const formattedDate = formatDate(date);
        const dateAsMs = str2ms(formattedDate);
        constraint.vals = `${left} ${operator} ${dateAsMs}`;

        runparams[key] = formattedDate;
    }
    else if (from && to) {
        const rightFrom = str2ms(`@${from}`);
        const rightTo = str2ms(`@${to}`);
        constraint.bind = `${left} BETWEEN @${rightFrom} AND @${rightTo}`;

        const formattedFrom = formatDate(from);
        const fromAsMs = str2ms(formattedFrom);
        const formattedTo = formatDate(to);
        const toAsMs = str2ms(formattedTo);
        constraint.vals = `${left} BETWEEN ${fromAsMs} AND ${toAsMs}`;

        runparams.from = formattedFrom;
        runparams.to = formattedTo;
    }

    return { constraint, runparams };
}

//const patternYear = utils.getPattern('year');

const year = (key, g, operator) => {
    const constraint = {};
    //let debug;
    const runparams = {};
    const { year, from, to } = g;

    if (year) {
        constraint.bind = `${left} ${operator} @${key}`;
        constraint.vals = `${left} ${operator} ${year}`;
        runparams[key] = Number(year);
    }
    else if (from && to) {
        constraint.bind = `${left} BETWEEN @from AND @to`;
        constraint.vals = `${left} BETWEEN ${from} AND ${to}`;
        runparams.from = Number(from);
        runparams.to = Number(to);
    }

    return { constraint, runparams };
}

export { year, date }