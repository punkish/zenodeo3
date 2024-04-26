import fs from 'fs';
import path from 'path';

/*
 * Create a cache (default options are shown below)
 *
 * const cache = new Cache(
 *      { 
 *          // The directory where the cache is stored.
 *          //
 *          // Default is a dir called 'cache'
 *          dir: './cache'
 * 
 *          // Duration ttl in ms for each entry. 
 *          //
 *          // Default is 1 day
 *          duration: 1 * 24 * 60 * 60 * 1000, 
 * 
 *          // A namespace to isolate the cache.
 *          // Namespaces can be cleared without clearing the 
 *          // entire cache. For example, if there are multiple 
 *          // namespaces -- 'default', 'employees', 'partner' -- 
 *          // cache.clear('employees') will clear only that 
 *          // namespace and leave the others alone.
 *          //
 *          // Default is 'default'.
 *          namespace: 'default', 
 * 
 *          // cache methods synchronous or asynchronous. An 
 *          // async cache uses async/await
 *          //
 *          // Default is sync = true
 *          sync: true 
 *      });
 * 
 * The following methods are available
 * 
 * =================================================================
 * method   | description                                           
 * -----------------------------------------------------------------
 * get      | get(key) retrieves key from cache                     
 * set      | set(key, val) sets key to val in cache                
 * has      | has(key) returns true if key exists in cache          
 * rm       | rm(key) removes key from cache
 * delete   | delete(key) -- synonym for rm    
 * clear    | clear(namespace) deletes the entire cache namespace           
 * keys     | keys() lists all the keys in the cache                
 * all      | all() lists all the keys and their values in the cache
 * opts     | opts() lists all the cache options                    
 * ================================================================= 
 * 
 */

class Cache {

    constructor(opts) {
        const defaultOpts = {
            dir: './cache',

            namespace: 'default',

            // one day in milliseconds
            duration: 1 * 24 * 60 * 60 * 1000,

            // use synchronous or asynchronous methods
            sync: true
        }

        Object.assign(this, defaultOpts,  opts);
        this.nsdir = `${this.dir}/${this.namespace}`;
        this.sync 
            ? mkdirSync(this.dir) 
            : mkdirAsync(this.dir);
    }

    get = (key) => {
        if (!key) {
            console.error("error: 'key' is required to get its value");
            return false;
        }

        return this.sync 
            ? getSync(this.nsdir, key) 
            : getAsync(this.nsdir, key);
    }

    set = (key, val) => {
        if (!key) {
            console.error("error: 'key' is required to set its value");
            return false;
        } 

        const data = {
            item: val,
            stored: Date.now(),
            ttl: this.duration
        };

        return this.sync 
            ? setSync(this.nsdir, key, data)
            : setAsync(this.nsdir, key, data);
    }

    has = (key) => {
        if (!key) {
            console.error("error: 'key' is required for has(key) to work");
            return false;
        } 

        const file = `${this.nsdir}/${key2path(key)}/${key}.json`;
        return this.sync 
            ? hasSync(file) 
            : hasAsync(file);
    }

    rm = (key) => {
        if (!key) {
            console.error("error: 'key' is required to remove it from cache");
            return false;
        }

        const file = `${this.nsdir}/${key2path(key)}/${key}.json`;
        return this.sync 
            ? rmSync(file) 
            : rmAsync(file);
    }

    delete = (key) => this.rm(key);

    clear = (namespace) => {
        if (!namespace) {
            console.error("error: 'namespace' is required to clear cache");
            return false;
        }

        return this.sync 
            ? clearSync(this.nsdir) 
            : clearAsync(this.nsdir);
    }
  
    keys = () => this.sync 
        ? walkSync(this.nsdir) 
        : walkAsync(this.nsdir);

    all = () => this.sync 
        ? allSync(this.nsdir) 
        : allAsync(this.nsdir);

    opts = () => {
        return {
            dir: this.dir,
            namespace: this.namespace,
            duration: this.duration,
            sync: this.sync
        };
    }
}

/*******************************
 *  common utility functions   *
 *******************************/                  

/*
 * key2path
 * convert a key into a 3-level directory path
 */
const key2path = (key) => {
    const one = key.substring(0, 1);
    const two = key.substring(0, 2);
    const thr = key.substring(0, 3);
    return `${one}/${two}/${thr}`;
}

/*******************************/
/*    synchronous functions    */
/*******************************/

const mkdirSync = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/*
 * walk a directory and return all the entries as an array
 * see https://stackoverflow.com/a/16684530/183692
 */
