import { insertAndReturnFk } from '../../../lib/utils.js';

export const inserts = {
    insertGenusGet_genera_id: (db) => {
        const insert = db.prepare(`
INSERT INTO genera (genus) VALUES (?) ON CONFLICT (genus) DO NOTHING
        `);

        const select = db.prepare('SELECT id FROM genera WHERE genus = ?');

        return insertAndReturnFk({ insert, select });
    }
}