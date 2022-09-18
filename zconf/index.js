import * as dotenv from 'dotenv';
dotenv.config();

import { development } from '../config/development.js';
import { test } from '../config/test.js';
import { production } from '../config/production.js';
import process from 'node:process';
let config = development;

// https://thewebdev.info/2021/03/06/how-to-deep-merge-javascript-objects/
const mergeDeep = (target, ...sources) => {

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

if (process.env.NODE_ENV === 'test') {
    config = mergeDeep(config, test)
}

if (process.env.NODE_ENV === 'production') {
    config = mergeDeep(config, production);
}

export { config };