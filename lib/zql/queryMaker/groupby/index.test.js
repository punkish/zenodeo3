import tap from 'tap';
import { getGroupBy } from './index.js';

const tests = [
    {
        input: {
            params: {
                groupby: 'treatmentTitle'
            }
        },
        wanted: 'treatmentTitle'
    }
];


tap.test('order by', tap => {
    tests.forEach(test => {
        const found = getGroupBy(test.input);
        tap.same(found, test.wanted);
    });

    tap.end();
});