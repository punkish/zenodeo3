import Database from 'better-sqlite3';
const db = new Database(":memory:");

db.prepare(`
CREATE TABLE t (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    desc TEXT
)`).run();

const stmt = db.prepare(`
INSERT INTO t (
    title,
    desc
)
VALUES (
    @title,
    @desc
)
ON CONFLICT (title) 
DO UPDATE SET
    desc=excluded.desc
`);

const rows = [
    { title: 'foo', desc: 'this is foo' },
    { title: 'bar', desc: 'this is bar' },
    { title: 'foo', desc: 'this is foo revisited' },
    { title: 'baz', desc: 'this is baz' },
    { title: 'foo', desc: 'this is foo redone' }
];

for (const row of rows) {
    const t_id = stmt.run(row).lastInsertRowid;
    console.log(`t_id: ${t_id}`);
}

const res = db.prepare(`SELECT * FROM t`).all();
console.log(res);