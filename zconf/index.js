import * as dotenv from 'dotenv';
dotenv.config();

import { development } from '../config/development.js';
import { test } from '../config/test.js';
import { production } from '../config/production.js';

let config = development;

if (process.env.NODE_ENV === 'test') {
    config = {...config, ...test}
}

if (process.env.NODE_ENV === 'production') {
    config = {...config, ...production}
}

export { config };