// import { connect } from '../../data-dictionary/dbconn.js';
// import { Config } from '@punkish/zconfig';
// const config = new Config().settings;
// import { logger } from './lib/logger.js';

import { logger, connectDb } from '../../lib/dbconn.js';

// function openDb() {
//     const db = connect({
//         dbconfig: config.database,
//         logger
//     });
//     return db;
// }

function migrate() {
    const db = connectDb();
    db.exec(`
        UPDATE chunks.embedding_progress p
        SET status = 'chunked'
        WHERE status = 'indexed'
        AND p.treatments_id NOT IN (
            SELECT DISTINCT cv.treatments_id 
            FROM chunks.chunk_vectors cv
        )
    `)
}

migrate();