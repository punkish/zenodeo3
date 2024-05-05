export const nonZql = ({ col, val, operator }) => {
    const runparams = {};
    
    switch (operator) {

        case 'MATCH':
            runparams[col.name] = val;
            runparams.cssClass = 'hilite';
            runparams.sides = 50;
            break;

        // treatmentTitle=Biodiversity
        // treatmentTitle=starts_with(Biodiversity)
        // treatmentTitle=Biodiversity*
        case 'LIKE':
            runparams[col.name] = `${val}%`;
            break;

        case '=':
        case '!=':
        case 'NOT LIKE':
            runparams[col.name] = val;
            break;
    }
    

    return { 
        constraint: `${col.where} ${operator} @${col.name}`, 
        runparams 
    }
}