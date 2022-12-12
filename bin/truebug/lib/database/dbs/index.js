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
    main: {
        z3: z3
    },
    attached: {
        tr: treatments,
        tc: treatmentcitations,
        ta: treatmentauthors,
        bc: bibrefcitations,
        fc: figurecitations,
        mc: materialcitations,
        ti: treatmentimages
    }
}

export { databases }