const walkSync = function(dir, results = []) {

    // the `withFileTypes` option saves having to call stat() on every file
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (let file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
            walkSync(fullPath, results);
        } 
        else if (path.extname(file.name) === '.json') {

            /* Is a file */
            const key = path.basename(file.name, '.json');
            results.push(key);
        }
    }

    return results;
}

const getSync = (dir, key) => {
    const filepath = key2path(key);
    const file = `${dir}/${filepath}/${key}.json`;

    // const error_is_stale = `error: value of key '${key}' is stale`;
    // const error_no_exist = `error: key '${key}' doesn't exist`;

    if (fs.existsSync(file)) {
        const d = JSON.parse(fs.readFileSync(file));

        if ((d.stored + d.ttl) > Date.now()) {
            return d;
        }

        //console.error(error_is_stale);
        return false;
    }
    
    //console.error(error_no_exist);
    return false;
}

const setSync = (dir, key, data) => {
    const filepath = `${dir}/${key2path(key)}`;
    const file = `${filepath}/${key}.json`;

    mkdirSync(filepath);    
    fs.writeFileSync(file, JSON.stringify(data));
    return data;
}

const hasSync = (file) => {
    if (fs.existsSync(file)) {
        return true;
    }

    return false;
}

const rmSync = (file) => {
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        return true;
    }
    
    //console.error(error_exist);
    return false;
}

const clearSync = (dir) => {
    if (fs.existsSync(dir)) {
        fs.unlinkSync(dir);
        return true;
    }
    
    //console.error(`error: '${dir}' doesn't exist`);
    return false;
}

const allSync = (dir) => {const all = [];
    const keys = walkSync(dir);

    for (let key of keys) {
        const val = getSync(dir, key);
        all.push([key, val])
    }

    return all;
}

/*******************************/
/*   asynchronous functions    */
/*******************************/

const mkdirAsync = async (dir) => {
    try {

        // check if dir exists
        await fs.promises.access(dir, fs.constants.F_OK);

        // yes, it does
        // move on
    }
    catch (error) {

        // dir doesn't exist, so make it first
        try {
            await fs.promises.mkdir(dir, { recursive: true });
        }
        catch (error) {
            console.error(error);
        }
    }
}

/*
 * walk a directory and return all the entries as an array
 * see https://stackoverflow.com/a/16684530/183692
 */
const walkAsync = async (dir, results = []) => {

    // the `withFileTypes` option saves having to call stat() on every file
    const files = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
            await walkAsync(fullPath, results);
        } 
        else if (path.extname(file.name) === '.json') {

            /* Is a file */
            const key = path.basename(file.name, '.json');
            results.push(key);
        }
    }

    return results;
}

const getAsync = async (dir, key) => {
    const filepath = key2path(key);
    const file = `${dir}/${filepath}/${key}.json`;

    // const error_is_stale = `error: value of key '${key}' is stale`;
    // const error_no_exist = `error: key '${key}' doesn't exist`;

    try {
        const data = await fs.promises.readFile(file, 'utf8');
        const d = JSON.parse(data);
        
        if (d.stored + d.ttl > Date.now()) {
            return d;
        }

        //console.error(error_is_stale);
        return false;
    }

    // if there was an error reading the file
    catch (error) {
        console.log(error);
        return false;
    }
}

const setAsync = async (dir, key, data) => {
    const filepath = `${dir}/${key2path(key)}`;
    const file = `${filepath}/${key}.json`;

    await mkdirAsync(filepath); 
    await fs.promises.writeFile(file, JSON.stringify(data));
    return data;
}

const hasAsync = async (file) => {
    try {

        // check if file exists
        await fs.promises.access(file, fs.constants.F_OK);

        // yes, it does
        // move on
        return true;
    }
    catch (error) {

        // file doesn't exist
        return false;
    }
}

const rmAsync = async (file) => {
    try {

        // check if file exists
        await fs.promises.access(file, fs.constants.F_OK);

        // yes, it does, remove it
        await fs.promises.rm(file);
        return true;
    }
    catch (error) {

        // file doesn't exist
        return false;
    }
}

const clearAsync = async (dir) => {
    try {

        // check if file exists
        await fs.promises.access(dir, fs.constants.F_OK);

        // yes, it does, remove it
        await fs.promises.rm(dir, { recursive: true });
        return true;
    }
    catch (error) {

        // file doesn't exist
        return false;
    }
}

const allAsync = async (dir) => {
    const all = [];
    const keys = await walkAsync(dir);

    for (let key of keys) {
        const val = await getAsync(dir, key);
        all.push([key, val])
    }

    return all;
}

export { Cache };