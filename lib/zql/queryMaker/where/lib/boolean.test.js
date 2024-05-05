import tap from 'tap';
import { boolean } from './boolean.js';

const tests = [
    {
        input: {
            col: {
                where: 'treatments.validGeo',
                name: 'validGeo'
            },
            val: true,
            operator: '='
        },
        wanted: {
            constraint: 'treatments.validGeo = @validGeo',
            runparams: { validGeo: true }
        }
    },
    {
        input: {
            col: {
                where: 'treatments.validGeo',
                name: 'validGeo'
            },
            val: false,
            operator: '='
        },
        wanted: {
            constraint: 'treatments.validGeo = @validGeo',
            runparams: { validGeo: false }
        }
    },
    {
        input: {
            col: {
                where: 'treatments.validGeo',
                name: 'validGeo'
            },
            val: 'true',
            operator: '='
        },
        wanted: {
            constraint: 'treatments.validGeo = @validGeo',
            runparams: { validGeo: true }
        }
    },
    {
        input: {
            col: {
                where: 'treatments.validGeo',
                name: 'validGeo'
            },
            val: 'false',
            operator: '='
        },
        wanted: {
            constraint: 'treatments.validGeo = @validGeo',
            runparams: { validGeo: false }
        }
    },
    {
        input: {
            col: {
                where: 'treatments.validGeo',
                name: 'validGeo'
            },
            val: 1,
            operator: '='
        },
        wanted: {
            constraint: 'treatments.validGeo = @validGeo',
            runparams: { validGeo: 1 }
        }
    },
    {
        input: {
            col: {
                where: 'treatments.validGeo',
                name: 'validGeo'
            },
            val: 0,
            operator: '='
        },
        wanted: {
            constraint: 'treatments.validGeo = @validGeo',
            runparams: { validGeo: 0 }
        }
    }
];


tap.test('boolean', tap => {
    tests.forEach(test => {
        const found = boolean(test.input);
        tap.same(found, test.wanted);
    });

    tap.end();
});