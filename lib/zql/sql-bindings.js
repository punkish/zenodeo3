'use strict';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;

/** 
 * prepare and connect to the database (only for testing)
**/
import Database from 'better-sqlite3';
const db = new Database(config.db.treatments);

const query = () => {
    const sql = "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND treatments.publicationDate >= strftime('%s', @date) * 1000";
    const runparams = {
        "q": "shrimp",
        "date": "2022-09-27"
    }

    const res = db.prepare(sql).all(runparams);
    console.log(res);
}

query();