import { insertAndReturnFk } from '../../../lib/utils.js';

export const inserts = {
    insertJournalGet_journals_id: (db) => {
        const insert = db.prepare(`
INSERT INTO journals (journalTitle) 
VALUES (?) 
ON CONFLICT (journalTitle) 
DO NOTHING
`)

        const select = db.prepare(`SELECT id  
FROM journals
WHERE journalTitle = ?`);

        return insertAndReturnFk({ insert, select });
    }
}