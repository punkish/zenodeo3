import Database from 'better-sqlite3';
const db = new Database(":memory:");

function creates() {
    db.prepare('CREATE TABLE one (id INTEGER PRIMARY KEY, a, b)').run();
    db.prepare('CREATE TABLE two (id INTEGER PRIMARY KEY, c, d, one_id, a)').run();
}

function inserts() {
    db.prepare(`INSERT INTO one (a, b) VALUES ('foo', 'bar'), ('baz', 'qux')`).run();

    db.prepare(`INSERT INTO two (c, d, one_id, a) VALUES ('frob', 'blah', 1, 'foo'), ('rand', 'comt', 2, 'baz')`).run();
}

function selects() {
    const res1 = db.prepare('SELECT id, a FROM one').all();
    console.log(' res1\n', '-'.repeat(50), '\n', res1, '\n');

    const res2 = db.prepare('SELECT c, d, id, a FROM two').all();
    console.log(' res2\n', '-'.repeat(50), '\n', res2, '\n');

    const res3 = db.prepare(`SELECT * FROM one JOIN two ON one.id = two.one_id`).all();
    console.log(' res3\n', '-'.repeat(50), '\n', res3, '\n');

    const res4 = db.prepare(`SELECT one.id, one.a, one.b, two.id, two.c, two.d, two.one_id, two.a FROM one JOIN two ON one.id = two.one_id`).all();
    console.log(' res4\n', '-'.repeat(50), '\n', res4, '\n');

    const res5 = db.prepare(`SELECT one.id AS one_id, one.a AS one_a, one.b AS one_b, two.id AS two_id, two.c AS two_c, two.d AS two_d, two.one_id AS two_one_id, two.a AS two_a FROM one JOIN two ON one.id = two.one_id`).all();
    console.log(' res5\n', '-'.repeat(50), '\n', res5, '\n');
}

creates();
inserts();
selects();