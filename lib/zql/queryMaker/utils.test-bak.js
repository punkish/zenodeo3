import { validate } from "./utils.js";

const preZql = (searchparams) => {
    
    const params = {};
    const sp = new URLSearchParams(searchparams);

    // https://stackoverflow.com/a/67111094/183692
    // Set will return only unique keys()
    //
    new Set([...sp.keys()])
        .forEach(key => {
            params[key] = sp.getAll(key).length > 1 
            
                // get multiple values 
                //
                ? sp.getAll(key) 
                
                // get single value 
                //
                : sp.get(key);
        });
        
    // const { queries, runparams } = zql({ resource, params });
    // return { queries, runparams, params };
    return params;
}

const resource = 'treatments';
const searchparams = 'q=agosti';

const params = preZql(searchparams);
const validated_params = validate({
    resource,
    params
});