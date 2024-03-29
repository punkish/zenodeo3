'use strict';

import * as treatments from './treatments/treatments.js';
import * as treatmentcitations from './treatments/treatmentcitations.js';
import * as treatmentauthors from './treatments/treatmentauthors.js';
import * as bibrefcitations from './treatments/bibrefcitations.js';
import * as figurecitations from './treatments/figurecitations.js';
import * as materialcitations from './treatments/materialcitations.js';
import * as treatmentimages from './treatments/treatmentimages.js';
import * as z3 from './z3.js';

const databases = {
    main: [
        { alias: 'z3', parts: z3 }
    ],
    attached: [
        { alias: 'tr', parts: treatments },
        { alias: 'tc', parts: treatmentcitations },
        { alias: 'ta', parts: treatmentauthors },
        { alias: 'bc', parts: bibrefcitations },
        { alias: 'fc', parts: figurecitations },
        { alias: 'mc', parts: materialcitations },
        { alias: 'ti', parts: treatmentimages }
    ]
}

export { databases }