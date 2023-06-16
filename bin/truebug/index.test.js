import tap from 'tap';
import { 
    getWeekOfYear, 
    getPeriodOfArchive, 
    pruneTypesOfArchives 
} from './lib/utils.js';
import * as database from './lib/database/index.js';

const tests1 = [
    { input: '2023-01-01', output: 1 },
    { input: '2023-01-07', output: 1 },
    { input: '2023-01-08', output: 2 },
    { input: '2023-12-31', output: 53 },
];

const tests2 = [
    { input: { typeOfArchive: 'yearly',  date: '2023-06-15' }, output: 2023 },
    { input: { typeOfArchive: 'monthly', date: '2023-06-15' }, output: 6    },
    { input: { typeOfArchive: 'weekly',  date: '2023-06-15' }, output: 24   },
    { input: { typeOfArchive: 'daily',   date: '2023-06-15' }, output: 166  },
];



tap.test('utils', t => {
    t.test('getWeekOfYear: calculates week of year', t => {
        tests1.forEach(io => {
            const result = getWeekOfYear(new Date(io.input));
            t.equal(result, io.output, `${io.input} is week ${io.output}`);
        });

        t.end();
    });

    t.test('getPeriodOfArchive: calculates period of archive', t => {
        tests2.forEach(io => {
            const result = getPeriodOfArchive(
                io.input.typeOfArchive, 
                new Date(io.input.date)
            );

            t.equal(
                result, 
                io.output, 
                `period of "${io.input.typeOfArchive}" archive is ${io.output}`
            );
        });

        t.end();
    });

    t.test('pruneTypesOfArchives: returns archives to process', t => {

        const allTypesOfArchives = [
            'yearly',
            'monthly',
            'weekly',
            'daily'
        ];
        
        const lastUpdates = database.getLastUpdate();
        const typesOfArchives = JSON.parse(JSON.stringify(allTypesOfArchives));

        for (const last of lastUpdates) {
            pruneTypesOfArchives(last, typesOfArchives);
        }

        const input = JSON.stringify(typesOfArchives);
        const output = JSON.stringify([ 'daily' ]);

        t.equal(input, output, `archives are ${output}`);

        t.end();
    });

    t.end();
});