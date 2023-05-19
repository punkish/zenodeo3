export const boolean = (val, col) => {
   const left = col.selname;
   const right = val === true ? 1 : 0;
   const constraint = {
      bind: `${left} = @${col.name}`,
      vals: `${left} = ${right}`
   };
   
   const runparams = {};
   runparams[col.name] = right;

   return { constraint, runparams }
}