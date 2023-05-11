import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;

const pathToXml = (xml) => {
    const one = xml.substr(0, 1);
    const two = xml.substr(0, 2);
    const thr = xml.substr(0, 3);
    const dir = `${truebug.dirs.archive}/${one}/${two}/${thr}`;

    return dir;
}

// const stack = {};

// const incrementStack = (module, fn) => {
    
//     const incrFn = (fn) => {
//         if (fn in stack[module]) {
//             stack[module][fn]++;
//         }
//         else {
//             stack[module][fn] = 1;
//         }
//     }

//     if (!(module in stack)) {
//         stack[module] = {};
//     }
    
//     incrFn(fn);
// }

/** 
 * 't' is an array of seconds and nanoseconds.
 * convert 't' into s and ms 
 */
const timerFormat = (t) => `${t[0]}s ${(t[1]/10e6).toFixed(2)}ms`;

/** 
 * various regexp patterns to be used in other constructions
 */
const re = {
    date: '[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|yesterday',
    year: '[0-9]{4}',
    int: '[0-9]+',
    num: '([+-]?([0-9]+)(\.[0-9]+)?)',
    quotes: `['"]`,
    spc: '\\s*',
    text: '\\w+',
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

const getPattern = (zqltype) => {
    let pattern;

    if (zqltype === 'geolocation') {

        /**
         * within(radius:30,units:'kilometers',lat:20.1,lng:-120.32)
         */
        const operator1   = '(?<operator1>within)';
        const radius      = `radius:${re.spc}(?<radius>${re.int})`;
        const units       = `units:${re.spc}${re.quotes}(?<units>${re.units})${re.quotes}`;
        const lat         = `lat:${re.spc}(?<lat>${re.num})`;
        const lng         = `lng:${re.spc}(?<lng>${re.num})`;
        const condition1  = `${radius},${re.spc}${units},${re.spc}${lat},${re.spc}${lng}`;
        const pattern1    = `${operator1}${re.open_parens}${condition1}${re.close_parens}`;      

        /**
         * bbox(min_lat:20.1,min_lng:-120.32,max_lat:20.1,max_lng:-120.32)
         */
        const operator2   = '(?<operator2>bbox)';
        const min_lat     = `min_lat:${re.spc}(?<min_lat>${re.num})`;
        const min_lng     = `min_lng:${re.spc}(?<min_lng>${re.num})`;
        const max_lat     = `max_lat:${re.spc}(?<max_lat>${re.num})`;
        const max_lng     = `max_lng:${re.spc}(?<max_lng>${re.num})`;
        // const lower_left  = `lower_left:${re.open_curly}${re.spc}${min_lat},${re.spc}${min_lng}${re.close_curly}`;
        // const upper_right = `upper_right:${re.open_curly}${re.spc}${max_lat},${re.spc}${max_lng}${re.close_curly}`;
        const condition2  = `${min_lat},${min_lng},${max_lat},${max_lng}`;
        const pattern2    = `${operator2}${re.open_parens}${condition2}${re.close_parens}`;

        pattern           = `${pattern1}|${pattern2}`;
    }
    if (zqltype === 'geolocation2') {

        /**
         * within(radius:30,units:'kilometers',lat:20.1,lng:-120.32)
         */
        const operator    = '(?<operator>within)';
        const radius      = `radius:${re.spc}(?<radius>${re.int})`;
        const units       = `units:${re.spc}${re.quotes}(?<units>${re.units})${re.quotes}`;
        const lat         = `lat:${re.spc}(?<lat>${re.num})`;
        const lng         = `lng:${re.spc}(?<lng>${re.num})`;
        const condition1  = `${radius},${re.spc}${units},${re.spc}${lat},${re.spc}${lng}`;
        //const pattern1    = `${operator1}${re.open_parens}${condition1}${re.close_parens}`;      

        /**
         * bbox(min_lat:20.1,min_lng:-120.32,max_lat:20.1,max_lng:-120.32)
         */
        //const operator2   = '(?<operator2>bbox)';
        const min_lat     = `min_lat:${re.spc}(?<min_lat>${re.num})`;
        const min_lng     = `min_lng:${re.spc}(?<min_lng>${re.num})`;
        const max_lat     = `max_lat:${re.spc}(?<max_lat>${re.num})`;
        const max_lng     = `max_lng:${re.spc}(?<max_lng>${re.num})`;
        // const lower_left  = `lower_left:${re.open_curly}${re.spc}${min_lat},${re.spc}${min_lng}${re.close_curly}`;
        // const upper_right = `upper_right:${re.open_curly}${re.spc}${max_lat},${re.spc}${max_lng}${re.close_curly}`;
        const condition2  = `${min_lat},${min_lng},${max_lat},${max_lng}`;
        //const pattern2    = `${operator2}${re.open_parens}${condition2}${re.close_parens}`;

        pattern           = `${operator}${re.open_parens}${condition1}|${condition2}${re.close_parens}`;
    }
    else if (zqltype === 'date') {
        const operator1   = `(?<operator1>eq|since|until)?`;
        const condition1  = `(?<date>${re.date})`;
        const pattern1    = `${operator1}${re.open_parens}${condition1}${re.close_parens}`

        const operator2   = `(?<operator2>between)?`;
        const condition2  = `(?<from>${re.date})${re.spc}and${re.spc}(?<to>${re.date})`;
        const pattern2    = `${operator2}${re.open_parens}${condition2}${re.close_parens}`;

        pattern           = `${pattern1}|${pattern2}`;
    }
    else if (zqltype === 'year') {
        const operator1   = `(?<operator1>eq|since|until)?`;
        const condition1  = `(?<year>${re.year})`;
        const pattern1    = `${operator1}${re.open_parens}${condition1}${re.close_parens}`

        const operator2   = `(?<operator2>between)?`;
        const condition2  = `(?<from>${re.year})${re.spc}and${re.spc}(?<to>${re.year})`;
        const pattern2    = `${operator2}${re.open_parens}${condition2}${re.close_parens}`;

        pattern           = `${pattern1}|${pattern2}`;
    }
    else if (zqltype === 'text') {
        const operator         = `(?<operator>(eq|ne|starts_with|ends_with|contains|not_like))?`;
        const condition        = '(?<text>.*)';
        pattern          = `${operator}${re.open_parens}${condition}${re.close_parens}`;
    }
    else if (zqltype === 'text2') {
        const operator = '(?<operator>(eq|ne|starts_with|ends_with|contains|not_like))';
        const preglob  = `(?<preglob>${re.glob}?)`;
        const postglob = `(?<postglob>${re.glob}?)`;
        const operand  = `(?<operand>${re.text})`;
        pattern        = `(${operator}${re.open_parens}|${preglob})${operand}(${re.close_parens}|${postglob})`;
    }

    return pattern;
};

const addExternalDef = (externalParam, resourceName, resourceId, params) => {
    
    // origParam is as the param exists in its original data dictionary
    const origParam = externalParam.dict.params
        .filter(e => e.name === externalParam.name)[0];

    // we start with a copy of the origParam as the basis for 
    // the newParam
    const newParam = JSON.parse(JSON.stringify(origParam));
    newParam.external = true;
    newParam.fk = externalParam.fk || false;

    // name of the parent resource of the external param
    const extParamResourceName = externalParam.dict.name;

    if (!newParam.selname) {
        newParam.selname = `${extParamResourceName}."${newParam.name}"`;
    }
    
    if (!newParam.where) {
        newParam.where = `${extParamResourceName}."${newParam.name}"`;
    }
    
    if (externalParam.joins) {
        newParam.joins = externalParam.joins;
    } else {
        newParam.joins = [
            `JOIN ${extParamResourceName} ON ${resourceName}.id = ${extParamResourceName}.${resourceName}_id`
        ];
    }

    newParam.isResourceId = false;

    //  
    // all externally defined params are set to notDefaultCol 
    // so they are returned only when explicitly queried
    newParam.notDefaultCol = true;

    params.push(newParam);
}

const insertAndReturnFk = ({ insert, select }) => {
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

// see https://sqlite.org/forum/forumpost/1f173cd9ea810bd0
//const UNIXEPOCH_MS = 1000*(strftime('%s','now')+mod(strftime('%f','now'),1));
//const UNIXEPOCH_MS = (julianday() - 2440587.5) * 86400 * 1000;

export { 
    pathToXml, 
    // stack, 
    // incrementStack, 
    timerFormat, 
    re, 
    getPattern, 
    addExternalDef,
    insertAndReturnFk
}

/*
'use strict';

const op1 = '(?<op1>within)';
const op2 = '(?<op2>contained_in)';
const num = '[-+]?[0-9]+\.?[0-9]+';
const int = '[0-9]+';
const qot = `['"]`;
const spc = ' *';
const opp = '\\(';
const clp = '\\)';
const opc = '\\{';
const clc = '\\}';

const rad = `radius:(?<r>${int}),${spc}`;
const unt = `units:${qot}(?<u>kilometers|miles)${qot},${spc}`;
const pnt = `lat:(?<lat>${num}),${spc}lng:(?<lng>${num})${spc}`;
const cn1 = `${op1}${opp}${rad}${unt}${pnt}${clp}`;

const llf = `lower_left:${opc}lat:(?<minlat>${num}),${spc}lng:(?<minlng>${num})${clc}${spc}`;
const upr = `upper_right:${opc}lat:(?<maxlat>${num}),${spc}lng:(?<maxlng>${num})${clc}${spc}`;
const cn2 = `${op2}${opp}${llf},${spc}${upr}${clp}`;


let pattern = `^${cn1}|${cn2}$`;

const input1 = "within(radius:30,units:'kilometers',lat:20.1,lng:-120.32)";
const input2 = "contained_in(lower_left:{lat:20.1,lng:-120.32},upper_right:{lat:20.1,lng:-120.32})";

const re = new RegExp(pattern);
const m1 = input1.match(re);
console.log(m1.groups);
const m2 = input2.match(re);
console.log(m2.groups);
*/