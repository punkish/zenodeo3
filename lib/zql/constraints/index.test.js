import tap from 'tap';
import { where } from './index.js';

const tests = [
    {
        input: { 
            resource: 'treatments', 
            params: {
                treatmentId: 'foobar'
            }
        },
        output: {
            constraints: [ 'treatments."treatmentId" = @treatmentId' ],
            debug: [ `treatments."treatmentId" = 'foobar'` ],
            runparams: { treatmentId: 'foobar' }
        }
    }
];

tap.test('where', tap => {
    tests.forEach(test => {
        tap.same(
            where(test.input), 
            test.output, 
            `where(${JSON.stringify(test.input)}) is ok`
        );
    });

    tap.end();
});