import fs from 'fs';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;

// see https://ajv.js.org/packages/ajv-errors.html
import Ajv from 'ajv';
const ajv = new Ajv(config.ajv.opts);

import { ddutils } from '../data-dictionary/utils/index.js';

/**
 * Returns a three-level directory path to store xml. 
 * @param {string} xml - the input xml.
 * @param {object} param - the param object.
 */
function pathToXml(xml) {
    const one = xml.substring(0, 1);
    const two = xml.substring(0, 2);
    const thr = xml.substring(0, 3);
    return `${truebug.dirs.archive}/${one}/${two}/${thr}`;
}

/** 
 * 't' is an array of seconds and nanoseconds.
 * convert 't' into s and ms 
 */
function timerFormat(t) {
    return `${t[0]}s ${(t[1]/10e6).toFixed(2)}ms`;
}

function t2ms(t) {
    return Number((t[0] * 1000) + (t[1]/10e6));
}

/** 
 * various regexp patterns to be used in other constructions
 */
// const re = {
//     date: '[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|yesterday',
//     year: '[0-9]{4}',
//     int: '[0-9]+',
//     num: '([+-]?([0-9]+)(\.[0-9]+)?)',
//     quotes: `['"]`,
//     spc: '\\s*',
//     text: '(\\w|\\s)+',
//     glob: '\\*',
//     units: 'kilometers|miles',
//     open_parens: '\\(',
//     close_parens: '\\)',
//     open_curly: '\\{',
//     close_curly: '\\}',
//     linebreaks: new RegExp('(?:\\r\\n|\\r|\\n)', 'g'),
//     double_spc: new RegExp('\\s+', 'g'),
//     space_comma: new RegExp('\\s+,', 'g'),
//     space_colon: new RegExp('\\s+:', 'g'),
//     space_period: new RegExp('\\s+\\.', 'g'),
//     openparens_space: new RegExp('\\(\\s+', 'g'),
//     space_closeparens: new RegExp('\\s+\\)', 'g'),
//     treatmentId: new RegExp('^[a-zA-Z0-9]{32}$')
// };

