import { insertAndReturnFk } from '../../../lib/utils.js';

export const inserts = {
    insertFamilyGet_families_id: (db) => {
        const insert = db.prepare(`
INSERT INTO families (family) 
VALUES (?) 
ON CONFLICT (family) 
DO NOTHING`);

        const select = db.prepare(`SELECT id  
FROM families
WHERE family = ?`);

        return insertAndReturnFk({ insert, select });
    }
}