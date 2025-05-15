import fs from 'fs';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;

const logOpts = JSON.parse(JSON.stringify(config.zlogger));
logOpts.name = 'LIB:UTILS';
import Zlogger from '@punkish/zlogger';
const log = new Zlogger(logOpts);

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

function getPattern(zqltype) {

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

const checkDir = ({ dir, removeFiles = true }) => {
    log.info(`checking if dir "${dir}" exists…`, 'start');
    const exists = fs.existsSync(dir);

    if (exists) {
        log.info(' ✅ yes, it does\n', 'end');

        if (removeFiles) {
            log.info(`removing all files from ${dir} directory…`, 'start');

            if (truebug.mode !== 'dryRun') {
                fs.readdirSync(dir)
                    .forEach(f => fs.rmSync(`${dir}/${f}`));
            }

            log.info(' done\n', 'end');
        }
    }
    else {
        log.info(" ❌ it doesn't exist, so making it\n", 'end');
        
        if (truebug.mode !== 'dryRun') {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
}

// see https://sqlite.org/forum/forumpost/1f173cd9ea810bd0
function unixEpochMs(column) {
    return column
        ? `INTEGER GENERATED ALWAYS AS (
    (julianday(${column}) - 2440587.5) * 86400 * 1000
) STORED`
        : 'INTEGER DEFAULT ((julianday() - 2440587.5) * 86400 * 1000)';
};


export { 
    pathToXml, 
    timerFormat, 
    t2ms,
    re, 
    getPattern, 
    addExternalParams,
    insertAndReturnFk,
    checkDir,
    unixEpochMs
}