function getPattern(zqltype) {

    // various regexp patterns
    const re = {
        date: '[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|yesterday',
        year: '[0-9]{4}',
        int: '[0-9]+',
        num: '([+-]?([0-9]+)(\.[0-9]+)?)',
        quotes: `['"]`,
        spc: '\\s*',
        text: '(\\w|\\s)+',
        glob: '\\*',
        units: 'kilometers|miles',
        open_parens: '\\(',
        close_parens: '\\)',
        open_curly: '\\{',
        close_curly: '\\}',
        linebreaks: new RegExp('(?:\\r\\n|\\r|\\n)', 'g'),
        double_spc: new RegExp('\\s+', 'g'),
        space_comma: new RegExp('\\s+,', 'g'),
        space_colon: new RegExp('\\s+:', 'g'),
        space_period: new RegExp('\\s+\\.', 'g'),
        openparens_space: new RegExp('\\(\\s+', 'g'),
        space_closeparens: new RegExp('\\s+\\)', 'g'),
        treatmentId: new RegExp('^[a-zA-Z0-9]{32}$')
    };

    if (zqltype === 'geolocation') {

        // within(radius:30.5,units:'kilometers',lat:20.1,lng:-120.32)
        // 
        const operator    = '(?<operator>within)';
        const radius      = `radius:${re.spc}(?<radius>${re.num})`;
        const units       = `units:${re.spc}${re.quotes}(?<units>${re.units})${re.quotes}`;
        const lat         = `lat:${re.spc}(?<lat>${re.num})`;
        const lng         = `lng:${re.spc}(?<lng>${re.num})`;
        const condition1  = `${radius},${re.spc}${units},${re.spc}${lat},${re.spc}${lng}`;    

        // within(min_lat:20.1,min_lng:-120.32,max_lat:20.1,max_lng:-120.32)
        // 
        const min_lat     = `min_lat:${re.spc}(?<min_lat>${re.num})`;
        const min_lng     = `min_lng:${re.spc}(?<min_lng>${re.num})`;
        const max_lat     = `max_lat:${re.spc}(?<max_lat>${re.num})`;
        const max_lng     = `max_lng:${re.spc}(?<max_lng>${re.num})`;
        const condition2  = `${min_lat},${min_lng},${max_lat},${max_lng}`;

        return `${operator}${re.open_parens}(${condition1}|${condition2})${re.close_parens}`;
    }
    else if (zqltype === 'datetime') {
        const operator1  = `(?<operator1>eq|since|until)?`;
        const condition1 = `(?<date>${re.date})`;
        const pattern1   = `${operator1}${re.open_parens}${condition1}${re.close_parens}`

        const operator2  = `(?<operator2>between)?`;
        const condition2 = `(?<from>${re.date})${re.spc}and${re.spc}(?<to>${re.date})`;
        const pattern2   = `${operator2}${re.open_parens}${condition2}${re.close_parens}`;

        return `${pattern1}|${pattern2}`;
    }
    else if (zqltype === 'year') {
        const operator1  = `(?<operator1>eq|since|until)?`;
        const condition1 = `(?<year>${re.year})`;
        const pattern1   = `${operator1}${re.open_parens}${condition1}${re.close_parens}`

        const operator2  = `(?<operator2>between)?`;
        const condition2 = `(?<from>${re.year})${re.spc}and${re.spc}(?<to>${re.year})`;
        const pattern2   = `${operator2}${re.open_parens}${condition2}${re.close_parens}`;

        return `${pattern1}|${pattern2}`;
    }
    else if (zqltype === 'text') {
        const operator = '(?<operator>(eq|ne|starts_with|ends_with|contains|not_like))';
        const preglob  = `(?<preglob>${re.glob}?)`;
        const postglob = `(?<postglob>${re.glob}?)`;
        const operand1  = `(?<operand1>[^)]*)`;
        const operand2  = `(?<operand2>.+)`;

        //return `(${operator}${re.open_parens}|${preglob})${operand}(${re.close_parens}|${postglob})`;
        return `${operator}${re.open_parens}${operand1}${re.close_parens}|${operand2}`;
    }
    else if (zqltype === 'baredate') {
        return re.date;
    }
    else if (zqltype === 'bareyear') {
        return re.year;
    }
    else if (zqltype === 'treatmentId') {
        return re.treatmentId;
    }
    else if (zqltype === 'all') {
        return re;
    }
    else {
        throw Error(`unknown pattern requested: ${zqltype}`);
    }

}

function addExternalParams(externalParams) {
    const allNewParams = [];
    
    externalParams.forEach(({ dict, cols }) => {
        
        const newParams = cols.map(col => {
            const origParam = dict.params.filter(p => p.name === col.name)[0];
            
            if (origParam) {
                const newParam = JSON.parse(JSON.stringify(origParam));
                newParam.external = true;

                if (!newParam.selname) {
                    newParam.selname = `${dict.name}.${newParam.name}`;
                }
                
                if (!newParam.where) {
                    newParam.where = `${dict.name}.${newParam.name}`;
                }

                // By default, the defaultCol flag for all external params is
                // set to false. That way, they are not returned when a query
                // is made without any cols. This way, no needless JOINs are 
                // performed.
                if (!newParam.defaultCol) {
                    newParam.defaultCol = false;
                }
                
                newParam.joins = col.joins;
                return newParam;
            }
        });

        allNewParams.push(...newParams);
    });

    return allNewParams;
}

