export const boolean = ({ col, val, operator }) => {

   val = val === 'true' || val === true
      ? 1
      : 0;

   const runparams = {};
   runparams[col.name] = val;

   return { 
      constraint: `${col.where} ${operator} @${col.name}`, 
      runparams 
   }
}