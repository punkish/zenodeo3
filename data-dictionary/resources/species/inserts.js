import { insertAndReturnFk } from '../../../lib/utils.js';

export const inserts = {
    insertSpeciesGet_species_id: (db) => {
        const insert = db.prepare(`
INSERT INTO species (species) 
VALUES (?) 
ON CONFLICT (species) 
DO NOTHING
`);

        const select = db.prepare(`SELECT id  
FROM species
WHERE species = ?`);

        return insertAndReturnFk({ insert, select });
    }
}