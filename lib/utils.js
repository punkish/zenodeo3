// Convert ms into human-readable string of "? s and ? ms"
const timerFormat = function(t) {
    const s = t >= 1000 ? Math.round(t / 1000) : ''
    return s ? `${s}s ${t - (s * 1000)}ms` : `${t}ms`
}

const re = {
    date: '\\d{4}-\\d{1,2}-\\d{1,2}|yesterday',
    year: '^\\d{4}$',
    real: '((\\+|-)?(\\d+)(\\.\\d+)?)|((\\+|-)?\\.?\\d+)',
    quotes: `('|")`
};

const getPattern = (field) => {
    let operator;
    let condition1;
    let condition2;
    let condition;

    if (field === 'geolocation') {
        const radius      = `\\s*radius:(?<radius>${re.real})`;
        const units       = `\\s*units:\\s*${re.quotes}(?<units>kilometers|miles)${re.quotes}`;
        const lat         = `\\s*lat:\\s*(?<lat>${re.real})`;
        const lng         = `\\s*lng:\\s*(?<lng>${re.real})`;
        const min_lat     = `lat:\\s*(?<min_lat>${re.real})`;
        const min_lng     = `lng:\\s*(?<min_lng>${re.real})`;
        const max_lat     = `lat:\\s*(?<max_lat>${re.real})`;
        const max_lng     = `lng:\\s*(?<max_lng>${re.real})`;
        const lower_left  = `\\s*lower_left:\\s*{${min_lat},\\s*${min_lng}}`;
        const upper_right = `\\s*upper_right:\\s*{${max_lat},\\s*${max_lng}}`;
        operator          = `(?<operator>within|contained_in)`;
        condition1        = `${radius},${units},${lat},${lng}`;
        condition2        = `${lower_left},${upper_right}`;
        condition         = `{(${condition1}|${condition2})}`;
    }
    else if (field === 'date') {
        operator         = `(?<operator>eq|since|until|between)?`;
        condition1       = `(?<date>${re.date})`;
        condition2       = `(?<from>${re.date})\\s*and\\s*(?<to>${re.date})`;
        condition        = `(${condition1}|${condition2})`;
    }
    else if (field === 'text') {
        operator         = `(?<operator>eq|ne|starts_with|ends_with|contains)?`;
        condition        = '(?<text>.*)';
    }

    return `^${operator}\\(${condition}\\)$`;
}

const routeOptions = (resource) => {
    return {
        method: 'GET',
        url: `/${resource.name.replace(/ /g, '').toLowerCase()}`,
        schema: {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": "https://example.com/product.schema.json",
            name: resource.name,
            summary: resource.summary,
            description: resource.description,
            response: {},
            querystring: {
                type: 'object',
                properties: {}            
            },
            tags: resource.tags
        }
    };
}

export { timerFormat, re, getPattern, routeOptions }