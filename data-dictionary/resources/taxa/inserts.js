import { insertAndReturnFk } from '../../../lib/utils.js';

export const inserts = {
    insertTaxonGet_taxa_id: (db) => {
        const insert = db.prepare(`
INSERT INTO taxa (taxon) 
VALUES (?) 
ON CONFLICT (taxon) 
DO UPDATE SET 
    id=id 
--RETURNING id AS taxa_id
`);

        const select = db.prepare(`SELECT id  
FROM taxa
WHERE taxa = ?`);

        return insertAndReturnFk({ insert, select });
    }
}