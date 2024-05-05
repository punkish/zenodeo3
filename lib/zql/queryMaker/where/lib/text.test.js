import tap from 'tap';
import { text } from './text.js';

const tests = [
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
            constraint: "treatments.treatmentTitle LIKE @treatmentTitle",
            runparams: { treatmentTitle: "Biodiversity%" }
        }
    },
    {
        input: { 
            col: {
                where: 'treatments.treatmentTitle', 
                name: 'treatmentTitle'
            },
            val: 'Biodiversity',
            operator: 'postglob'
        },
        wanted: {
            constraint: "treatments.treatmentTitle LIKE @treatmentTitle",
            runparams: { treatmentTitle: 'Biodiversity%' }
        }
    },
    {
        input: { 
            col: {
                where: 'treatments.treatmentTitle', 
                name: 'treatmentTitle'
            },
            val: 'Biodiversity',
            operator: 'starts_with'
        },
        wanted: {
            constraint: "treatments.treatmentTitle LIKE @treatmentTitle",
            runparams: { treatmentTitle: 'Biodiversity%' }
        }
    },
    {
        input: { 
            col: {
                where: 'treatments.treatmentTitle', 
                name: 'treatmentTitle'
            },
            val: 'Biodiversity',
            operator: 'ends_with'
        },
        wanted: {
            constraint: "treatments.treatmentTitle LIKE @treatmentTitle",
            runparams: { treatmentTitle: "%Biodiversity" }
        }
    },
    {
        input: { 
            col: {
                where: 'treatments.treatmentTitle', 
                name: 'treatmentTitle'
            },
            val: 'Biodiversity',
            operator: 'preglob'
        },
        wanted: {
            constraint: "treatments.treatmentTitle LIKE @treatmentTitle",
            runparams: { treatmentTitle: "%Biodiversity" }
        }
    },
    {
        input: { 
            col: {
                where: 'treatments.treatmentTitle', 
                name: 'treatmentTitle'
            },
            val: 'Biodiversity',
            operator: 'contains'
        },
        wanted: {
            constraint: "treatments.treatmentTitle LIKE @treatmentTitle",
            runparams: { treatmentTitle: "%Biodiversity%" }
        }
    },
    {
        input: { 
            col: {
                where: 'treatments.treatmentTitle', 
                name: 'treatmentTitle'
            },
            val: 'Biodiversity',
            operator: 'bothglobs'
        },
        wanted: {
            constraint: "treatments.treatmentTitle LIKE @treatmentTitle",
            runparams: { treatmentTitle: "%Biodiversity%" }
        }
    },
    {
        input: { 
            col: {
                where: 'treatments.treatmentTitle', 
                name: 'treatmentTitle'
            },
            val: 'Biodiversity',
            operator: 'eq'
        },
        wanted: {
            constraint: "treatments.treatmentTitle = @treatmentTitle",
            runparams: { treatmentTitle: "Biodiversity" }
        }
    },
    {
        input: { 
            col: {
                where: 'treatments.treatmentTitle', 
                name: 'treatmentTitle'
            },
            val: 'Biodiversity',
            operator: 'ne'
        },
        wanted: {
            constraint: "treatments.treatmentTitle != @treatmentTitle",
            runparams: { treatmentTitle: "Biodiversity" }
        }
    },
    {
        input: { 
            col: {
                where: 'treatments.treatmentTitle', 
                name: 'treatmentTitle'
            },
            val: 'Biodiversity',
            operator: 'not_like'
        },
        wanted: {
            constraint: "treatments.treatmentTitle NOT LIKE @treatmentTitle",
            runparams: { treatmentTitle: "Biodiversity" }
        }
    }
];

tap.test('text', tap => {
    tests.forEach(test => {
        const found = text(test.input);
        tap.same(found, test.wanted);
    });

    tap.end();
});