import { insertAndReturnFk } from '../../../lib/utils.js';

export const inserts = {
    insertKingdomGet_kingdoms_id: (db) => {
        const insert = db.prepare(`
INSERT INTO kingdoms (kingdom) 
VALUES (?) 
ON CONFLICT (kingdom) 
DO NOTHING
`);

        const select = db.prepare(`SELECT id  
FROM kingdoms
WHERE kingdom = ?`);

        return insertAndReturnFk({ insert, select });
    }
}