import { insertAndReturnFk } from '../../../lib/utils.js';

export const inserts = {
    insertPhylumGet_phyla_id: (db) => {
        const insert = db.prepare(`
INSERT INTO phyla (phylum) 
VALUES (?) 
ON CONFLICT (phylum) 
DO NOTHING
`);

        const select = db.prepare(`SELECT id  
FROM phyla
WHERE phylum = ?`);

        return insertAndReturnFk({ insert, select });
    }
}