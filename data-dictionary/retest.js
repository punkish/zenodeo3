'use strict';

const re = {
    date: '\\d{4}-\\d{1,2}-\\d{1,2}',
    year: '^\\d{4}$',
    real: '((\\+|-)?(\\d+)(\\.\\d+)?)|((\\+|-)?\\.?\\d+)'
}

const getPattern = (field) => {
    let operator;
    let condition1;
    let condition2;
    let condition;

    if (field === 'location') {
        const radius     = `\\s*radius:(?<radius>${re.real})`;
        const units      = `\\s*units:\\s*'(?<units>kilometers|miles)'`;
        const lat        = `\\s*lat:\\s*(?<latitude>${re.real})`;
        const lng        = `\\s*lng:\\s*(?<longitude>${re.real})`;
        const ll_lat     = `lat:\\s*(?<ll_latitude>${re.real})`;
        const ll_lng     = `lng:\\s*(?<ll_longitude>${re.real})`;
        const ur_lat     = `lat:\\s*(?<ur_latitude>${re.real})`;
        const ur_lng     = `lng:\\s*(?<ur_longitude>${re.real})`;
        const lowerLeft  = `\\s*lowerLeft:\\s*{${ll_lat},\\s*${ll_lng}}`;
        const upperRight = `\\s*upperRight:\\s*{${ur_lat},\\s*${ur_lng}}`;
        operator         = `(?<operator>within|containedIn)`;
        condition1       = `${radius},${units},${lat},${lng}`;
        condition2       = `${lowerLeft},${upperRight}`;
        condition        = `{(${condition1}|${condition2})}`;
    }
    else if (field === 'publicationDate') {
        operator         = `(?<operator>eq|since|until|between)?`;
        condition1       = `(?<date>${re.date})`;
        condition2       = `(?<from>${re.date})\\s*and\\s*(?<to>${re.date})`;
        condition        = `(${condition1}|${condition2})`;
    }

    return `^${operator}\\(${condition}\\)$`;
}

const str1 = "within({radius:10, units: 'kilometers', lat:40.00, lng: -120})";
const str2 = "containedIn({lowerLeft:{lat: -40.00, lng: -120},upperRight: {lat:23,lng:6.564}})";

let regexp = getPattern('location');
let res = str1.match(regexp);
console.log(res.input, res.groups);
res = str2.match(regexp);
console.log(res.input, res.groups);

regexp = getPattern('publicationDate');
console.log(regexp);

const str3 = "since(2018-12-03)";
res = str3.match(regexp);
console.log(res.input, res.groups);

const str4 = "until(2018-03-22)";
res = str4.match(regexp);
console.log(res.input, res.groups);

const str5 = "between(2018-03-22 and 2019-12-03)";
res = str5.match(regexp);
console.log(res.input, res.groups);

const str6 = "eq(2018-03-22)";
res = str6.match(regexp);
console.log(res.input, res.groups);