'use strict'

import * as utils from '../../../../utils.js';

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
const validOperators = {
    'starts_with': (key, operand) => `${key} LIKE '${operand}%'`, 
    'ends_with'  : (key, operand) => `${key} LIKE '%${operand}'`, 
    'contains'   : (key, operand) => `${key} LIKE '%${operand}%'`, 
    'eq'         : (key, operand) => `${key} = '${operand}' COLLATE BINARY`, 
    'ne'         : (key, operand) => `${key} != '${operand}' COLLATE BINARY`, 
    'not_like'   : (key, operand) => `${key} NOT LIKE '${operand}'`,
    'preglob'    : (key, operand) => `${key} LIKE '%${operand}'`,
    'postglob'   : (key, operand) => `${key} LIKE '${operand}%'`,
    'bothglobs'  : (key, operand) => `${key} LIKE '%${operand}%'`
};

const pattern = utils.getPattern('text2');

const text = (key, g, operator) => {
    const constraint = {};
    const runparams = {};
    const { preglob, operand, postglob } = g;
    
    if (operator) {
        constraint.bind = validOperators[operator](key, `@${key}`);
        constraint.vals = validOperators[operator](key, operand);
    }
    else if (preglob && postglob) {
        constraint.bind = validOperators['bothglobs'](key, `@${key}`);
        constraint.vals = validOperators['bothglobs'](key, operand);
    }
    else if (preglob) {
        constraint.bind = validOperators['preglob'](key, `@${key}`);
        constraint.vals = validOperators['preglob'](key, operand);
    }
    else if (postglob) {
        constraint.bind = validOperators['postglob'](key, `@${key}`);
        constraint.vals = validOperators['postglob'](key, operand);
    }
    else {
        constraint.bind = `${key} = @${key}`;
        constraint.vals = `${key} = '${operand}'`;
    }

    runparams[key] = operand;

    return { constraint, runparams };
}

export { text }