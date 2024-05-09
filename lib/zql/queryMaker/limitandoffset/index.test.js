import tap from 'tap';
import { getLimitAndOffset } from './index.js';

const tests = [
    {
        input: {
            params: {
                page: 1,
                size: 30
            }
        },
        wanted: {
            limit: 30,
            offset: 0
        }
    },
    {
        input: {
            params: {
                page: 5,
                size: 30
            }
        },
        wanted: {
            limit: 30,
            offset: 120
        }
    },
    {
        input: {
            params: {
                page: -1,
                size: 30
            }
        },
        wanted: {
            limit: 30,
            offset: 0
        }
    }
];


tap.test('order by', tap => {
    tests.forEach(test => {
        const found = getLimitAndOffset(test.input);
        tap.same(found, test.wanted);
    });

    tap.end();
});