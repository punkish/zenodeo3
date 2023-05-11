import tap from 'tap';
import { text } from './text.js';

const tests = [
    {
        input: { key: 'foo', val: 'bar' },
        output: {
            "constraint": "foo = @foo",
            "debug": "foo = 'bar'",
            "runparams": {
                "foo": "bar"
            }
        }
    },
    {
        input: { key: 'foo', val: 'bar*' },
        output: {
            constraint: "foo LIKE '@foo%'",
            debug: "foo LIKE 'bar%'",
            runparams: { foo: 'bar' }
        }
    },
    {
        input: { key: 'foo', val: 'starts_with(bar)' },
        output: {
            constraint: "foo LIKE '@foo%'",
            debug: "foo LIKE 'bar%'",
            runparams: { foo: 'bar' }
        }
    },
    {
        input: { key: 'foo', val: '*bar' },
        output: {
            constraint: "foo LIKE '%@foo'",
            debug: "foo LIKE '%bar'",
            runparams: { foo: 'bar' }
        }
    },
    {
        input: { key: 'foo', val: 'ends_with(bar)' },
        output: {
            constraint: "foo LIKE '%@foo'",
            debug: "foo LIKE '%bar'",
            runparams: { foo: 'bar' }
        }
    },
    {
        input: { key: 'foo', val: '*bar*' },
        output: {
            constraint: "foo LIKE '%@foo%'",
            debug: "foo LIKE '%bar%'",
            runparams: { foo: 'bar' }
        }
    },
    {
        input: { key: 'foo', val: 'contains(bar)' },
        output: {
            constraint: "foo LIKE '%@foo%'",
            debug: "foo LIKE '%bar%'",
            runparams: { foo: 'bar' }
        }
    },
    {
        input: { key: 'foo', val: 'eq(bar)' },
        output: {
            constraint: "foo = '@foo' COLLATE BINARY",
            debug: "foo = 'bar' COLLATE BINARY",
            runparams: { foo: 'bar' }
        }
    },
    {
        input: { key: 'foo', val: 'not_like(bar)' },
        output: {
            constraint: "foo NOT LIKE '@foo'",
            debug: "foo NOT LIKE 'bar'",
            runparams: { foo: 'bar' }
        }
    },
    {
        input: { key: 'foo', val: 'ne(bar)' },
        output: {
            constraint: "foo != '@foo' COLLATE BINARY",
            debug: "foo != 'bar' COLLATE BINARY",
            runparams: { foo: 'bar' }
        }
    } 
];

tap.test('text constraints', tap => {
    tests.forEach(test => {
        tap.same(
            text(test.input), 
            test.output, 
            `text(${JSON.stringify(test.input)}) is ok`
        );
    });

    tap.end();
});