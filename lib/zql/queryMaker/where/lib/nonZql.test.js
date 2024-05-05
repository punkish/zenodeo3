import tap from 'tap';
import { nonZql } from './nonZql.js';

const tests = [
    {
        input: { 
            col: {
                where: 'treatments.treatmentTitle', 
                name: 'treatmentTitle'
            },
            val: 'Biodiversity',
            operator: 'LIKE'
        },
        wanted: {
            constraint: "treatments.treatmentTitle LIKE @treatmentTitle",
            runparams: { treatmentTitle: "Biodiversity%" }
        }
    }
];

tap.test('non zql', tap => {
    tests.forEach(test => {
        const found = nonZql(test.input);
        tap.same(found, test.wanted);
    });

    tap.end();
});