import Database from 'better-sqlite3';
const db = new Database('foo.sqlite');
const db1 = new Database('bar.sqlite');

db.prepare("ATTACH 'bar.sqlite' AS bar").run();
db.prepare('CREATE TABLE foo(id, a, b, c)').run();
db.prepare('CREATE TABLE bar.bar(id, a, b, c)').run();
db.prepare(`CREATE VIRTUAL TABLE ftsFoo USING FTS5(a, content='')`).run();
db.prepare(`CREATE VIRTUAL TABLE bar.ftsBar USING FTS5(b, content='')`).run();
db.prepare(`CREATE TRIGGER foo_afterInsert AFTER INSERT ON foo 
BEGIN
    INSERT INTO ftsFoo (rowid, a) 
    VALUES (new.id, new.a);
END;`).run();
db.prepare(`CREATE TRIGGER bar.bar_afterInsert AFTER INSERT ON bar 
WHEN new.c = 1
BEGIN
    INSERT INTO ftsBar (rowid, b) 
    VALUES (new.id, new.b);
END;`).run();

db.prepare(`INSERT INTO foo VALUES 
    (1, 'one', 'blah', 0),
    (2, 'two', 'drat', 0),
    (3, 'thr', 'frob', 1),
    (4, 'fou', 'snak', 0);`).run();
db.prepare(`INSERT INTO bar.bar VALUES 
    (1, 'one', 'blah', 0),
    (2, 'two', 'drat', 0),
    (3, 'thr', 'frob', 1),
    (4, 'fou', 'snak', 0);`).run();

console.log('rows from foo');
console.log('-'.repeat(50));
let res = db.prepare('SELECT * FROM foo').all();
console.log(res, '\n');

console.log('rows from ftsFoo');
console.log('-'.repeat(50));
res = db.prepare("SELECT rowid FROM ftsFoo WHERE a MATCH 'two'").all();
console.log(res, '\n');

console.log('rows from bar.ftsBar');
console.log('-'.repeat(50));
res = db.prepare('SELECT rowid, b FROM bar.ftsBar').all();
console.log(res, '\n');