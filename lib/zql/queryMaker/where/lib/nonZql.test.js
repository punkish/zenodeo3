import tap from 'tap';
import { nonZql } from './nonZql.js';

const tests = [

    // 0
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
    },

    // 1
    {
        input: { 
            col: {
                where: 'treatmentsFts.treatmentsFts', 
                name: 'q'
            },
            val: 'Biodiversity',
            operator: 'MATCH'
        },
        wanted: {
            constraint: "treatmentsFts.treatmentsFts MATCH @q",
            runparams: { 
                q: "Biodiversity",
                cssClass: "hilite",
                sides: 50
            }
        }
    },

    // 2
    {
        input: { 
            col: {
                where: 'treatments.treatmentTitle', 
                name: 'treatmentTitle'
            },
            val: 'Biodiversity',
            operator: 'NOT LIKE'
        },
        wanted: {
            constraint: "treatments.treatmentTitle NOT LIKE @treatmentTitle",
            runparams: { treatmentTitle: "Biodiversity" }
        }
    },

    // 3
    {
        input: { 
            col: {
                where: 'treatments.treatmentTitle', 
                name: 'treatmentTitle'
            },
            val: 'Biodiversity',
            operator: '='
        },
        wanted: {
            constraint: "treatments.treatmentTitle = @treatmentTitle",
            runparams: { treatmentTitle: "Biodiversity" }
        }
    },

    // 4
    {
        input: { 
            col: {
                where: 'treatments.treatmentTitle', 
                name: 'treatmentTitle'
            },
            val: 'Biodiversity',
            operator: '!='
        },
        wanted: {
            constraint: "treatments.treatmentTitle != @treatmentTitle",
            runparams: { treatmentTitle: "Biodiversity" }
        }
    }
];


tests.forEach((test, i) => {

    tap.test(`non zql ${i}`, tap => {
        const found = nonZql(test.input);
        tap.same(found, test.wanted);
        tap.end();
    });

});

    