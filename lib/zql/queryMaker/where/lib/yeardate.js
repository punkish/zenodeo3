'use strict';

import * as utils from '../../../utils.js';

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
const validOperators = {
    'since'  : (key, val) => `${key} >= ${val}`,
    'until'  : (key, val) => `${key} <= ${val}`,
    'between': (key, from, to) => `${key} BETWEEN ${from} AND ${to}`
};

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

const patternDate = utils.getPattern('date');

const date = ({ key, val }) => {
    let constraint;
    let debug;
    const runparams = {};
    let m = val.match(patternDate);

    // if the key is 'publicationDate', we search the database against 
    // 'publicationDateMs' which is stored as ms since unixepoch
    let left = key;
    if (key === 'publicationDate') {
        left = 'publicationDateMs';
    }

    if (m) {
        const { operator1, date, operator2, from, to } = m.groups;
        const operator = operator1 || operator2;

        if (date) {
            const right = str2ms(`@${key}`);
            constraint = validOperators[operator](left, right);
            const formattedDate = formatDate(date);
            const dateAsMs = str2ms(formattedDate);
            debug = validOperators[operator](left, dateAsMs);
            runparams[key] = formattedDate;
        }
        else if (from && to) {
            const formattedFrom = formatDate(from);
            const fromAsMs = str2ms(formattedFrom);
            const formattedTo = formatDate(to);
            const toAsMs = str2ms(formattedTo);
            constraint = validOperators[operator](left, str2ms('@from'), str2ms('@to'));
            debug = validOperators[operator](left, fromAsMs, toAsMs);
            runparams.from = formattedFrom;
            runparams.to = formattedTo;
        }
    }
    else {
        const right = str2ms(`@${key}`);
        constraint = `${left} = ${right}`;
        debug = `${left} = ${str2ms(formatDate(val))}`;
        runparams[key] = formatDate(val);
    }

    return { constraint, debug, runparams };
}

const patternYear = utils.getPattern('year');

const year = ({ key, val }) => {
    let constraint;
    let debug;
    const runparams = {};
    let m = val.match(patternYear);

    if (m) {
        const { operator1, year, operator2, from, to } = m.groups;
        const operator = operator1 || operator2;

        if (year) {
            constraint = validOperators[operator](key, `@${key}`);
            debug = validOperators[operator](key, year);
            runparams[key] = Number(year);
        }
        else if (from && to) {
            constraint = validOperators[operator](key, '@from', '@to');
            debug = validOperators[operator](key, from, to);
            runparams.from = Number(from);
            runparams.to = Number(to);
        }
    }
    else {
        constraint = `${key} = @${key}`;
        debug = `${key} = ${val}`;
        runparams[key] = Number(val);
    }

    return { constraint, debug, runparams };
}

export { year, date }