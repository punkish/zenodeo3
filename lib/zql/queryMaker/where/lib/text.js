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
const text = ({ col, val, operator, isZai }) => {
    const left = col.where;
    const right = isZai ? `@${col.name} COLLATE NOCASE` : col.name;
    let sqloperator;

    switch (operator) {

        // treatmentTitle=Biodiversity
        // treatmentTitle=starts_with(Biodiversity)
        // treatmentTitle=Biodiversity*
        case '=':
        case 'starts_with':
        case 'postglob':
            sqloperator = 'LIKE';
            val = `${val}%`;
            break;

        case 'ends_with':
        case 'preglob':
            sqloperator = 'LIKE';
            val = `%${val}`;
            break;

        case 'contains':
        case 'bothglobs':
            sqloperator = 'LIKE';
            val = `%${val}%`;
            break;

        case 'eq':
            sqloperator = '=';
            break;

        case 'ne':
            sqloperator = '!=';
            break;

        case 'not_like':
            sqloperator = 'NOT LIKE';
    }
    
    const runparams = {};
    runparams[col.name] = val;

    return { 
        constraint: `${left} ${sqloperator} ${right}`, 
        runparams 
    };
}

export { text }