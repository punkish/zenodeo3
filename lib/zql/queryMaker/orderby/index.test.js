import tap from 'tap';
import { getOrderBy } from './index.js';

const tests = [
    {
        input: {
            params: {
                sortby: 'treatmentTitle:asc',
            }
        },
        wanted: [ 'treatmentTitle ASC' ]
    },
    {
        input: {
            params: {
                sortby: 'treatmentTitle:desc',
            }
        },
        wanted: [ 'treatmentTitle DESC' ]
    },
    {
        input: {
            params: {
                sortby: 'treatmentTitle:asc,checkinTime:desc',
            }
        },
        wanted: [ 'treatmentTitle ASC', 'checkinTime DESC' ]
    }
];


tap.test('order by', tap => {
    tests.forEach(test => {
        const found = getOrderBy(test.input);
        tap.same(found, test.wanted);
    });

    tap.end();
});