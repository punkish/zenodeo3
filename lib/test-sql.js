import { Config } from '@punkish/zconfig';
const config = new Config().settings;

/** 
 * prepare and connect to the database (only for testing)
**/
import Database from 'better-sqlite3';
const db = new Database(config.db.treatments);

const sql1 = 'SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments WHERE treatments.treatmentId = @treatmentId';

const sql2 = 'SELECT Count(DISTINCT materialsCitations.materialsCitationId) AS num_of_records FROM materialsCitations WHERE materialsCitations.treatmentId = @treatmentId';

const tId = '00078788D744DE18E88B8B8BFE7FDBF9';
const runparams1 = {
    'treatments.treatmentId': tId
}

const runparams2 = {
    'treatmentId': tId
}

const runparams3 = {
    'bibRefCitations.treatmentId': tId
}

const _sqlRunner = function(sql, runparams) {
    try {
        const res = db.prepare(sql).all(runparams);
        console.log(res);
    }
    catch(error) {
        console.error(sql);
        console.error(runparams)
        throw error;
    }
}

//_sqlRunner(sql1, runparams1);
//_sqlRunner(sql2, runparams1);

// _sqlRunner(sql1, runparams2);
// _sqlRunner(sql2, runparams2);

_sqlRunner(sql1, runparams3);
_sqlRunner(sql2, runparams3);