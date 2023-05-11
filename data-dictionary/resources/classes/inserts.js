import { insertAndReturnFk } from '../../../lib/utils.js';

export const inserts = {
    insertClassGet_classes_id: (db) => {
        const insert = db.prepare(`
INSERT INTO classes (class) 
VALUES (?) 
ON CONFLICT (class) 
DO NOTHING`);

        const select = db.prepare(`SELECT id  
FROM classes
WHERE class = ?`);

        return insertAndReturnFk({ insert, select });
    }
}