import tap from 'tap';
import * as funcsToTest from './utils.js';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;

const testGroups = {
    pathToXml: [
        {
            input: 'E83A2C2AFF8DFFA5FF76FC9F5ADD6BFE',
            wanted: `${config.newbug.dirs.archive}/E/E8/E83`
        }
    ],

    timerFormat: [
        {
            input: [5, 20000000],
            wanted: '5s 2.00ms'
        }
    ],

    t2ms: [
        {
            input: [5, 20000000],
            wanted: 5002
        }
    ],

    unixEpochMs: [
        {
            input: 'checkinTime',
            wanted: `INTEGER GENERATED ALWAYS AS (
    (julianday(checkinTime) - 2440587.5) * 86400 * 1000
) STORED`
        },
        {
            input: '',
            wanted: `INTEGER DEFAULT ((julianday() - 2440587.5) * 86400 * 1000)`
        }
    ],

    getPattern: [
        {
            input: 'geolocation',
            wanted: `(?<operator>within)\\((radius:\\s*(?<radius>[0-9]+),\\s*units:\\s*['"](?<units>kilometers|miles)['"],\\s*lat:\\s*(?<lat>([+-]?([0-9]+)(\.[0-9]+)?)),\\s*lng:\\s*(?<lng>([+-]?([0-9]+)(\.[0-9]+)?))|min_lat:\\s*(?<min_lat>([+-]?([0-9]+)(\.[0-9]+)?)),min_lng:\\s*(?<min_lng>([+-]?([0-9]+)(\.[0-9]+)?)),max_lat:\\s*(?<max_lat>([+-]?([0-9]+)(\.[0-9]+)?)),max_lng:\\s*(?<max_lng>([+-]?([0-9]+)(\.[0-9]+)?)))\\)`
        },
        {
            input: 'datetime',
            wanted: `(?<operator1>eq|since|until)?\\((?<date>[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|yesterday)\\)|(?<operator2>between)?\\((?<from>[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|yesterday)\\s*and\\s*(?<to>[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|yesterday)\\)`
        },
        {
            input: 'year',
            wanted: `(?<operator1>eq|since|until)?\\((?<year>[0-9]{4})\\)|(?<operator2>between)?\\((?<from>[0-9]{4})\\s*and\\s*(?<to>[0-9]{4})\\)`
        },
        {
            input: 'text',
            wanted: `((?<operator>(eq|ne|starts_with|ends_with|contains|not_like))\\(|(?<preglob>\\*?))(?<operand>(\\w|\\s)+)(\\)|(?<postglob>\\*?))`
        }
    ]
}

// Object.keys(testGroups).forEach((testGroupName) => {
//     const tests = testGroups[testGroupName];
    
//     tests.forEach((test, i) => {
//         tap.test(`${testGroupName} ${i}`, tap => {
//             const found = funcsToTest[testGroupName](test.input);
//             tap.same(found, test.wanted);
//             tap.end();
//         });
//     });
// });

const sql = `SELECT Count(*) AS c FROM table WHERE foo = @foo AND id = @id`;
const params = { id: '1', foo: "'foo'" };
const formattedSql = funcsToTest.formatSql(sql, params);
console.log(formattedSql);
const unFormattedSql = funcsToTest.unFormatSql(formattedSql);
console.log(unFormattedSql)