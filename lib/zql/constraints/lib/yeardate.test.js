import tap from 'tap';
import { year, date } from './yeardate.js';

const testsDate = [
    {
        input: { key: 'publicationDate', val: 'since(2008-09-12)' },
        output: {
            constraint: "publicationDateMs >= ((julianday('@publicationDate') - 2440587.5) * 86400000)",
            debug: "publicationDateMs >= ((julianday('2008-09-12') - 2440587.5) * 86400000)",
            runparams: {
                publicationDate: '2008-09-12'
            }
        }
    },
    {
        input: { key: 'publicationDate', val: 'until(2008-09-12)' },
        output: {
            constraint: "publicationDateMs <= ((julianday('@publicationDate') - 2440587.5) * 86400000)",
            debug: "publicationDateMs <= ((julianday('2008-09-12') - 2440587.5) * 86400000)",
            runparams: {
                publicationDate: '2008-09-12'
            }
        }
    },
    {
        input: { key: 'publicationDate', val: '2008-9-12' },
        output: {
            constraint: "publicationDateMs = ((julianday('@publicationDate') - 2440587.5) * 86400000)",
            debug: "publicationDateMs = ((julianday('2008-09-12') - 2440587.5) * 86400000)",
            runparams: { publicationDate: '2008-09-12' }
        }
    },
    {
        input: { key: 'publicationDate', val: 'between(2008-03-12 and 2009-9-1)' },
        output: {
            constraint: "publicationDateMs BETWEEN ((julianday('@from') - 2440587.5) * 86400000) AND ((julianday('@to') - 2440587.5) * 86400000)",
            debug: "publicationDateMs BETWEEN ((julianday('2008-03-12') - 2440587.5) * 86400000) AND ((julianday('2009-09-01') - 2440587.5) * 86400000)",
            runparams: {
                from: '2008-03-12',
                to: '2009-09-01'
            }
        }
    }
];

tap.test('date constraints', tap => {
    testsDate.forEach(test => {
        tap.same(
            date(test.input), 
            test.output, 
            `date(${test.input}) "${test.output.constraint}"`
        );
    });

    tap.end();
});

const testsYear = [
    {
        input: { key: 'journalYear', val: 'since(2008)' },
        output: {
            constraint: 'journalYear >= @journalYear',
            debug: 'journalYear >= 2008',
            runparams: { journalYear: 2008 }
          }
    },
    {
        input: { key: 'journalYear', val: 'until(2008)' },
        output: {
            constraint: 'journalYear <= @journalYear',
            debug: 'journalYear <= 2008',
            runparams: { journalYear: 2008 }
          }
    },
    {
        input: { key: 'journalYear', val: '2008' },
        output: {
            constraint: 'journalYear = @journalYear',
            debug: 'journalYear = 2008',
            runparams: { journalYear: 2008 }
          }
    },
    {
        input: { key: 'journalYear', val: 'between(2008 and 2009)' },
        output: {
            constraint: 'journalYear BETWEEN @from AND @to',
            debug: 'journalYear BETWEEN 2008 AND 2009',
            runparams: { from: 2008, to: 2009 }
          }
    }
];

tap.test('year constraints', tap => {
    testsYear.forEach(test => {
        tap.same(
            year(test.input), 
            test.output, 
            `year(${JSON.stringify(test.input)}') "${test.output.constraint}"`
        );
    });

    tap.end();
});