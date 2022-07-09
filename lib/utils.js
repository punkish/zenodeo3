/**
 * Convert ms into human-readable string of "? s and ? ms" 
 */
const timerFormat = function(t) {
    const s = t >= 1000 ? Math.round(t / 1000) : ''
    return s ? `${s}s ${t - (s * 1000)}ms` : `${t}ms`
}

const re = {
    date: '[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|yesterday',
    year: '^[0-9]{4}$',
    int: '[0-9]+',
    num: '([+-]?([0-9]+)(\.[0-9]+)?)',
    quotes: `['"]`,
    spc: ' *',
    units: 'kilometers|miles',
    open_parens: '\\(',
    close_parens: '\\)',
    open_curly: '\\{',
    close_curly: '\\}'
};

const getPattern = (field) => {
    let pattern;

    if (field === 'geolocation') {

        /*
         * within(radius:30,units:'kilometers',lat:20.1,lng:-120.32)
         */
        const operator1   = '(?<operator1>within)';
        const radius      = `radius:${re.spc}(?<radius>${re.int})`;
        const units       = `units:${re.spc}${re.quotes}(?<units>${re.units})${re.quotes}`;
        const lat         = `lat:${re.spc}(?<lat>${re.num})`;
        const lng         = `lng:${re.spc}(?<lng>${re.num})`;
        const condition1  = `${radius},${units},${lat},${lng}`;
        const pattern1    = `${operator1}${re.open_parens}${condition1}${re.close_parens}`;      

        /**
         * contained_in(lower_left:{lat:20.1,lng:-120.32},upper_right:{lat:20.1,lng:-120.32})
         */
        const operator2   = '(?<operator2>contained_in)';
        const min_lat     = `lat:${re.spc}(?<min_lat>${re.num})`;
        const min_lng     = `lng:${re.spc}(?<min_lng>${re.num})`;
        const max_lat     = `lat:${re.spc}(?<max_lat>${re.num})`;
        const max_lng     = `lng:${re.spc}(?<max_lng>${re.num})`;
        const lower_left  = `lower_left:${re.open_curly}${re.spc}${min_lat},${re.spc}${min_lng}${re.close_curly}`;
        const upper_right = `upper_right:${re.open_curly}${re.spc}${max_lat},${re.spc}${max_lng}${re.close_curly}`;
        const condition2  = `${lower_left},${upper_right}`;
        const pattern2    = `${operator2}${re.open_parens}${condition2}${re.close_parens}`;

        pattern           = `${pattern1}|${pattern2}`;
    }
    else if (field === 'date') {
        const operator1   = `(?<operator1>eq|since|until)?`;
        const condition1  = `(?<date>${re.date})`;
        const pattern1    = `${operator1}${re.open_parens}${condition1}${re.close_parens}`

        const operator2   = `(?<operator2>between)?`;
        const condition2  = `(?<from>${re.date})${re.spc}and${re.spc}(?<to>${re.date})`;
        const pattern2    = `${operator2}${re.open_parens}${condition2}${re.close_parens}`;

        pattern           = `${pattern1}|${pattern2}`;
    }
    else if (field === 'text') {
        operator         = `(?<operator>(eq|ne|starts_with|ends_with|contains))?`;
        condition        = '(?<text>.*)';
        pattern          = `${operator}${re.open_parens}${condition}${re.close_parens}`;
    }

    return pattern;
}

export { timerFormat, re, getPattern }