function insertAndReturnFk({ insert, select }) {
    return ({ table, key, value, cache }) => {
        const cacheSegment = table;
    
        let id;     
    
        if (cache[cacheSegment].has(value)) {
            id = cache[cacheSegment].get(value);
        }
        else {
            try {
                insert.run(value);
                id = select.get(value).id;
                cache[cacheSegment].set(value, id);
            }
            catch (error) {
                console.log(`${key} id: ${id}, value: ${value}`);
                console.log(error);
            }
        }
    
        const res = {};
        res[key] = id;
        return res;
    }
}

function checkDir({ dir, removeFiles = true, zlog }) {
    const zlogLevel = zlog.level();
    zlog.setLevel('info');
    zlog.info(`checking if dir "${dir}" exists…`);
    const exists = fs.existsSync(dir);

    if (exists) {
        zlog.info('✅ yes, it does');

        if (removeFiles) {
            zlog.info(`removing all files from ${dir} directory…`, 'start');

            if (truebug.mode !== 'dryRun') {
                fs.readdirSync(dir)
                    .forEach(f => fs.rmSync(`${dir}/${f}`));
            }

            zlog.info(' done\n', 'end');
        }
    }
    else {
        zlog.info(" ❌ it doesn't exist, so making it\n", 'end');
        
        if (truebug.mode !== 'dryRun') {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    zlog.setLevel(zlogLevel);
}

// see https://sqlite.org/forum/forumpost/1f173cd9ea810bd0
function unixEpochMs(column) {
    return column
        ? `INTEGER GENERATED ALWAYS AS (
    (julianday(${column}) - 2440587.5) * 86400 * 1000
) STORED`
        : 'INTEGER DEFAULT ((julianday() - 2440587.5) * 86400 * 1000)';
};

/**
 * Takes a request and returns a its search params standardized for 
 * converting to a cache key. 
 * @param {object} request - the request object.
 */
function getQueryForCache(request) {
    let query;

    if (request.query.heyzai) {
        query = request.query.heyzai;
    }
    else {
        const resource = request.url.split('?')[0];
        const searchParams = new URLSearchParams(request.query);
        
        [ 'facets', 'relatedRecords' ].forEach(p => {
            if (searchParams.get(p) === 'false') {
                searchParams.delete(p);
            }
        });

        [ 'deleted', 'refreshCache', 'cacheDuration' ].forEach(p => {
            if (searchParams.has(p)) {
                searchParams.delete(p);
            }
        });

        searchParams.sort();
        query = `${resource}?${searchParams.toString()}`;
    }
    
    return query
}

function formatSql(sql) {
    return sql.replaceAll(/\n/g, ' ').replaceAll(/\s{2,}/g, ' ').replace(/^\s/, '').replace(/\s$/, '')
}

// map zop to sql operator
const _zops = {

    // numeric and string operators
    eq            : '=',
    ne            : '!=',

    // numeric operators
    gte           : '>=',
    lte           : '<=',
    gt            : '>',
    lt            : '<',
    
    // also between

    // string operators
    '='           : 'LIKE',
    like          : 'LIKE',
    starts_with   : 'LIKE',
    ends_with     : 'LIKE',
    contains      : 'LIKE',
    not_like      : 'NOT LIKE',

    // date operators
    between       : 'BETWEEN',
    since         : '>=',
    until         : '<=',

    // spatial operator
    within        : 'BETWEEN',
    contained_in  : 'BETWEEN',

    // fts5
    match         : 'MATCH'
};

const CACHE = {};

function queryCache(resource) {
    
    if (!('_defaultOps' in CACHE)) {
        
        CACHE._defaultOps = {};

        if (!(resource in CACHE._defaultOps)) {
            
            const queryableParams = ddutils.getParams(resource)
                 .filter(p => !('notQueryable' in p));

            // https://stackoverflow.com/questions/19874555/how-do-i-convert-array-of-objects-into-one-object-in-javascript
            const _defaultOps = queryableParams
                .reduce((o, i) => Object.assign(o, {[i.name]: i.defaultOp || 'eq'}), {});
            
            CACHE._defaultOps[resource] = _defaultOps;
        }

    }

    return CACHE._defaultOps[resource];
}

// check if the submitted params conform to the schema
function validate({ resource, params }) {
    const schema = {
        type: 'object',
        additionalProperties: false,
        properties: ddutils.getQueryStringSchema(resource)
    };
    
    const validator = ajv.compile(schema);
    const valid = validator(params);

    if (valid) {
        // if (params.cols && params.cols.length === 1 && params.cols[0] === '') {
        //     delete params.cols;
        // }

        return params;
    }
    else {
        
        // validation failed
        console.error('😩 validation failed')
        console.error(validator.errors);
        return false;
    }
}

function formatDate(date) {
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

/**
 * We want to categorize queries depending on whether they bypass
 * caching completely, whether or not debugInfo is appended,  
 * if they are adorned with _links or not, and, whether or not they 
 * are 'semantic'
 */
function getQueryType({ resource, params, zlog }) {

    //  queryType = {
    //      db: [ bare, count, resourceId, normal ] | false,
    //      hasLinks: true | false,
    //      hasDebugInfo: true | false,
    //      usesCache: true | false,
    //      isSemantic: true | false
    //  }
    const queryType = {};

    function isResourceIdQuery(resource) {
        const resourceId = ddutils.getResourceId(resource);

        if (resourceId && resourceId !== 'none') {
            const resourceIdName = resourceId.name;

            if (resourceIdName in params) {
                return true;
            }

        }

        return false;
    }

    function isBareQuery(params) {

        // A query is a bare query if only non-sql cols are 
        // present in the params.
        const nonSqlCols = ddutils.getNotCols();
        const paramKeys = Object.keys(params);

        if (paramKeys.every(p => nonSqlCols.indexOf(p) > -1)) {
            return true;
        }

        return false;
    }

    if (params.cols) {

        // It is a db query, but what kind of db? Let's find out
        if (params.cols.length === 1 && params.cols[0] === '') {
            delete params.cols;
            queryType.isDb = 'count';
        }
        else if (isResourceIdQuery(resource)) {
            queryType.isDb = 'resourceId';
        }
        else if (isBareQuery(params)) {
            queryType.isDb = 'bare';
        }
        else {
            queryType.isDb = 'normal';
        }
    }
    else {
        queryType.isDb = false;
    }

    // Not a db query, so let's figure out other types
    if (params.heyzai) {

        // never add _links because the response is not 
        // page-able
        queryType.hasLinks = false;

        // add debug info that will result from the ftsSearch
        // and the associated images searches
        queryType.hasDebugInfo = true;

        // Now, determine what kind of zai query is it
        const qords = params.heyzai.split(' ');

        if (qords[0].toLowerCase() === 'describe') {

            // doesn't use cache and is not semantic
            queryType.usesCache = false;
            queryType.isSemantic = false;
        }
        else {

            // uses cache and is semantic
            queryType.usesCache = true;
            queryType.isSemantic = true;
        }

    }
    else if (params.cachedQueries) {

        // never add _links
        queryType.hasLinks = false;

        // doesn't cache the result
        queryType.usesCache = false;

        // the query itself is not semantic 
        // (even though only semantic queries are retrieved)
        queryType.isSemantic = false;

        // doesn't have any associated debugInfo
        queryType.hasDebugInfo = false;
    }
    else {

        // db queries have _links, are cached, and have debugInfo
        queryType.hasLinks = true;
        queryType.usesCache = true;
        queryType.hasDebugInfo = true;
        queryType.isSemantic = false;
    }
    
    zlog.info(queryType);
    
    return queryType
}

export { 
    pathToXml, 
    timerFormat, 
    t2ms,
    getPattern, 
    addExternalParams,
    insertAndReturnFk,
    checkDir,
    unixEpochMs,
    getQueryForCache,
    formatSql,
    _zops,
    validate,
    formatDate,
    getQueryType,
    queryCache
}