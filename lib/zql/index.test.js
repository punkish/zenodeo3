'use strict'

import { preZql } from './index.js';
import { sampleQueries } from './sample-queries.js';

describe('ZQL', () => {
    const tests = [ ...sampleQueries ]

    tests.forEach((t, i) => {
        test(t.desc, () => {
            expect(preZql(t.input)).toEqual(t.output)
        })
    })
})