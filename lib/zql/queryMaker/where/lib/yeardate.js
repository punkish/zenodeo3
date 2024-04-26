'use strict';

import { _zops } from "../../utils.js";

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

/**
 * Convert a date formatted as string to ms since epoch in SQLite3 syntax
 * @param {string} input - date formatted as string
 */
//const str2ms = (input) => `((julianday(${input}) - 2440587.5) * 86400000)`;
const str2ms  = (input) => `Unixepoch(${input}) * 1000`;

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
const date = (col, g) => {
    const constraint = {};
    const runparams = {};

    // ---------------------
    // left
    //
    const left = col.selname;

    // ---------------------
    // operator
    //
    const zop = g.operator1 || g.operator2;

    // convert zoperator to sql operator
    const operator = _zops[zop];

    // ---------------------
    // right values
    //
    const right = {}

    if (g.date) {
        right.bind = str2ms(`@${col.name}`);
        constraint.bind = `${str2ms(left)} ${operator} ${right.bind}`;

        const formattedDate = formatDate(g.date);
        right.vals = str2ms(formattedDate);
        constraint.vals = `${str2ms(left)} ${operator} ${right.vals}`;

        runparams[col.name] = formattedDate;
    }
    else if (g.from && g.to) {
        const rightFrom = str2ms(`@from`);
        const rightTo = str2ms(`@to`);
        constraint.bind = `${str2ms(left)} BETWEEN ${rightFrom} AND ${rightTo}`;

        const formattedFrom = formatDate(g.from);
        const fromAsMsecs = str2ms(formattedFrom);
        const formattedTo = formatDate(g.to);
        const toAsMsecs = str2ms(formattedTo);
        constraint.vals = `${str2ms(left)} BETWEEN ${fromAsMsecs} AND ${toAsMsecs}`;

        runparams.from = formattedFrom;
        runparams.to = formattedTo;
    }

    return { constraint, runparams };
}

const msecs = (col, g) => {
    const constraint = {};
    const runparams = {};

    // ---------------------
    // left
    //
    const left = col.selname;

    // ---------------------
    // operator
    //
    const zop = g.operator1 || g.operator2;

    // convert zoperator to sql operator
    const operator = _zops[zop];

    // ---------------------
    // right values
    //
    const right = {}

    if (g.date) {
        right.bind = str2ms(`@${col.name}`);
        constraint.bind = `${left} ${operator} ${right.bind}`;

        const formattedDate = formatDate(g.date);
        right.vals = str2ms(formattedDate);
        constraint.vals = `${left} ${operator} ${right.vals}`;

        runparams[col.name] = formattedDate;
    }
    else if (g.from && g.to) {
        const rightFrom = str2ms(`@from`);
        const rightTo = str2ms(`@to`);
        constraint.bind = `${left} BETWEEN ${rightFrom} AND ${rightTo}`;

        const formattedFrom = formatDate(g.from);
        const fromAsMsecs = str2ms(formattedFrom);
        const formattedTo = formatDate(g.to);
        const toAsMsecs = str2ms(formattedTo);
        constraint.vals = `${left} BETWEEN ${fromAsMsecs} AND ${toAsMsecs}`;

        runparams.from = formattedFrom;
        runparams.to = formattedTo;
    }

    return { constraint, runparams };
}

/**
 * Return a year-based SQL constraint
 * @param {string} col - name of column.
 * @param {object} g - object with year values.
 */
const year = (col, g) => {
    const constraint = {};
    const runparams = {};

    // ---------------------
    // left
    //
    const left = col.selname;
    
    // ---------------------
    // operator
    //
    const zop = g.operator1 || g.operator2;

    // convert zoperator to sql operator
    const operator = _zops[zop];

    // ---------------------
    // right values
    //
    const right = {}

    if (g.year) {
        right.bind = `@${col.name}`;
        constraint.bind = `${left} ${operator} ${right.bind}`;

        right.vals = year;
        constraint.vals = `${left} ${operator} ${right.vals}`;
        runparams[key] = Number(year);
    }
    else if (g.from && g.to) {
        constraint.bind = `${left} BETWEEN @from AND @to`;
        constraint.vals = `${left} BETWEEN ${from} AND ${to}`;
        runparams.from = Number(from);
        runparams.to = Number(to);
    }

    return { constraint, runparams };
}

export { year, date, msecs }