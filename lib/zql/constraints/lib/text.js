'use strict'

import * as utils from '../../../utils.js';

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

const text = ({ key, val }) => {
    let constraint;
    let debug;
    const runparams = {};
    const m = val.match(pattern);

    if (m) {
        const { operator, preglob, operand, postglob } = m.groups;
        
        if (operator) {
            constraint = validOperators[operator](key, `@${key}`);
            debug = validOperators[operator](key, operand);
        }
        else if (preglob && postglob) {
            constraint = validOperators['bothglobs'](key, `@${key}`);
            debug = validOperators['bothglobs'](key, operand);
        }
        else if (preglob) {
            constraint = validOperators['preglob'](key, `@${key}`);
            debug = validOperators['preglob'](key, operand);
        }
        else if (postglob) {
            constraint = validOperators['postglob'](key, `@${key}`);
            debug = validOperators['postglob'](key, operand);
        }
        else {
            constraint = `${key} = @${key}`;
            debug = `${key} = '${operand}'`;
        }

        runparams[key] = operand;
    }
    else {
        constraint = `${key} = @${key}'`;
        debug = `${key} = '${val}'`;
        runparams[key] = val;
    }

    return { constraint, debug, runparams };
}

export { text }