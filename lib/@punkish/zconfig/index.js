import fs from 'fs';
import path from 'path';
const cwd = process.cwd();
const configDir = path.join(cwd, 'config');

/**
 * The following two lines make "require" available
 * in an es6 module
**/
import { createRequire } from "module";
const require = createRequire(import.meta.url);

class Config {
    constructor() {
        this.settings = readConfig();
    }
}

const mergeDeep = (target = {}, ...sources) => {
    const isObject = (item) => {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }

    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) {
                    Object.assign(target, { [key]: {} });
                }

                mergeDeep(target[key], source[key]);
            } 
            else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

const readConfig = () => {
    const files = fs.readdirSync(configDir);

    const baseConfigFile = files
        .filter(f => f === 'development.cjs' || f === 'default.cjs')[0];

    const settings = require(`${configDir}/${baseConfigFile}`);

    /** 
     * merge 'test' or 'production' as required. 
     * Either use `dotenv` to store NODE_ENV in .env and 
     * and import it in your program or run your program 
     * with `NODE_ENV=test node program.js`
    **/
    files
        .filter(f => f !== baseConfigFile)
        .forEach(f => {
            const env = path.basename(f, '.cjs');

            if (process.env.NODE_ENV === env) {
                mergeDeep(settings, require(`${configDir}/${f}`));
            }
        })

    return settings;
}

export { Config }