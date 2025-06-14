import debug from 'debug';
const log = debug('lib/dataFromZenodeo');
import { Config } from '@punkish/zconfig';
const config = new Config().settings;

// see https://ajv.js.org/packages/ajv-errors.html
import Ajv from 'ajv';
const ajv = new Ajv(config.ajv.opts);

import { ddutils } from '../../../data-dictionary/utils/index.js';

export { _zops } from './lib/index.js';

// check if the submitted params conform to the schema
const validate = function({ resource, params }) {
    const schema = {
        type: 'object',
        additionalProperties: false,
        properties: ddutils.getQueryStringSchema(resource)
    };
    
    const validator = ajv.compile(schema);
    const valid = validator(params);

    if (valid) {
        if (params.cols && params.cols.length === 1 && params.cols[0] === '') {
            delete params.cols;
        }

        return params;
    }
    else {
        
        // validation failed
        console.error('😩 validation failed')
        console.error(validator.errors);
        return false;
    }
}

const formatDate = (date) => {
    let yyyy;
    let mm;
    let dd;

    if (date === 'yesterday') {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        yyyy = date.getUTCFullYear();
        mm = date.getUTCMonth() + 1;
        dd = date.getUTCDate();
    }
    else {
        [ yyyy, mm, dd ] = date.split('-');
    }

    if (parseInt(mm) < 10) {
        mm = mm.toString().padStart(2, '0');
    }

    if (parseInt(dd) < 10) {
        dd = dd.toString().padStart(2, '0');
    }

    return `${yyyy}-${mm}-${dd}`;
}

const getQueryType = ({ resource, params }) => {
    if (params.cols && params.cols.length === 1 && params.cols[0] === '') {
        delete params.cols;
    }

    if (!('cols' in params)) {
        return 'count';
    }

    const resourceId = ddutils.getResourceId(resource);

    if (resourceId && resourceId !== 'none') {
        const resourceIdName = resourceId.name;

        if (resourceIdName in params) {
            return 'resourceId';
        }
    }

    // A query is a bare query if only non-sql cols are 
    // present in the params.
    const nonSqlCols = ddutils.getNotCols();
    const paramKeys = Object.keys(params);

    if (paramKeys.every(p => nonSqlCols.indexOf(p) > -1)) {
        return 'bare';
    }

    // default queryType
    return 'normal';
}

export {
    validate,
    formatDate,
    getQueryType
}