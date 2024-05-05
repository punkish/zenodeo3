export const boolean = ({ col, val, operator }) => {

   if (typeof(val) === 'string') {
      if (val === 'true') {
         val = true;
      }
      else if (val === 'false') {
         val = false;
      }
   }

   const runparams = {};
   runparams[col.name] = val;

   return { 
      constraint: `${col.where} ${operator} @${col.name}`, 
      runparams 
   }
}