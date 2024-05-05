export const number = ({ col, val, operator }) => {
    const runparams = {};
    runparams[col.name] = val;

    return { 
        constraint: `${col.where} ${operator} @${col.name}`, 
        runparams 
    }
 }