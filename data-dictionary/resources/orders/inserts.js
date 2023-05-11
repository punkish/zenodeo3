import { insertAndReturnFk } from '../../../lib/utils.js';

export const inserts = {
    insertOrderGet_orders_id: (db) => {
        const insert = db.prepare(`
INSERT INTO orders ("order") 
VALUES (?) 
ON CONFLICT ("order") 
DO NOTHING
`);

        const select = db.prepare(`SELECT id  
FROM orders
WHERE "order" = ?`);

        return insertAndReturnFk({ insert, select });
    }
}