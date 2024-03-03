import { initDb } from '../lib/dbconn.js';
const db = initDb();
const hierarchies = [
    {
        table: 'kingdoms',
        column: 'kingdom',
        sql: `SELECT kingdom, Count(kingdom) AS value
        FROM treatments JOIN 
            kingdoms ON treatments.kingdoms_id = kingdoms.id 
        GROUP BY kingdom`
    },
    {
        table: 'phyla',
        column: 'phylum',
        sql: `SELECT phylum, Count(phylum) AS count
        FROM treatments JOIN 
            phyla ON phyla_id = phyla.id 
        WHERE kingdoms_id = @kingdoms_id 
        GROUP BY phylum`
    },
    {
        table: 'classes',
        column: 'class',
        sql: `SELECT "class", Count("class") AS count 
        FROM treatments JOIN 
            classes ON classes_id = classes.id 
        WHERE kingdoms_id = @kingdoms_id AND 
            phyla_id = @phyla_id 
        GROUP BY "class"`
    },
    {
        table: 'orders',
        column: 'order',
        sql: `SELECT "order", Count("order") AS count 
        FROM treatments JOIN 
            orders ON orders_id = orders.id 
        WHERE kingdoms_id = @kingdoms_id AND 
            phyla_id = @phyla_id AND
            classes_id = @classes_id 
        GROUP BY "order"`
    },
    {
        table: 'families',
        column: 'family',
        sql: `SELECT family, Count(family) AS count 
        FROM treatments JOIN 
            families ON families_id = families.id 
        WHERE kingdoms_id = @kingdoms_id AND 
            phyla_id = @phyla_id AND
            classes_id = @classes_id AND
            orders_id = @orders_id
        GROUP BY family`
    },
    {
        table: 'genera',
        column: 'genus',
        sql: `SELECT genus, Count(genus) AS count 
        FROM treatments JOIN 
            genera ON genera_id = genera.id 
        WHERE kingdoms_id = @kingdoms_id AND 
            phyla_id = @phyla_id AND
            classes_id = @classes_id AND
            orders_id = @orders_id AND
            families_id = @families_id
        GROUP BY genus`
    },
    {
        table: 'species',
        column: 'species',
        sql: `SELECT species, Count(species) AS count 
        FROM treatments JOIN 
            species ON species_id = species.id 
        WHERE kingdoms_id = @kingdoms_id AND 
            phyla_id = @phyla_id AND
            classes_id = @classes_id AND
            orders_id = @orders_id AND
            families_id = @families_id AND 
            genera_id = @genera_id
        GROUP BY species`
    }
];

function query(sql) {
    const res = db.conn.prepare(sql).all();
    console.log(res)
}

query(hierarchies[0].sql);