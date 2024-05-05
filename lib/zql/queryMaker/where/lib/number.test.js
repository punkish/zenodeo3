import tap from 'tap';
import { number } from './number.js';

const tests = [
    {
        input: {
            val: 5,
            col: {
                where: 'treatments.versionNumber',
                name: 'versionNumber'
            },
            operator: '='
        },
        wanted: {
            constraint: 'treatments.versionNumber = @versionNumber',
            runparams: {
                versionNumber: 5
            }
        }
    }
];

tap.test('number', tap => {
    tests.forEach(test => {
        const found = number(test.input);
        tap.same(found, test.wanted);
    });

    tap.end();
});