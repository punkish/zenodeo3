'use strict'

import * as utils from '../../../../utils.js';
import { _zops } from "../../utils.js";

/*
| query                | sql                              |
|----------------------|----------------------------------|
| key=txt              | WHERE key = 'txt'                |
|——————————————————————|——————————————————————————————————|
| key=txt*             | WHERE key LIKE 'txt%'            |
| key=starts_with(txt) |                                  |
|——————————————————————|——————————————————————————————————|
| key=*txt             | WHERE key LIKE '%txt'            |
| key=ends_with(txt)   |                                  |
|——————————————————————|——————————————————————————————————|
| key=*txt*            | WHERE key LIKE '%txt%'           |
| key=contains(txt)    |                                  |
|——————————————————————|——————————————————————————————————|
| key=eq(Txt)          | WHERE key = 'Txt' COLLATE BINARY |
*/

//
// to make a constraint, we need 
// - left      : col.selname
// - operator  : zql -> sql
// - right.bind: @<col.name>
// - right.vals: val extracted from g
//

//
// pattern
//----------------------------------------------------------
// <operator>: eq|ne|starts_with|ends_with|contains|not_like
// <preglob> : * 
// <operand> : <text to match>
// <postglob>: *
//
const text = (col, g) => {
    const constraint = {};
    const runparams = {};
    
    // ---------------------
    // left
    //
    const left = col.selname;

    // ---------------------
    // operator
    //
    const zop = g.operator;
    let globs;

    if (g.preglob && g.postglob) {
        globs = 'bothglobs';
    }
    else if (g.preglob) {
        globs = 'preglob';
    }
    else if (g.postglob) {
        globs = 'postglob';
    }

    const operator = zop || globs;

    // ---------------------
    // right
    //
    const right = {};
    right.bind = col.name;
    right.vals = g.operand;

    // console.log(`zop: ${zop}`);
    // console.log(`globs: ${globs}`);
    // console.log(`operator: ${operator}`);

    switch (operator) {
        case 'starts_with':
        case 'postglob':
            constraint.bind = `${left} LIKE @${right.bind}`;
            constraint.vals = `${left} LIKE ${right.vals}%`;
            runparams[col.name] = `${right.vals}%`;
            break;

        case 'ends_with':
        case 'preglob':
            constraint.bind = `${left} LIKE @${right.bind}`;
            constraint.vals = `${left} LIKE %${right.vals}`;
            runparams[col.name] = `%${right.vals}`;
            break;

        case 'contains':
        case 'bothglobs':
            constraint.bind = `${left} LIKE @${right.bind}`;
            constraint.vals = `${left} LIKE %${right.vals}%`;
            runparams[col.name] = `%${right.vals}%`;
            break;

        case 'eq':
            constraint.bind = `${left} = @${right.bind}`;
            constraint.vals = `${left} =  ${right.vals}`;
            runparams[col.name] = `${right.vals}`;
            break;

        case 'ne':
            constraint.bind = `${left} != @${right.bind}`;
            constraint.vals = `${left} !=  ${right.vals}`;
            runparams[col.name] = `${right.vals}`;
            break;

        case 'not_like':
            constraint.bind = `${left} NOT LIKE @${right.bind}`;
            constraint.vals = `${left} NOT LIKE  ${right.vals}%`;
            runparams[col.name] = `${right.vals}`;
    }
    
    return { constraint, runparams };
}

export { text }